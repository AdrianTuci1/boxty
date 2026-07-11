export type VolumeStatus = 'available' | 'attached' | 'detached';

export interface VolumeModel {
  id: string;
  name: string;
  sizeGb: number;
  status: VolumeStatus;
  createdAt: Date;
}
