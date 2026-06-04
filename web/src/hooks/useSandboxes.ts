import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSandboxes, getSandbox, stopSandbox, type Sandbox } from '../api/sandboxes'

export function useSandboxes() {
  return useQuery<Sandbox[]>({ queryKey: ['sandboxes'], queryFn: listSandboxes })
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
