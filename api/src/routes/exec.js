export default async function execRoutes(app) {
  app.post('/:id/exec', async (req, reply) => {
    const sb = await app.db?.getItem(`SANDBOX#${req.params.id}`, 'META');
    if (!sb) return reply.status(404).send({ error: 'Not found' });
    const { command, timeout } = req.body;
    const res = await app.workerPool.exec(sb.worker_id, req.params.id, command, timeout);
    reply.send(res);
  });
}
