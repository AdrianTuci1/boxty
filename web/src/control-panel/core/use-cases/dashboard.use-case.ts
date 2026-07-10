import type { AppModel } from '../models/app.model';
import type { SandboxModel } from '../models/sandbox.model';
import type { DashboardSummaryModel } from '../models/dashboard.model';

export class ComputeDashboardSummaryUseCase {
  execute(apps: AppModel[], sandboxes: SandboxModel[]): DashboardSummaryModel {
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

    const live = apps.filter((a) => a.status === 'active' || a.status === 'running');
    const stopped = apps.filter((a) => a.status !== 'active' && a.status !== 'running');

    return {
      totalApps: apps.length,
      liveApps: live.length,
      stoppedApps: stopped.length,
      totalSandboxes: sandboxes.length,
      totalCpuCores: totalCpu,
      totalMemoryMb: totalMem,
      totalGpuCount: totalGpu,
    };
  }
}

export class GetLiveAppsUseCase {
  execute(apps: AppModel[]): AppModel[] {
    return apps.filter((a) => a.status === 'active' || a.status === 'running');
  }
}

export class GetStoppedAppsUseCase {
  execute(apps: AppModel[]): AppModel[] {
    return apps.filter((a) => a.status !== 'active' && a.status !== 'running');
  }
}
