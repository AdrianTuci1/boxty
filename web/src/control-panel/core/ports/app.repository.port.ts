import type { AppModel } from '../models/app.model';

export interface IAppRepository {
  list(workspaceId?: string, environmentId?: string): Promise<AppModel[]>;
  getById(id: string): Promise<AppModel>;
  create(payload: Partial<AppModel>): Promise<AppModel>;
  stop(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IAppMetricsRepository {
  getMetrics(id: string): Promise<unknown>;
  getUsage(id: string): Promise<unknown>;
  getLogs(id: string): Promise<unknown>;
}
