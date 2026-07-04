import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSandboxes, getSandbox, stopSandbox, type Sandbox } from '../api/sandboxes'
import { shouldUseMocks } from '../core/services/mock-decider.service'

const MOCK_SANDBOXES: Sandbox[] = [
  {
    workload_id: 'mock-sbx-statsparrot-pne-1',
    id: 'mock-sbx-statsparrot-pne-1',
    owner_id: 'usr-mock',
    workspace_id: 'ws-mock',
    environment_id: 'env-mock',
    kind: 'sandbox',
    status: 'running',
    image: 'mock',
    command: [],
    env: {},
    region: 'eu-central',
    pool: 'general',
    secret_names: [],
    volume_mounts: [],
    resources: { cpu_cores: 1, memory_mb: 512, disk_gb: 2, gpu_count: 0, gpu_type: null },
    metadata: {},
    accrued_cost_usd: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    workload_id: 'mock-sbx-statsparrot-pne-2',
    id: 'mock-sbx-statsparrot-pne-2',
    owner_id: 'usr-mock',
    workspace_id: 'ws-mock',
    environment_id: 'env-mock',
    kind: 'sandbox',
    status: 'running',
    image: 'mock',
    command: [],
    env: {},
    region: 'eu-central',
    pool: 'general',
    secret_names: [],
    volume_mounts: [],
    resources: { cpu_cores: 1, memory_mb: 512, disk_gb: 2, gpu_count: 0, gpu_type: null },
    metadata: {},
    accrued_cost_usd: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useSandboxes(workspaceId?: string, environmentId?: string) {
  const useMocks = shouldUseMocks()

  return useQuery<Sandbox[]>({
    queryKey: ['sandboxes', workspaceId, environmentId],
    queryFn: () => {
      if (useMocks) return MOCK_SANDBOXES
      return listSandboxes(workspaceId, environmentId)
    },
    staleTime: useMocks ? Infinity : 0,
  })
}

export function useSandbox(id: string) {
  return useQuery<Sandbox>({ queryKey: ['sandboxes', id], queryFn: () => getSandbox(id), enabled: !!id })
}

export function useStopSandbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: stopSandbox,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sandboxes'] }),
  })
}
