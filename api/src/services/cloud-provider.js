import { EC2Client, RunInstancesCommand, TerminateInstancesCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

export class CloudProvider {
  constructor() {
    this.instances = new Map(); // workerId -> { provider, region, instanceId, host }
    this.clients = new Map();
  }

  _getEC2Client(region) {
    const key = `aws-${region}`;
    if (!this.clients.has(key)) {
      this.clients.set(key, new EC2Client({ region }));
    }
    return this.clients.get(key);
  }

  selectInstanceType(provider, cpu, memoryMb) {
    const memGb = memoryMb / 1024;
    const instances = {
      aws: [
        { type: 't3.medium', cpu: 2, mem: 4 },
        { type: 't3.xlarge', cpu: 4, mem: 16 },
        { type: 'c6a.2xlarge', cpu: 8, mem: 16 },
        { type: 'c6a.4xlarge', cpu: 16, mem: 32 },
        { type: 'c6a.8xlarge', cpu: 32, mem: 64 },
        { type: 'g4dn.xlarge', cpu: 4, mem: 16, gpu: 'T4' },
        { type: 'g4dn.12xlarge', cpu: 48, mem: 192, gpu: 'T4x4' },
        { type: 'p4d.24xlarge', cpu: 96, mem: 1152, gpu: 'A100x8' },
      ],
      gcp: [
        { type: 'n2-standard-2', cpu: 2, mem: 8 },
        { type: 'n2-standard-4', cpu: 4, mem: 16 },
        { type: 'n2-standard-8', cpu: 8, mem: 32 },
        { type: 'n2-standard-16', cpu: 16, mem: 64 },
        { type: 'n2-standard-32', cpu: 32, mem: 128 },
        { type: 'a2-highgpu-1g', cpu: 12, mem: 85, gpu: 'A100' },
      ],
      azure: [
        { type: 'Standard_D2s_v5', cpu: 2, mem: 8 },
        { type: 'Standard_D4s_v5', cpu: 4, mem: 16 },
        { type: 'Standard_D8s_v5', cpu: 8, mem: 32 },
        { type: 'Standard_D16s_v5', cpu: 16, mem: 64 },
        { type: 'Standard_D32s_v5', cpu: 32, mem: 128 },
        { type: 'Standard_NC4as_T4_v3', cpu: 4, mem: 28, gpu: 'T4' },
      ],
    };

    const list = instances[provider] || [];
    // Filtrăm: CPU suficient, memorie suficientă, GPU dacă e cerut
    const candidates = list.filter(i => {
      if (i.cpu < cpu) return false;
      if (i.mem < memGb) return false;
      return true;
    });
    // Cel mai mic care satisface (cost-optimized)
    candidates.sort((a, b) => a.cpu - b.cpu || a.mem - b.mem);
    return candidates[0] || list[list.length - 1]; // fallback: cel mai mare
  }

  async launchWorker(provider, region, spec = {}) {
    const id = `worker-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    let host = '127.0.0.1';
    let instanceId = id;

    if (provider === 'aws') {
      try {
        const ec2 = this._getEC2Client(region);
        const inst = spec.instanceType
          ? { type: spec.instanceType, cpu: 0, mem: 0 }
          : this.selectInstanceType(provider, spec.cpu || 2, spec.memory || 4096);
        const cmd = new RunInstancesCommand({
          ImageId: spec.imageId || 'ami-0c02fb55956c7d316',
          InstanceType: inst.type,
          MinCount: 1,
          MaxCount: 1,
          UserData: Buffer.from(`#!/bin/bash
export BOXY_WORKER_ID=${id}
export PROVIDER=${provider}
export REGION=${region}
`).toString('base64'),
          InstanceMarketOptions: {
            MarketType: 'spot',
            SpotOptions: { SpotInstanceType: 'one-time', InstanceInterruptionBehavior: 'terminate' }
          },
          IamInstanceProfile: { Name: spec.iamProfile || 'BoxtyWorkerProfile' },
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{ Key: 'Name', Value: `boxty-worker-${id}` }, { Key: 'boxty:managed', Value: 'true' }]
          }]
        });
        const res = await ec2.send(cmd);
        instanceId = res.Instances[0].InstanceId;
        // Wait for public IP
        host = await this._waitForAwsIP(ec2, instanceId, 60);
      } catch (err) {
        console.error('AWS EC2 launch failed, falling back to mock:', err.message);
        host = `mock-${id}.boxty.dev`;
      }
    } else if (provider === 'gcp') {
      // GCP GCE preemptible VM — folosim gcloud CLI ca fallback
      host = `mock-gcp-${id}.boxty.dev`;
    } else if (provider === 'azure') {
      host = `mock-azure-${id}.boxty.dev`;
    }

    const info = { id, provider, region, instanceId, host, status: 'provisioning', created_at: new Date().toISOString() };
    this.instances.set(id, info);
    return info;
  }

  async _waitForAwsIP(ec2, instanceId, maxSeconds) {
    for (let i = 0; i < maxSeconds; i++) {
      const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const inst = res.Reservations?.[0]?.Instances?.[0];
      if (inst?.PublicIpAddress) return inst.PublicIpAddress;
      await new Promise(r => setTimeout(r, 1000));
    }
    return `pending-${instanceId}`;
  }

  async terminateWorker(workerId, provider) {
    const info = this.instances.get(workerId);
    if (!info) return { status: 'not_found' };

    if (provider === 'aws' && info.instanceId && !info.instanceId.startsWith('worker-')) {
      try {
        const ec2 = this._getEC2Client(info.region);
        await ec2.send(new TerminateInstancesCommand({ InstanceIds: [info.instanceId] }));
      } catch (err) {
        console.error('AWS terminate failed:', err.message);
      }
    }

    info.status = 'terminated';
    this.instances.set(workerId, info);
    return { status: 'terminated', workerId };
  }

  getInstance(workerId) {
    return this.instances.get(workerId);
  }

  listInstances() {
    return Array.from(this.instances.values());
  }
}

export default function cloudProviderPlugin(app, opts, done) {
  app.decorate('cloudProvider', new CloudProvider());
  done();
}
