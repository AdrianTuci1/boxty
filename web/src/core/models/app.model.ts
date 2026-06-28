export type AppStatus = 'active' | 'stopped' | 'deploying' | 'failed' | 'running';
export type AppType = 'function' | 'sandbox';

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

export function mapAppFromApi(raw: Record<string, any>): AppModel {
  return {
    id: raw.workload_id ?? raw.app_id ?? raw.id ?? '',
    name: raw.name ?? '',
    workspaceId: raw.workspace_id ?? raw.workspaceId ?? '',
    environmentId: raw.environment_id ?? raw.environmentId ?? raw.env_id ?? '',
    status: (raw.status as AppStatus) ?? 'active',
    type: (raw.kind as AppType) ?? (raw.type as AppType) ?? 'function',
    deployerName: raw.owner_id ?? raw.deployer_name ?? raw.deployerName ?? '',
    image: raw.image ?? raw.image_url ?? raw.base_image,
    url: raw.endpoint_name ? `https://${raw.endpoint_name}.boxty.dev` : raw.url,
    functions: (raw.functions && raw.functions.length > 0)
      ? raw.functions
      : (raw.endpoints && raw.endpoints.length > 0)
      ? raw.endpoints
      : (raw.instances && raw.instances.length > 0)
      ? raw.instances.map((i: any) => i.name)
      : raw.command && raw.command.length > 0
      ? [raw.command[0]]
      : [],
    instances: (raw.instances ?? []).map(mapInstanceFromApi),
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
    updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
  };
}

export function mapInstanceFromApi(raw: Record<string, any>): InstanceConfigModel {
  return {
    id: raw.instance_id ?? raw.id ?? '',
    appId: raw.app_id ?? raw.workload_id ?? raw.appId ?? '',
    name: raw.name ?? '',
    cpu: raw.cpu ?? 1,
    memory: raw.memory ?? 512,
    gpu: raw.gpu ?? null,
    minContainers: raw.min_containers ?? raw.minContainers ?? 0,
    maxContainers: raw.max_containers ?? raw.maxContainers ?? 10,
    scaledownWindow: raw.scaledown_window ?? raw.scaledownWindow ?? 300,
    runningContainers: raw.running_containers ?? raw.runningContainers ?? 0,
    status: (raw.status as 'active' | 'stopped') ?? 'active',
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
  };
}
