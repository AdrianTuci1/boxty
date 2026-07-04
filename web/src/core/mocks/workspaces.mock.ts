export interface MockWorkspace {
  workspace_id: string
  id: string
  name: string
  description?: string
  is_default?: boolean
  created_at: string
  environment_count?: number
  app_count?: number
}

export const mockWorkspaces: MockWorkspace[] = [
  {
    workspace_id: 'mock-ws-1',
    id: 'mock-ws-1',
    name: 'john-smith',
    is_default: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    environment_count: 3,
    app_count: 12,
  },
  {
    workspace_id: 'mock-ws-2',
    id: 'mock-ws-2',
    name: 'team-alpha',
    is_default: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    environment_count: 2,
    app_count: 5,
  },
];
