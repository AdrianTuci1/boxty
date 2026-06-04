import { Client } from '../src/client.js';

describe('Client', () => {
  it('should initialize', () => {
    const client = new Client({ apiKey: 'test' });
    expect(client).toBeDefined();
  });
});
