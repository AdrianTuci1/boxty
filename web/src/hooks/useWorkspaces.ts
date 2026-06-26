import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listWorkspaces, createWorkspace, deleteWorkspace, type Workspace } from '../api/workspaces'

export function useWorkspaces() {
  return useQuery<Workspace[]>({ queryKey: ['workspaces'], queryFn: listWorkspaces })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createWorkspace(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
