export type SandboxStatus = 'running' | 'stopped' | 'snapshotted';

export interface SandboxModel {
  id: string;
  appId?: string;
  status: SandboxStatus;
  startedAt?: Date;
  finishedAt?: Date;
  bootDurationMs?: number;
  url?: string;
  workerId?: string;
  cpuMaxPct?: number;
  cpuAvgPct?: number;
  memoryMaxMb?: number;
  memoryAvgMb?: number;
  networkRxBytes?: number;
  networkTxBytes?: number;
  gpuUtilPct?: number;
  gpuMemoryMb?: number;
  image?: string;
  cpu?: number;
  memory?: number;
  gpu?: string | null;
  port?: number;
}
