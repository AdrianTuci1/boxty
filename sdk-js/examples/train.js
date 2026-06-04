import { Client } from 'boxty';

const client = new Client({ apiKey: 'bxty_...' });
const sandbox = await client.createSandbox({ image: 'pytorch:latest', cpu: 4, memory: 16384, gpu: 'A100' });
const result = await sandbox.exec('python train.py --epochs=10');
console.log(result.stdout);
await sandbox.stop();
