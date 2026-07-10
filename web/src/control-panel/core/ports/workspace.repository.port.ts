import type { WorkspaceModel, EnvironmentModel } from '../models/workspace.model';

export interface IWorkspaceRepository {
  list(): Promise<WorkspaceModel[]>;
  getById(id: string): Promise<WorkspaceModel>;
  create(name: string, description?: string): Promise<WorkspaceModel>;
  delete(id: string): Promise<void>;
  listEnvironments(workspaceId: string): Promise<EnvironmentModel[]>;
  createEnvironment(workspaceId: string, name: string): Promise<EnvironmentModel>;
  deleteEnvironment(id: string): Promise<void>;
}
