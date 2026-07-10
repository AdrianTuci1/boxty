export interface DashboardSummaryModel {
  totalApps: number;
  liveApps: number;
  stoppedApps: number;
  totalSandboxes: number;
  totalCpuCores: number;
  totalMemoryMb: number;
  totalGpuCount: number;
}

export interface DashboardDataModel {
  apps: import('./app.model').AppModel[];
  sandboxes: import('./sandbox.model').SandboxModel[];
  summary: DashboardSummaryModel;
}
