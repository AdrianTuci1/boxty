export interface SecretModel {
  id: string;
  name: string;
  createdAt: Date;
}

export function mapSecretFromApi(raw: Record<string, any>): SecretModel {
  return {
    id: raw.secret_id ?? raw.id ?? raw.name ?? '',
    name: raw.name ?? '',
    createdAt: new Date(raw.created_at ?? raw.createdAt ?? Date.now()),
  };
}
