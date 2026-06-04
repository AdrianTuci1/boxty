import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function volumeRoutes(app) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const userId = req.user.id;
    const item = {
      pk: `VOLUME#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      name: req.body.name,
      size_gb: req.body.size_gb || 50,
      status: 'created',
      mount_url: `s3://boxty-volumes/${userId}/${req.body.name}`,
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `USER_VOLUMES#${userId}`, sk: item.created_at, volume_id: id });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USER_VOLUMES#${userId}`);
    const out = [];
    for (const it of items) {
      const vol = await getItem(`VOLUME#${it.volume_id}`, 'META');
      if (vol) out.push(vol);
    }
    reply.send(out);
  });

  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const vol = await getItem(`VOLUME#${req.params.id}`, 'META');
    if (!vol) return reply.status(404).send({ error: 'Not found' });
    reply.send(vol);
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    await deleteItem(`VOLUME#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/mount', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sandbox_id, mount_path } = req.body;
    const res = await app.volumeManager.mount(req.params.id, sandbox_id, mount_path);
    await updateItem(`VOLUME#${req.params.id}`, 'META', { mounted_on: sandbox_id, mount_path, status: 'mounted' });
    reply.send(res);
  });

  app.post('/:id/unmount', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sandbox_id } = req.body;
    const res = await app.volumeManager.unmount(req.params.id, sandbox_id);
    await updateItem(`VOLUME#${req.params.id}`, 'META', { mounted_on: null, mount_path: null, status: 'created' });
    reply.send(res);
  });
}
