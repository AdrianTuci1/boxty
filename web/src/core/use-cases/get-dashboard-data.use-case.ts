import type { AppModel } from '../models/app.model';
import type { SandboxModel } from '../models/sandbox.model';

export interface DashboardSummary {
  totalApps: number;
  liveApps: number;
  stoppedApps: number;
  totalSandboxes: number;
  totalCpuCores: number;
  totalMemoryMb: number;
  totalGpuCount: number;
}

export interface DashboardData {
  apps: AppModel[];
  sandboxes: SandboxModel[];
  summary: DashboardSummary;
}

export function computeDashboardSummary(apps: AppModel[], sandboxes: SandboxModel[]): DashboardSummary {
  let totalCpu = 0;
  let totalMem = 0;
  let totalGpu = 0;

  for (const app of apps) {
    for (const inst of app.instances) {
      if (inst.status === 'active' && inst.runningContainers > 0) {
        totalCpu += inst.cpu * inst.runningContainers;
        totalMem += inst.memory * inst.runningContainers;
        if (inst.gpu) totalGpu += inst.runningContainers;
      }
    }
  }

  return {
    totalApps: apps.length,
    liveApps: apps.filter((a) => a.status === 'active').length,
    stoppedApps: apps.filter((a) => a.status !== 'active').length,
    totalSandboxes: sandboxes.length,
    totalCpuCores: totalCpu,
    totalMemoryMb: totalMem,
    totalGpuCount: totalGpu,
  };
}

export function getDashboardData(apps: AppModel[], sandboxes: SandboxModel[]): DashboardData {
  return {
    apps,
    sandboxes,
    summary: computeDashboardSummary(apps, sandboxes),
  };
}
