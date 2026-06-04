import WebSocket from 'ws';
import http from 'http';

export class SandboxStreamServer {
  constructor(workerPool) {
    this.workerPool = workerPool;
    this.wss = null;
  }

  attach(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/sandboxes/:id' });
    this.wss.on('connection', (ws, req) => {
      const match = req.url.match(/\/ws\/sandboxes\/([^\/]+)(?:\/(\d+))?/);
      if (!match) {
        ws.close(1002, 'Invalid path');
        return;
      }
      const sandboxId = match[1];
      const port = match[2];
      this.proxyToWorker(ws, sandboxId, port);
    });
  }

  proxyToWorker(clientWs, sandboxId, port) {
    // Find worker hosting sandbox
    const workers = Array.from(this.workerPool.workers.values());
    const worker = workers.find(w => w.capacity?.sandbox_ids?.includes(sandboxId));
    if (!worker) {
      clientWs.close(1011, 'Worker not found');
      return;
    }
    const targetUrl = port
      ? `ws://${worker.host}:9002/${sandboxId}/${port}`
      : `ws://${worker.host}:9002/${sandboxId}`;
    const backendWs = new WebSocket(targetUrl);
    backendWs.on('open', () => {
      clientWs.on('message', data => backendWs.send(data));
      backendWs.on('message', data => clientWs.send(data));
    });
    backendWs.on('error', err => {
      clientWs.close(1011, err.message);
    });
    clientWs.on('close', () => backendWs.close());
    backendWs.on('close', () => clientWs.close());
  }
}

export default function sandboxStreamPlugin(app, opts, done) {
  const streamer = new SandboxStreamServer(app.workerPool);
  app.decorate('sandboxStream', streamer);
  done();
}
