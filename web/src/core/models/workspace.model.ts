export interface WorkspaceModel {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  environmentCount: number;
  appCount: number;
}

export interface EnvironmentModel {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
}

export function mapWorkspaceFromApi(raw: Record<string, any>): WorkspaceModel {
  return {
    id: raw.workspace_id ?? raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
    environmentCount: raw.environment_count ?? raw.environmentCount ?? 0,
    appCount: raw.app_count ?? raw.appCount ?? 0,
  };
}

export function mapEnvironmentFromApi(raw: Record<string, any>): EnvironmentModel {
  return {
    id: raw.environment_id ?? raw.id ?? '',
    workspaceId: raw.workspace_id ?? raw.workspaceId ?? '',
    name: raw.name ?? '',
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
  };
}
