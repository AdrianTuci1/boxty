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
