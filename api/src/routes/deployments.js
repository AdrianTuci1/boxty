import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function deploymentRoutes(app) {
  app.post('/', async (req, reply) => {
    const id = uuidv4();
    const item = {
      pk: `DEPLOYMENT#${id}`,
      sk: 'META',
      id,
      user_id: req.user?.id || 'anon',
      ...req.body,
      status: 'deploying',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    reply.status(201).send(item);
  });

  app.get('/:id', async (req, reply) => {
    const dep = await getItem(`DEPLOYMENT#${req.params.id}`, 'META');
    if (!dep) return reply.status(404).send({ error: 'Not found' });
    reply.send(dep);
  });

  app.delete('/:id', async (req, reply) => {
    await deleteItem(`DEPLOYMENT#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/invoke', async (req, reply) => {
    const dep = await getItem(`DEPLOYMENT#${req.params.id}`, 'META');
    if (!dep) return reply.status(404).send({ error: 'Not found' });
    reply.send({ result: 'ok', payload: req.body });
  });
}
