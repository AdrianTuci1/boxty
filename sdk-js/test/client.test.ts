import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Client, saveConfig } from '../src/client.js';

describe('Client', () => {
  it('should initialize with defaults', () => {
    const client = new Client();
    assert.ok(client);
  });

  it('should accept apiKey', () => {
    const client = new Client({ apiKey: 'sk-test' });
    assert.ok(client);
  });

  it('should accept custom baseUrl', () => {
    const client = new Client({ baseUrl: 'http://localhost:3000', apiKey: 'test' });
    assert.ok(client);
  });

  it('should have sandbox CRUD methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createSandbox, 'function');
    assert.equal(typeof client.listSandboxes, 'function');
    assert.equal(typeof client.getSandbox, 'function');
    assert.equal(typeof client.deleteSandbox, 'function');
    assert.equal(typeof client.getSandboxMetrics, 'function');
  });

  it('should have workspace methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createWorkspace, 'function');
    assert.equal(typeof client.listWorkspaces, 'function');
    assert.equal(typeof client.getWorkspace, 'function');
    assert.equal(typeof client.deleteWorkspace, 'function');
  });

  it('should have app methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createApp, 'function');
    assert.equal(typeof client.listApps, 'function');
    assert.equal(typeof client.getApp, 'function');
    assert.equal(typeof client.deleteApp, 'function');
    assert.equal(typeof client.stopApp, 'function');
    assert.equal(typeof client.deployApp, 'function');
  });

  it('should have instance config methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createInstance, 'function');
    assert.equal(typeof client.listInstances, 'function');
    assert.equal(typeof client.getInstance, 'function');
    assert.equal(typeof client.deleteInstance, 'function');
    assert.equal(typeof client.getInstanceSandboxes, 'function');
  });

  it('should have billing methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.balance, 'function');
    assert.equal(typeof client.usage, 'function');
    assert.equal(typeof client.buyCredits, 'function');
  });

  it('should have secret methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createSecret, 'function');
    assert.equal(typeof client.listSecrets, 'function');
    assert.equal(typeof client.deleteSecret, 'function');
  });

  it('should have volume methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createVolume, 'function');
    assert.equal(typeof client.listVolumes, 'function');
    assert.equal(typeof client.deleteVolume, 'function');
  });

  it('should have image methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.buildImage, 'function');
    assert.equal(typeof client.listImages, 'function');
    assert.equal(typeof client.deleteImage, 'function');
  });

  it('should have schedule methods', () => {
    const client = new Client({ apiKey: 'test' });
    assert.equal(typeof client.createSchedule, 'function');
    assert.equal(typeof client.listSchedules, 'function');
    assert.equal(typeof client.deleteSchedule, 'function');
    assert.equal(typeof client.triggerSchedule, 'function');
  });
});

describe('saveConfig', () => {
  it('should be a function', () => {
    assert.equal(typeof saveConfig, 'function');
  });
});
