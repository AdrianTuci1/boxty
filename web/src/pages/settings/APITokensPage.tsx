import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listApiKeys, createApiKey, deleteApiKey } from '../../api/auth'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Copy, MoreHorizontal, Plus, FileText, Key } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function APITokensPage() {
  const { data } = useQuery({ queryKey: ['api-keys'], queryFn: () => listApiKeys('default') })
  const [keyName, setKeyName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const qc = useQueryClient()

  const handleCreate = async () => {
    if (!keyName) return
    await createApiKey({ owner_id: 'default', workspace_id: 'default', environment_id: 'default', name: keyName })
    setKeyName('')
    setShowNew(false)
    qc.invalidateQueries({ queryKey: ['api-keys'] })
  }

  const handleDelete = async (id: string) => {
    await deleteApiKey(id)
    qc.invalidateQueries({ queryKey: ['api-keys'] })
  }

  const tokens = data || []

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center gap-1.5">
          john-smith <span className="text-gray-500">/</span> API Tokens
        </h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Docs
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Token
          </button>
        </div>
      </div>

      {/* Token table */}
      <div className="mt-6 w-full border border-[#262626] bg-[#161616]/40 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex bg-[#161616] text-gray-400 text-xs font-medium p-3 border-b border-[#262626]">
          <span className="flex-1">Name / Token ID</span>
          <span className="flex-1">Created</span>
          <span className="w-10" />
        </div>

        {tokens.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={Key}
              title="No API tokens yet"
              subtitle="Create a token to authenticate with the Boxty API."
            />
          </div>
        ) : (
          tokens.map((k: any, i: number) => (
            <TokenRow
              key={k.id}
              token={{
                name: k.name,
                preview: k.key_preview,
                created: k.created_at,
                lastUsed: i === 0 ? 'Last used about 2 hours ago' : i === 1 ? '1 day ago' : 'No recent activity',
                id: k.id,
              }}
              onDelete={() => handleDelete(k.id)}
            />
          ))
        )}
      </div>

      {/* New Token Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">New API Token</h3>
            <input
              className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none mb-4"
              placeholder="Token name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TokenRow({ token, onDelete }: { token: { name: string; preview: string; created: string; lastUsed: string; id: string }; onDelete: () => void }) {
  return (
    <div className="flex items-center px-4 py-3.5 border-b border-[#262626]/40 hover:bg-[#1f1f1f]/40 transition-all last:border-b-0">
      {/* Name & Token ID */}
      <div className="flex-1">
        <p className="font-bold text-white text-xs">{token.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="font-mono text-gray-400 text-[11px]">{token.preview}</span>
          <button onClick={() => navigator.clipboard.writeText(token.preview)} className="text-gray-600 hover:text-gray-400 transition-colors">
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Created & relative time */}
      <div className="flex-1">
        <p className="text-gray-300 text-xs">{token.created}</p>
        <p className="text-gray-500 text-xs mt-1">{token.lastUsed}</p>
      </div>

      {/* Actions */}
      <div className="w-10 flex justify-center">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="text-gray-500 hover:text-white transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[140px] rounded-lg border border-[#262626] bg-[#1f1f1f] p-1 shadow-2xl" sideOffset={4}>
              <DropdownMenu.Item
                onClick={onDelete}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-xs text-red-400 outline-none hover:bg-red-950/50"
              >
                Revoke token
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}
