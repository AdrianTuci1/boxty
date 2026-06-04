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
            request.user = { id: keyItem.user_id, apiKey: true };
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
        request.user = { id: keyItem.user_id, apiKey: true };
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
    await putItem({ pk: `USER#${email}`, sk: 'META', id: userId, email, name: req.body.name || '', created_at: new Date().toISOString() });
    await putItem({ pk: `USER#${email}`, sk: `PASSWORD#${hash}`, user_id: userId });
    await putItem({ pk: `BILLING#${userId}`, sk: 'BALANCE', credits: config.freeTrialCredits || 1000 });
    reply.status(201).send({ user_id: userId, email });
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
    reply.send({ token, user_id: userItem.id });
  });

  app.post('/api/auth/api-keys', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const key = `boxty_${uuidv4().replace(/-/g, '')}`;
    const name = req.body.name || 'default';
    await putItem({ pk: `API_KEY#${key}`, sk: 'META', id, user_id: req.user.id, name, key, created_at: new Date().toISOString() });
    reply.status(201).send({ id, name, key, key_preview: `${key.slice(0, 8)}...`, created_at: new Date().toISOString() });
  });

  app.get('/api/auth/api-keys', { preHandler: [app.authenticate] }, async (req, reply) => {
    const items = await queryByPK(`API_KEY#${req.user.id}`);
    reply.send(items.map(i => ({ id: i.id, name: i.name, key_preview: i.key ? `${i.key.slice(0, 8)}...` : '********', created_at: i.created_at })));
  });

  app.delete('/api/auth/api-keys/:key', { preHandler: [app.authenticate] }, async (req, reply) => {
    await deleteItem(`API_KEY#${req.params.key}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.get('/api/auth/whoami', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userItem = await getItem(`USER#${req.user.email || ''}`, 'META');
    const billingItem = await getItem(`BILLING#${req.user.id}`, 'BALANCE');
    reply.send({
      user_id: req.user.id,
      email: req.user.email || userItem?.email || '',
      balance: billingItem?.credits || 0,
    });
  });
}
