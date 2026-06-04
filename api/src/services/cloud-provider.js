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

  // Hipervizorul Boxty consumă resurse pe fiecare VM gazdă:
  //   ~1 vCPU + 2 GB RAM pentru host OS + worker daemon
  static HYPERVISOR_CPU = 1;
  static HYPERVISOR_MEM_GB = 2;

  selectInstanceType(provider, { cpu = 0, memoryMb = 0, gpu = null } = {}) {
    const instances = {
      aws: [
        // CPU-only — combinațiile uzuale
        { type: 't3.micro',  cpu: 2, mem: 1 },
        { type: 't3.small',  cpu: 2, mem: 2 },
        { type: 't3.medium', cpu: 2, mem: 4 },
        { type: 'c6a.xlarge', cpu: 4, mem: 8 },
        { type: 'c6a.2xlarge', cpu: 8, mem: 16 },
        { type: 'c6a.4xlarge', cpu: 16, mem: 32 },
        { type: 'c6a.8xlarge', cpu: 32, mem: 64 },
        { type: 'c6a.12xlarge', cpu: 48, mem: 96 },
        { type: 'c6a.16xlarge', cpu: 64, mem: 128 },
        // GPU — provizionate direct după model
        { type: 'g4dn.xlarge', cpu: 4, mem: 16, gpu: 'T4' },
        { type: 'g5.xlarge', cpu: 4, mem: 16, gpu: 'A10' },
        { type: 'g6.xlarge', cpu: 4, mem: 16, gpu: 'L40S' },
        { type: 'p4d.24xlarge', cpu: 96, mem: 1152, gpu: 'A100' },
        { type: 'p5.48xlarge', cpu: 192, mem: 2048, gpu: 'H100' },
      ],
      gcp: [
        // CPU-only
        { type: 'n2-standard-2', cpu: 2, mem: 8 },
        { type: 'n2-standard-4', cpu: 4, mem: 16 },
        { type: 'n2-standard-8', cpu: 8, mem: 32 },
        { type: 'n2-standard-16', cpu: 16, mem: 64 },
        { type: 'n2-standard-32', cpu: 32, mem: 128 },
        { type: 'n2-standard-48', cpu: 48, mem: 192 },
        { type: 'n2-standard-64', cpu: 64, mem: 256 },
        // GPU
        { type: 'n1-standard-4-t4', cpu: 4, mem: 15, gpu: 'T4' },
        { type: 'g2-standard-8', cpu: 8, mem: 32, gpu: 'A10' },
        { type: 'a2-highgpu-1g', cpu: 12, mem: 85, gpu: 'A100' },
        { type: 'a3-highgpu-8g', cpu: 208, mem: 1872, gpu: 'H100' },
      ],
      azure: [
        // CPU-only
        { type: 'Standard_B1s', cpu: 1, mem: 1 },
        { type: 'Standard_B2s', cpu: 2, mem: 4 },
        { type: 'Standard_D2s_v5', cpu: 2, mem: 8 },
        { type: 'Standard_D4s_v5', cpu: 4, mem: 16 },
        { type: 'Standard_D8s_v5', cpu: 8, mem: 32 },
        { type: 'Standard_D16s_v5', cpu: 16, mem: 64 },
        { type: 'Standard_D32s_v5', cpu: 32, mem: 128 },
        { type: 'Standard_D48s_v5', cpu: 48, mem: 192 },
        // GPU
        { type: 'Standard_NC4as_T4_v3', cpu: 4, mem: 28, gpu: 'T4' },
        { type: 'Standard_NV36ads_A10_v5', cpu: 36, mem: 440, gpu: 'A10' },
        { type: 'Standard_NC40ads_H100_v5', cpu: 40, mem: 320, gpu: 'H100' },
      ],
    };

    const list = instances[provider] || [];

    if (gpu) {
      // GPU: alegem direct după model, hipervizorul rulează pe resursele rămase
      const candidates = list.filter(i => i.gpu === gpu);
      if (candidates.length === 0) {
        const anyGpu = list.filter(i => i.gpu);
        return anyGpu[0] || list[0];
      }
      candidates.sort((a, b) => a.cpu - b.cpu || a.mem - b.mem);
      return candidates[0];
    }

    // CPU: adăugăm overhead-ul hipervizorului peste resursele cerute de user
    const memGb = memoryMb / 1024;
    const neededCpu = cpu + CloudProvider.HYPERVISOR_CPU;
    const neededMem = memGb + CloudProvider.HYPERVISOR_MEM_GB;

    const candidates = list
      .filter(i => !i.gpu)
      .filter(i => i.cpu >= neededCpu && i.mem >= neededMem);

    if (candidates.length === 0) {
      const nonGpu = list.filter(i => !i.gpu);
      return nonGpu[nonGpu.length - 1] || list[list.length - 1];
    }

    candidates.sort((a, b) => a.cpu - b.cpu || a.mem - b.mem);
    return candidates[0];
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
          : this.selectInstanceType(provider, { cpu: spec.cpu || 2, memoryMb: spec.memory || 4096, gpu: spec.gpu });
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
