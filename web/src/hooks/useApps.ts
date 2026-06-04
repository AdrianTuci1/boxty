import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listApps, getApp, stopApp, deleteApp, type App } from '../api/apps'

export function useApps(envId?: string) {
  return useQuery<App[]>({ queryKey: ['apps', envId], queryFn: () => listApps(envId) })
}

export function useApp(id: string) {
  return useQuery<App>({ queryKey: ['apps', id], queryFn: () => getApp(id), enabled: !!id })
}

export function useStopApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: stopApp,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }),
  })
}

export function useDeleteApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteApp,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['apps'] }),
  })
}
