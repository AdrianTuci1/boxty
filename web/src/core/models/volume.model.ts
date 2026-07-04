export type VolumeStatus = 'available' | 'attached' | 'detached';

export interface VolumeModel {
  id: string;
  name: string;
  sizeGb: number;
  status: VolumeStatus;
  createdAt: Date;
}

export function mapVolumeFromApi(raw: Record<string, any>): VolumeModel {
  return {
    id: raw.volume_id ?? raw.id ?? '',
    name: raw.name ?? '',
    sizeGb: raw.size_gb ?? raw.sizeGb ?? 0,
    status: (raw.status as VolumeStatus) ?? 'available',
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
  };
}
