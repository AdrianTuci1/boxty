export type ImageStatus = 'building' | 'ready' | 'failed';

export interface ImageModel {
  id: string;
  name: string;
  imageUrl: string;
  status: ImageStatus;
  createdAt: Date;
}
