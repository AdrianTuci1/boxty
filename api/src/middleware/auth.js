import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export async function authPlugin(app) {
  app.decorate('authenticate', async function(request, reply) {
    try {
      const auth = request.headers.authorization || '';
      if (auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        request.user = jwt.verify(token, config.jwtSecret);
        return;
      }
      if (auth.startsWith('Bearer ')) {
        const key = auth.slice(7);
        // API keys stored as USER#<id> with sk API_KEY#<key>
        // For now, decode simple pattern
        request.user = { id: key, apiKey: true };
        return;
      }
      throw new Error('Missing auth');
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.decorate('authenticateWorker', async function(request, reply) {
    const key = request.headers['x-worker-key'] || '';
    if (key !== config.workerApiKey) {
      reply.status(403).send({ error: 'Forbidden' });
    }
  });
}
