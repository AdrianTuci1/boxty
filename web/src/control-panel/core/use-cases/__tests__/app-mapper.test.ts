import { describe, it, expect } from 'vitest';
import { AppModelMapper } from '../app-mapper.use-case';

describe('AppModelMapper', () => {
  it('maps from API record', () => {
    const raw = {
      workload_id: 'wl-1',
      name: 'my-app',
      workspace_id: 'ws',
      environment_id: 'env',
      status: 'running',
      kind: 'function',
      owner_id: 'alice',
      image: 'python:3.11',
      endpoint_name: 'my-endpoint',
      functions: ['fn1', 'fn2'],
      instances: [
        {
          instance_id: 'inst-1',
          name: 'fn1',
          cpu: 2,
          memory: 1024,
          gpu: 't4',
          running_containers: 1,
          status: 'active',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
    };
    const app = AppModelMapper.fromApi(raw);
    expect(app.id).toBe('wl-1');
    expect(app.name).toBe('my-app');
    expect(app.status).toBe('running');
    expect(app.type).toBe('function');
    expect(app.url).toBe('https://my-endpoint.boxty.dev');
    expect(app.instances).toHaveLength(1);
    expect(app.instances[0].gpu).toBe('t4');
  });

  it('falls back to command for functions', () => {
    const raw = {
      workload_id: 'wl-2',
      name: 'my-app',
      command: ['python', 'app.py'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    const app = AppModelMapper.fromApi(raw);
    expect(app.functions).toEqual(['python']);
  });
});
