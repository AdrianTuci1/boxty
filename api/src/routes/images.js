import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function imageRoutes(app) {
  app.post('/build', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const userId = req.user.id;
    const item = {
      pk: `IMAGE#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      name: req.body.name,
      base_image: req.body.base_image,
      commands: req.body.commands || [],
      status: 'building',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `IMAGE#${userId}`, sk: id, image_id: id });
    const buildRes = await app.imageBuilder.build(userId, { imageId: id, ...req.body });
    reply.status(201).send({ ...item, ...buildRes });
  });

  app.post('/build-from-dockerfile', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const userId = req.user.id;
    const item = {
      pk: `IMAGE#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      name: req.body.name || id,
      dockerfile: req.body.dockerfile,
      status: 'building',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `IMAGE#${userId}`, sk: id, image_id: id });
    const buildRes = await app.imageBuilder.build(userId, { imageId: id, base_image: 'dockerfile', commands: [], dockerfile: req.body.dockerfile });
    reply.status(201).send({ ...item, ...buildRes });
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`IMAGE#${userId}`);
    const images = [];
    for (const it of items) {
      const img = await getItem(`IMAGE#${it.image_id}`, 'META');
      if (img) images.push(img);
    }
    reply.send(images);
  });

  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const img = await getItem(`IMAGE#${req.params.id}`, 'META');
    if (!img) return reply.status(404).send({ error: 'Not found' });
    reply.send(img);
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    await deleteItem(`IMAGE#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });
}
