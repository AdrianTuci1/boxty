import type { VolumeModel } from '../models/volume.model';

export interface IVolumeRepository {
  list(workspaceId: string): Promise<VolumeModel[]>;
  create(workspaceId: string, payload: Partial<VolumeModel>): Promise<VolumeModel>;
  delete(workspaceId: string, locator: string): Promise<void>;
}
