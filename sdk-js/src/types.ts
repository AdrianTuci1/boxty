export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export interface SandboxOptions {
  image: string;
  cpu?: number;
  memory?: number;
  gpu?: string;
  timeout?: number;
  diskSizeGb?: number;
  volume?: string;
  volumeMountPath?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface SandboxMetrics {
  startedAt: string;
  finishedAt: string;
  bootDurationMs: number;
  cpu: { maxPct: number; avgPct: number; usageSeconds: number };
  memory: { maxMb: number; avgMb: number };
  network: { rxBytes: number; txBytes: number };
  gpu?: { maxUtilPct: number; avgUtilPct: number; memoryMb: number };
}

export interface AppMetrics {
  totalSandboxes: number;
  activeSandboxes: number;
  cpu: { max: number; avg: number; totalHours: number };
  memory: { maxMb: number; avgMb: number };
  gpu: { maxUtilPct: number; avgUtilPct: number; totalHours: number };
  network: { totalRxGb: number; totalTxGb: number };
  totalCost: number;
}

export interface UsageReport {
  totalCost: number;
}

export interface ScheduleOptions {
  name: string;
  scheduleType: 'cron' | 'period';
  scheduleValue: string | number;
  functionName: string;
  args?: any;
  image?: string;
  cpu?: number;
  memory?: number;
  gpu?: string;
  timeout?: number;
  secrets?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  workspaceId: string;
}

export interface Secret {
  name: string;
  createdAt: string;
}

export interface Deployment {
  id: string;
  url: string;
  status: 'deploying' | 'active' | 'failed';
}

export interface Volume {
  id: string;
  name: string;
  sizeGb: number;
  status: string;
  mountUrl: string;
  createdAt: string;
}

export interface ImageBuild {
  id: string;
  imageUrl: string | null;
  status: 'building' | 'done' | 'failed';
  error?: string;
}
