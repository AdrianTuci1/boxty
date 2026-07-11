export type AppStatus = 'active' | 'stopped' | 'deploying' | 'failed' | 'running';
export type AppType = 'function' | 'sandbox' | 'endpoint' | 'build';

export interface InstanceConfigModel {
  id: string;
  appId: string;
  name: string;
  cpu: number;
  memory: number;
  gpu: string | null;
  minContainers: number;
  maxContainers: number;
  scaledownWindow: number;
  runningContainers: number;
  status: 'active' | 'stopped';
  createdAt: Date;
}

export interface AppModel {
  id: string;
  name: string;
  workspaceId: string;
  environmentId: string;
  status: AppStatus;
  type: AppType;
  deployerName: string;
  image?: string;
  url?: string;
  functions: string[];
  instances: InstanceConfigModel[];
  createdAt: Date;
  updatedAt: Date;
}
