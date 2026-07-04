import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listApps, stopApp, deleteApp, type App } from '../api/apps'
import { useAuth } from './useAuth'
import { mockApps, mockSandboxApps } from '../core/mocks/apps.mock'
import { shouldUseMocks } from '../core/services/mock-decider.service'
import { getFilteredAndSortedApps, getLiveApps, getStoppedApps } from '../core/services/app.service'
import type { AppFilter } from '../core/use-cases/filter-apps.use-case'
import type { SortType } from '../core/use-cases/sort-apps.use-case'
import { mapAppFromApi } from '../core/models/app.model'

function combineApps(apiApps: App[]): App[] {
  const combined = [...apiApps]
  const mockAsApiApps = mockApps.map((m) => ({
    ...m,
    workload_id: m.id,
    environment_id: m.environmentId,
    deployer_name: m.deployerName,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
  })) as unknown as App[]
  for (const mock of mockAsApiApps) {
    if (!combined.find((a) => a.workload_id === mock.workload_id)) {
      combined.push(mock)
    }
  }
  return combined
}

export function useApps(workspaceId?: string, envId?: string) {
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  return useQuery<App[]>({
    queryKey: ['apps', workspaceId, envId],
    queryFn: async () => {
      if (useMocks) {
        const allMocks = [...mockApps, ...mockSandboxApps]
      return allMocks.map((m) => ({
        ...m,
        kind: m.type,
        workload_id: m.id,
        environment_id: m.environmentId,
        deployer_name: m.deployerName,
        created_at: m.createdAt.toISOString(),
        updated_at: m.updatedAt.toISOString(),
      })) as unknown as App[]
      }
      const raw = await listApps(workspaceId, envId)
      return combineApps(raw)
    },
    staleTime: useMocks ? Infinity : 30000,
  })
}

export function useAppById(appId?: string) {
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  return useQuery<App>({
    queryKey: ['apps', appId],
    enabled: !!appId,
    queryFn: async () => {
      if (useMocks) {
        const allMocks = [...mockApps, ...mockSandboxApps]
        const found = allMocks.find((m) => m.id === appId)
        if (found) {
        return {
          ...found,
          kind: found.type,
          workload_id: found.id,
          environment_id: found.environmentId,
          deployer_name: found.deployerName,
          created_at: found.createdAt.toISOString(),
          updated_at: found.updatedAt.toISOString(),
        } as unknown as App
        }
        throw new Error(`Mock app not found: ${appId}`)
      }
      const { getApp } = await import('../api/apps')
      return getApp(appId!)
    },
    staleTime: useMocks ? Infinity : 30000,
  })
}

export function useFilteredApps(apps: App[] | undefined, filter: AppFilter, sort: SortType) {
  if (!apps) return []
  const models = apps.map((a: any) => mapAppFromApi(a))
  return getFilteredAndSortedApps(models, filter, sort)
}

export function useLiveApps(apps: App[] | undefined) {
  if (!apps) return []
  const models = apps.map((a: any) => mapAppFromApi(a))
  return getLiveApps(models)
}

export function useStoppedApps(apps: App[] | undefined) {
  if (!apps) return []
  const models = apps.map((a: any) => mapAppFromApi(a))
  return getStoppedApps(models)
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
