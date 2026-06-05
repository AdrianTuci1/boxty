import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listApps, stopApp, deleteApp, type App } from '../api/apps'
import { useAuth } from './useAuth'

const MOCK_APPS: App[] = [
  {
    id: 'mock-statsparrot-pne',
    name: 'statsparrot-pne',
    environment_id: '',
    status: 'active',
    deployer_name: 'adrian-tucicovenco',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    functions: ['fastapi_app'],
    instances: [
      {
        id: 'mock-inst-1',
        app_id: 'mock-statsparrot-pne',
        name: 'fastapi_app',
        cpu: 1,
        memory: 512,
        gpu: null,
        min_containers: 1,
        max_containers: 5,
        scaledown_window: 300,
        running_containers: 2,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'mock-statsparrot-analytics',
    name: 'statsparrot-analytics-worker',
    environment_id: '',
    status: 'active',
    deployer_name: 'adrian-tucicovenco',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    functions: ['fastapi_app'],
    instances: [
      {
        id: 'mock-inst-2',
        app_id: 'mock-statsparrot-analytics',
        name: 'fastapi_app',
        cpu: 1,
        memory: 512,
        gpu: null,
        min_containers: 1,
        max_containers: 3,
        scaledown_window: 300,
        running_containers: 1,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'mock-dental-seg',
    name: 'dental-tooth-segmentation',
    environment_id: '',
    status: 'active',
    deployer_name: 'adrian-tucicovenco',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    functions: ['api_predict', 'predict_cli', 'run_prediction'],
    instances: [
      {
        id: 'mock-inst-3',
        app_id: 'mock-dental-seg',
        name: 'api_predict',
        cpu: 2,
        memory: 1024,
        gpu: 't4',
        min_containers: 1,
        max_containers: 2,
        scaledown_window: 600,
        running_containers: 1,
        status: 'active',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-inst-4',
        app_id: 'mock-dental-seg',
        name: 'predict_cli',
        cpu: 2,
        memory: 1024,
        gpu: 't4',
        min_containers: 0,
        max_containers: 1,
        scaledown_window: 600,
        running_containers: 0,
        status: 'stopped',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-inst-5',
        app_id: 'mock-dental-seg',
        name: 'run_prediction',
        cpu: 2,
        memory: 1024,
        gpu: 't4',
        min_containers: 0,
        max_containers: 1,
        scaledown_window: 600,
        running_containers: 0,
        status: 'stopped',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
]

export function useApps(envId?: string) {
  const { devMode } = useAuth()

  return useQuery<App[]>({
    queryKey: ['apps', envId],
    queryFn: () => {
      if (devMode) return MOCK_APPS
      return listApps(envId)
    },
    staleTime: devMode ? Infinity : 0,
  })
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
