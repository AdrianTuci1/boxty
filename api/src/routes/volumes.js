import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function volumeRoutes(app) {
  app.post('/', async (req, reply) => {
    const id = uuidv4();
    const userId = req.user?.id || 'anon';
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
    reply.status(201).send(item);
  });

  app.get('/', async (req, reply) => {
    reply.send([]);
  });

  app.get('/:id', async (req, reply) => {
    const vol = await getItem(`VOLUME#${req.params.id}`, 'META');
    if (!vol) return reply.status(404).send({ error: 'Not found' });
    reply.send(vol);
  });

  app.delete('/:id', async (req, reply) => {
    await deleteItem(`VOLUME#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/mount', async (req, reply) => {
    const { sandbox_id, mount_path } = req.body;
    const res = await app.volumeManager.mount(req.params.id, sandbox_id, mount_path);
    reply.send(res);
  });

  app.post('/:id/unmount', async (req, reply) => {
    const { sandbox_id } = req.body;
    const res = await app.volumeManager.unmount(req.params.id, sandbox_id);
    reply.send(res);
  });
}
