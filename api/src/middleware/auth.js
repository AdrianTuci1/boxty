import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getItem } from '../db/schema.js';

const PUBLIC_ROUTES = [
  '/health',
  '/api/auth/register',
  '/api/auth/login',
  '/api/stripe/webhook',
];

export async function authMiddleware(request, reply) {
  // Skip auth for public routes
  if (PUBLIC_ROUTES.some(r => request.url.startsWith(r))) return;

  // Worker registration has its own auth (API key)
  if (request.url.startsWith('/api/workers/register')) {
    const apiKey = request.headers['x-worker-key'];
    if (apiKey !== config.WORKER_API_KEY) {
      return reply.status(401).send({ error: 'Invalid worker key' });
    }
    return;
  }

  // Extract token
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    request.userId = decoded.userId;
    request.userRole = decoded.role || 'user';
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export function generateToken(userId, role = 'user') {
  return jwt.sign(
    { userId, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateApiKey() {
  const crypto = await import('crypto');
  return `bxty_${crypto.randomBytes(32).toString('hex')}`;
}
