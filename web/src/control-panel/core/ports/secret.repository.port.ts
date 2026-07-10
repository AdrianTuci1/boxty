import type { SecretModel } from '../models/secret.model';

export interface ISecretRepository {
  list(workspaceId: string): Promise<SecretModel[]>;
  create(workspaceId: string, name: string, value: string): Promise<SecretModel>;
  delete(workspaceId: string, name: string): Promise<void>;
}
