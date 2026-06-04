import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function scheduleRoutes(app) {
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const now = Date.now();
    let next;
    if (req.body.schedule_type === 'cron') {
      const { parseExpression } = await import('cron-parser');
      next = parseExpression(req.body.schedule_value).next().getTime();
    } else {
      next = now + parseInt(req.body.schedule_value, 10) * 1000;
    }
    const item = {
      pk: `SCHEDULE#${id}`,
      sk: 'META',
      id,
      user_id: req.user.id,
      ...req.body,
      next_run: next,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: 'SCHEDULE_NEXT_RUN', sk: String(next), schedule_id: id });
    await putItem({ pk: `USER_SCHEDULES#${req.user.id}`, sk: item.created_at, schedule_id: id });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USER_SCHEDULES#${userId}`);
    const schedules = [];
    for (const it of items) {
      const s = await getItem(`SCHEDULE#${it.schedule_id}`, 'META');
      if (s) schedules.push(s);
    }
    reply.send(schedules);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const s = await getItem(`SCHEDULE#${req.params.id}`, 'META');
    if (!s) return reply.status(404).send({ error: 'Not found' });
    reply.send(s);
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    await updateItem(`SCHEDULE#${req.params.id}`, 'META', req.body);
    reply.send({ status: 'updated' });
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    await deleteItem(`SCHEDULE#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/trigger', { preHandler: [authenticate] }, async (req, reply) => {
    const s = await getItem(`SCHEDULE#${req.params.id}`, 'META');
    if (!s) return reply.status(404).send({ error: 'Not found' });
    await app.cronEngine.runSchedule(req.params.id);
    reply.send({ status: 'triggered' });
  });

  app.post('/:scheduleId/logs', async (req, reply) => {
    const { scheduleId } = req.params;
    const { sandboxId, exitCode, stdout, stderr, durationMs } = req.body;
    await putItem({
      pk: `SCHEDULE_LOG#${scheduleId}`,
      sk: String(Date.now()),
      sandboxId,
      exitCode,
      stdout,
      stderr,
      durationMs,
      created_at: new Date().toISOString(),
    });
    reply.send({ status: 'logged' });
  });
}
