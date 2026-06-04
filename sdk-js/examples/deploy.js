import { Client } from 'boxty';

const client = new Client({ apiKey: 'bxty_...' });
const app = await client.createApp('ws-1', 'env-1', 'my-ml-service', 'pytorch:latest', 8, 32768, 'A100');
console.log('Deployed', app.id);
