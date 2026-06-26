import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSandboxes, getSandbox, stopSandbox, type Sandbox } from '../api/sandboxes'
import { useAuth } from './useAuth'

const MOCK_SANDBOXES: Sandbox[] = [
  {
    id: 'mock-sbx-statsparrot-pne-1',
    app_id: 'mock-statsparrot-pne',
    status: 'running',
    url: 'https://statsparrot-pne.mock.boxty.dev',
  },
  {
    id: 'mock-sbx-statsparrot-pne-2',
    app_id: 'mock-statsparrot-pne',
    status: 'running',
  },
  {
    id: 'mock-sbx-analytics-1',
    app_id: 'mock-statsparrot-analytics',
    status: 'running',
  },
  {
    id: 'mock-sbx-dental-1',
    app_id: 'mock-dental-seg',
    status: 'running',
  },
]

export function useSandboxes() {
  const { devMode } = useAuth()

  return useQuery<Sandbox[]>({
    queryKey: ['sandboxes'],
    queryFn: () => {
      if (devMode) return MOCK_SANDBOXES
      return listSandboxes()
    },
    staleTime: devMode ? Infinity : 0,
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
