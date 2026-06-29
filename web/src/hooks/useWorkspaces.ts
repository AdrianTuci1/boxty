import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listWorkspaces, createWorkspace, deleteWorkspace, type Workspace } from '../api/workspaces'
import { useAuth } from './useAuth'
import { shouldUseMocks } from '../core/services/mock-decider.service'
import { mockWorkspaces } from '../core/mocks/workspaces.mock'

export function useWorkspaces() {
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => useMocks ? Promise.resolve(mockWorkspaces as Workspace[]) : listWorkspaces(),
    staleTime: useMocks ? Infinity : 30000,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  return useMutation({
    mutationFn: (payload: { owner_id: string; name: string }) => {
      if (useMocks) {
        const newWs = {
          workspace_id: `mock-ws-${Date.now()}`,
          id: `mock-ws-${Date.now()}`,
          name: payload.name,
          owner_id: payload.owner_id,
          is_default: false,
          created_at: new Date().toISOString(),
          environment_count: 0,
          app_count: 0,
        }
        mockWorkspaces.push(newWs)
        return Promise.resolve(newWs as Workspace)
      }
      return createWorkspace(payload)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  return useMutation({
    mutationFn: (workspaceId: string) => {
      if (useMocks) {
        const idx = mockWorkspaces.findIndex(w => w.workspace_id === workspaceId)
        if (idx !== -1) mockWorkspaces.splice(idx, 1)
        return Promise.resolve()
      }
      return deleteWorkspace(workspaceId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
