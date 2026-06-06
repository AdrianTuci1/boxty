import type { AppModel } from '../models/app.model';

export type SortType = 'recent' | 'alphabetical' | 'newest' | 'oldest' | 'activity';

export const SORT_LABELS: Record<SortType, string> = {
  recent: 'Most recent',
  alphabetical: 'Alphabetical',
  newest: 'Newest',
  oldest: 'Oldest',
  activity: 'Activity',
};

export function sortApps(apps: AppModel[], sort: SortType): AppModel[] {
  const sorted = [...apps];
  switch (sort) {
    case 'alphabetical':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      break;
    case 'activity':
      sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      break;
    case 'recent':
    default:
      sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      break;
  }
  return sorted;
}
