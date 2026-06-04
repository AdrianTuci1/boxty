import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export async function authPlugin(app) {
  app.decorate('authenticate', async function(request, reply) {
    try {
      const auth = request.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
          request.user = jwt.verify(token, config.jwtSecret);
          return;
        } catch (jwtErr) {
          // Not a valid JWT, try as API key
          const keyItem = await getItem(`API_KEY#${token}`, 'META');
          if (keyItem) {
            request.user = {
              id: keyItem.user_id, apiKey: true,
              workspace_id: keyItem.workspace_id || '*',
              environment_ids: keyItem.environment_ids || ['*'],
              permissions: keyItem.permissions || ['read', 'write', 'deploy'],
            };
            return;
          }
          throw new Error('Invalid token');
        }
      }
      if (auth.startsWith('ApiKey ') || auth.startsWith('Token ')) {
        const key = auth.slice(auth.indexOf(' ') + 1);
        const keyItem = await getItem(`API_KEY#${key}`, 'META');
        if (!keyItem) {
          throw new Error('Invalid API key');
        }
        request.user = {
          id: keyItem.user_id,
          apiKey: true,
          workspace_id: keyItem.workspace_id || '*',
          environment_ids: keyItem.environment_ids || ['*'],
          permissions: keyItem.permissions || ['read', 'write', 'deploy'],
        };
        return;
      }
      throw new Error('Missing auth');
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: err.message });
    }
  });

  app.decorate('authenticateWorker', async function(request, reply) {
    const key = request.headers['x-worker-key'] || '';
    if (key !== config.workerApiKey) {
      reply.status(403).send({ error: 'Forbidden' });
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, reply) => {
    const { email, password } = req.body;
    const existing = await queryByPK(`USER#${email}`, { Limit: 1 });
    if (existing.length > 0) {
      return reply.status(409).send({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const userName = req.body.name || email.split('@')[0];
    const now = new Date().toISOString();
    await putItem({ pk: `USER#${email}`, sk: 'META', id: userId, email, name: userName, created_at: now });
    await putItem({ pk: `USER#${email}`, sk: `PASSWORD#${hash}`, user_id: userId });
    await putItem({ pk: `BILLING#${userId}`, sk: 'BALANCE', credits: config.freeTrialCredits || 1000 });
    // Default workspace (immutable)
    const wsId = uuidv4();
    await putItem({ pk: `WORKSPACE#${wsId}`, sk: 'META', id: wsId, user_id: userId, name: userName, is_default: true, created_at: now });
    await putItem({ pk: `USER_WS#${userId}`, sk: `WORKSPACE#${wsId}`, workspace_id: wsId, created_at: now });
    // Default environment "main" (immutable)
    const envId = uuidv4();
    await putItem({ pk: `ENV#${envId}`, sk: 'META', id: envId, workspace_id: wsId, user_id: userId, name: 'main', is_default: true, created_at: now });
    await putItem({ pk: `WS_ENVS#${wsId}`, sk: `ENV#${envId}`, environment_id: envId, created_at: now });
    reply.status(201).send({ user_id: userId, email, workspace_id: wsId, environment_id: envId });
  });

  app.post('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body;
    const items = await queryByPK(`USER#${email}`);
    const passItem = items.find(i => i.sk && i.sk.startsWith('PASSWORD#'));
    if (!passItem) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const hash = passItem.sk.replace('PASSWORD#', '');
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const userItem = items.find(i => i.sk === 'META');
    const token = jwt.sign({ id: userItem.id, email }, config.jwtSecret, { expiresIn: '7d' });
    // Găsim default workspace pentru user
    const wsItems = await queryByPK(`USER_WS#${userItem.id}`, { Limit: 1 });
    const defaultWs = wsItems.length > 0 ? wsItems[0].workspace_id : null;
    reply.send({ token, user_id: userItem.id, workspace_id: defaultWs });
  });

  app.post('/api/auth/api-keys', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const key = `boxty_${uuidv4().replace(/-/g, '')}`;
    const name = req.body.name || 'default';
    const now = new Date().toISOString();
    await putItem({
      pk: `API_KEY#${key}`, sk: 'META', id, user_id: req.user.id, name, key,
      workspace_id: req.body.workspace_id || '*',
      environment_ids: req.body.environment_ids || ['*'],
      permissions: req.body.permissions || ['read', 'write', 'deploy'],
      created_at: now,
    });
    // Index pentru listare per user — SK = key value pentru getItem lookup direct
    await putItem({ pk: `API_KEY_LIST#${req.user.id}`, sk: key, key_id: id, created_at: now });
    reply.status(201).send({ id, name, key, key_preview: `${key.slice(0, 8)}...`, workspace_id: req.body.workspace_id || '*', permissions: req.body.permissions || ['read', 'write', 'deploy'], created_at: now });
  });

  app.get('/api/auth/api-keys', { preHandler: [app.authenticate] }, async (req, reply) => {
    // Query direct pe API_KEY#* cu begins_with nu merge in DynamoDB simplu.
    // Folosim indexul: API_KEY_LIST#userId conține key-ul ca sk.
    const items = await queryByPK(`API_KEY_LIST#${req.user.id}`);
    const keys = [];
    for (const it of items) {
      const k = await getItem(`API_KEY#${it.sk}`, 'META');
      if (k) keys.push({ id: k.id, name: k.name, key_preview: k.key ? `${k.key.slice(0, 8)}...` : '********', workspace_id: k.workspace_id, permissions: k.permissions, created_at: k.created_at });
    }
    reply.send(keys);
  });

  app.delete('/api/auth/api-keys/:key', { preHandler: [app.authenticate] }, async (req, reply) => {
    const keyItem = await getItem(`API_KEY#${req.params.key}`, 'META');
    if (!keyItem) return reply.status(404).send({ error: 'Not found' });
    await deleteItem(`API_KEY#${req.params.key}`, 'META');
    await deleteItem(`API_KEY_LIST#${req.user.id}`, req.params.key);
    reply.send({ status: 'deleted' });
  });

  app.get('/api/auth/whoami', { preHandler: [app.authenticate] }, async (req, reply) => {
    const billingItem = await getItem(`BILLING#${req.user.id}`, 'BALANCE');
    const wsItems = await queryByPK(`USER_WS#${req.user.id}`, { Limit: 10 });
    reply.send({
      user_id: req.user.id,
      email: req.user.email || null,
      balance: billingItem?.credits || 0,
      workspace_id: req.user.workspace_id || '*',
      environment_ids: req.user.environment_ids || ['*'],
      permissions: req.user.permissions || ['read', 'write', 'deploy'],
      workspaces: wsItems.map(i => ({ workspace_id: i.workspace_id, created_at: i.created_at })),
    });
  });
}
