export interface BalanceModel {
  credits: number;
  currency: string;
}

export interface UsageRecordModel {
  date: Date;
  cpuHours: number;
  gpuHours: number;
  storageGb: number;
  cost: number;
}

export function mapBalanceFromApi(raw: Record<string, any>): BalanceModel {
  return { credits: raw.credits ?? 0, currency: raw.currency ?? 'USD' };
}
