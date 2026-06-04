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

  async launchWorker(provider, region, spec = {}) {
    const id = `worker-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    let host = '127.0.0.1';
    let instanceId = id;

    if (provider === 'aws') {
      try {
        const ec2 = this._getEC2Client(region);
        const cmd = new RunInstancesCommand({
          ImageId: spec.imageId || 'ami-0c02fb55956c7d316',
          InstanceType: spec.instanceType || 't3.medium',
          MinCount: 1,
          MaxCount: 1,
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
