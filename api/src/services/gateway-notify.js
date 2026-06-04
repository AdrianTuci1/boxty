import fetch from 'node-fetch';
import { getItem, updateItem } from '../db/schema.js';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || 'boxty-gateway-secret';

/**
 * Notify gateway that a sandbox route has changed.
 * Called by API server after sandbox start/stop.
 */
export async function notifyGateway({ sandbox_id, worker_id, worker_host, ports, status }) {
  try {
    const res = await fetch(`${GATEWAY_URL}/internal/route/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Key': GATEWAY_API_KEY,
      },
      body: JSON.stringify({
        sandbox_id,
        worker_id,
        worker_host,
        ports: ports || [],
        status,
      }),
    });
    if (!res.ok) {
      console.warn('Gateway upsert failed:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('Gateway notify error:', err.message);
  }
}
