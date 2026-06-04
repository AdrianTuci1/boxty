import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function imageRoutes(app) {
  app.post('/build', async (req, reply) => {
    const id = uuidv4();
    const userId = req.user?.id || 'anon';
    const item = {
      pk: `IMAGE#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      ...req.body,
      status: 'building',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `IMAGE#${userId}`, sk: id, image_id: id });
    const buildRes = await app.imageBuilder.build(userId, req.body);
    reply.status(201).send({ ...item, ...buildRes });
  });

  app.post('/build-from-dockerfile', async (req, reply) => {
    reply.status(201).send({ image_id: uuidv4(), status: 'building' });
  });

  app.get('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`IMAGE#${userId}`);
    const images = [];
    for (const it of items) {
      const img = await getItem(`IMAGE#${it.image_id}`, 'META');
      if (img) images.push(img);
    }
    reply.send(images);
  });

  app.get('/:id', async (req, reply) => {
    const img = await getItem(`IMAGE#${req.params.id}`, 'META');
    if (!img) return reply.status(404).send({ error: 'Not found' });
    reply.send(img);
  });

  app.delete('/:id', async (req, reply) => {
    await deleteItem(`IMAGE#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });
}
