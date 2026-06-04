import { WebSocketServer } from 'ws';

export function createSandboxStream(server, workerPool) {
  const wss = new WebSocketServer({ server, path: '/ws/sandboxes/:id' });
  wss.on('connection', (ws, req) => {
    const sandboxId = req.url.split('/').pop();
    // Proxy to worker 9002
    const worker = workerPool.selectWorker();
    if (!worker) {
      ws.close(1011, 'No worker');
      return;
    }
    const target = new WebSocket(`ws://${worker.host}:9002/${sandboxId}`);
    target.on('open', () => {
      ws.on('message', (data) => target.send(data));
      target.on('message', (data) => ws.send(data));
    });
    target.on('error', () => ws.close());
    ws.on('close', () => target.close());
  });
  return wss;
}
