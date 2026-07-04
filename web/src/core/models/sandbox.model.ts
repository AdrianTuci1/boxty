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

export interface SandboxMetricsModel {
  timestamps: string[];
  cpu: number[];
  memory: number[];
  networkRx: number[];
  networkTx: number[];
  gpuUtil?: number[];
}

export function mapSandboxFromApi(raw: Record<string, any>): SandboxModel {
  return {
    id: raw.sandbox_id ?? raw.workload_id ?? raw.id ?? '',
    appId: raw.app_id ?? raw.workload_id ?? raw.appId,
    status: (raw.status as SandboxStatus) ?? 'stopped',
    startedAt: raw.started_at ? new Date(raw.started_at) : undefined,
    finishedAt: raw.finished_at ? new Date(raw.finished_at) : undefined,
    bootDurationMs: raw.boot_duration_ms ?? raw.bootDurationMs,
    url: raw.url,
    workerId: raw.worker_id ?? raw.workerId,
    cpuMaxPct: raw.cpu_max_pct ?? raw.cpuMaxPct,
    cpuAvgPct: raw.cpu_avg_pct ?? raw.cpuAvgPct,
    memoryMaxMb: raw.memory_max_mb ?? raw.memoryMaxMb,
    memoryAvgMb: raw.memory_avg_mb ?? raw.memoryAvgMb,
    networkRxBytes: raw.network_rx_bytes ?? raw.networkRxBytes,
    networkTxBytes: raw.network_tx_bytes ?? raw.networkTxBytes,
    gpuUtilPct: raw.gpu_util_pct ?? raw.gpuUtilPct,
    gpuMemoryMb: raw.gpu_memory_mb ?? raw.gpuMemoryMb,
    image: raw.image,
    cpu: raw.cpu,
    memory: raw.memory,
    gpu: raw.gpu,
    port: raw.port,
  };
}
