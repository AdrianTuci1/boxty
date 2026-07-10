import type { AppModel } from '../models/app.model';
import type { AppModel as LegacyAppModel } from '@/core/models/app.model';

export class AppModelMapper {
  static fromLegacy(legacy: LegacyAppModel): AppModel {
    return {
      id: legacy.id,
      name: legacy.name,
      workspaceId: legacy.workspaceId,
      environmentId: legacy.environmentId,
      status: legacy.status,
      type: legacy.type,
      deployerName: legacy.deployerName,
      image: legacy.image,
      url: legacy.url,
      functions: legacy.functions,
      instances: legacy.instances.map((inst) => ({
        id: inst.id,
        appId: inst.appId,
        name: inst.name,
        cpu: inst.cpu,
        memory: inst.memory,
        gpu: inst.gpu,
        minContainers: inst.minContainers,
        maxContainers: inst.maxContainers,
        scaledownWindow: inst.scaledownWindow,
        runningContainers: inst.runningContainers,
        status: inst.status,
        createdAt: inst.createdAt,
      })),
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
    };
  }

  static fromApi(raw: Record<string, any>): AppModel {
    return {
      id: raw.workload_id ?? raw.app_id ?? raw.id ?? '',
      name: raw.name ?? '',
      workspaceId: raw.workspace_id ?? raw.workspaceId ?? '',
      environmentId: raw.environment_id ?? raw.environmentId ?? raw.env_id ?? '',
      status: (raw.status as AppModel['status']) ?? 'active',
      type: (raw.kind as AppModel['type']) ?? (raw.type as AppModel['type']) ?? 'function',
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
      instances: (raw.instances ?? []).map((i: any) => ({
        id: i.instance_id ?? i.id ?? '',
        appId: i.app_id ?? raw.workload_id ?? i.appId ?? '',
        name: i.name ?? '',
        cpu: i.cpu ?? 1,
        memory: i.memory ?? 512,
        gpu: i.gpu ?? null,
        minContainers: i.min_containers ?? i.minContainers ?? 0,
        maxContainers: i.max_containers ?? i.maxContainers ?? 10,
        scaledownWindow: i.scaledown_window ?? i.scaledownWindow ?? 300,
        runningContainers: i.running_containers ?? i.runningContainers ?? 0,
        status: (i.status as 'active' | 'stopped') ?? 'active',
        createdAt: new Date(i.created_at ?? i.createdAt ?? Date.now()),
      })),
      createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
      updatedAt: new Date(raw.updated_at ?? raw.updatedAt ?? Date.now()),
    };
  }
}
