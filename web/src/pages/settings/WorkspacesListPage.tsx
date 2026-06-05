import { FileText, Copy } from 'lucide-react'

export default function WorkspacesListPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspaces</h1>
          <span className="text-gray-400 text-xs font-medium mt-1.5 block">Manage your workspace memberships.</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Docs
          </button>
          <button className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#262626] text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors">
            + Create Workspace
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#262626] bg-[#161616] overflow-hidden">
        {/* Header */}
        <div className="flex bg-[#111111]/40 border-b border-[#262626] px-4 py-2.5 text-[11px] font-semibold tracking-wider text-gray-500">
          <span className="flex-1">Organization</span>
          <span className="w-32">Role</span>
          <span className="w-40" />
        </div>

        {/* Row 1: adrian-tucicovenco */}
        <div className="flex items-center px-4 py-3 border-b border-[#262626]/40 hover:bg-[#1f1f1f]/20 transition-colors">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-yellow-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              A
            </div>
            <span className="text-white text-xs font-medium">adrian-tucicovenco</span>
            <span className="bg-[#222222] text-gray-400 text-[10px] px-1.5 py-0.2 rounded-md border border-[#2d2d2d] ml-1.5">
              personal
            </span>
          </div>
          <span className="w-32 text-gray-400 text-xs">Owner</span>
          <div className="w-40 flex items-center gap-1.5 justify-end">
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs px-2.5 py-1 rounded transition-colors">
              <Copy className="h-3 w-3" />
              Copy ID
            </button>
            <button className="border border-red-950/40 text-red-400 text-xs px-2.5 py-1 rounded hover:bg-red-950/20 transition-colors">
              Leave
            </button>
          </div>
        </div>

        {/* Row 2: staging-static */}
        <div className="flex items-center px-4 py-3 hover:bg-[#1f1f1f]/20 transition-colors">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-white text-xs font-medium">staging-static</span>
            <span className="rounded border border-[#4a285a] bg-[#2e1c36] px-1.5 py-0.5 font-mono text-[10px] text-[#e879f9] leading-none">
              Starter
            </span>
          </div>
          <span className="w-32 text-gray-400 text-xs">Owner</span>
          <div className="w-40 flex items-center gap-1.5 justify-end">
            <button className="text-xs text-gray-300 bg-[#1f1f1f] border border-[#262626] px-2.5 py-1 rounded-md hover:bg-[#262626] transition-colors">
              Manage members
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
