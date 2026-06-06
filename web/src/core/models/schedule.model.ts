export type ScheduleStatus = 'active' | 'paused';

export interface ScheduleModel {
  id: string;
  name: string;
  cron?: string;
  periodSeconds?: number;
  nextRun: string;
  status: ScheduleStatus;
  createdAt: Date;
}
