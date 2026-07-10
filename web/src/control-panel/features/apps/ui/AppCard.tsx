import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Terminal, Globe } from 'lucide-react';
import { timeAgo } from '@/core/utils/time-ago';
import type { AppModel } from '@/control-panel/core/models/app.model';
import { AppCardViewModel } from '@/control-panel/features/apps/view-models/app-card.view-model';
import { Badge } from '@/control-panel/shared/components/Badge';
import { StatusBadge } from '@/control-panel/shared/components/Badge';
import MiniBarChart from '@/components/MiniBarChart';
import { generateCallCounts } from '@/core/utils/call-data';

interface AppCardProps {
  app: AppModel;
  workspace: string;
  environment: string;
}

export function AppCard({ app, workspace, environment }: AppCardProps) {
  const navigate = useNavigate();
  const vm = useMemo(() => new AppCardViewModel(app, workspace, environment), [app, workspace, environment]);

  return (
    <div
      onClick={() => navigate(vm.route)}
      className="bg-[#161616] border border-[#262626] rounded-xl hover:border-[#383838] cursor-pointer transition-all duration-200"
    >
      <div className="h-11 px-4 flex items-center justify-between bg-[#191919]/30">
        <span className="font-mono text-sm font-semibold text-gray-200 tracking-tight hover:text-white transition-colors">
          {app.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-[10px] font-bold text-white">
            {vm.ownerInitial}
          </div>
          <span className="text-gray-300 text-xs font-medium">{app.deployerName || workspace}</span>
          <span className="text-gray-500 text-xs">{timeAgo(app.updatedAt)}</span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[#262626]/40 border-t border-[#262626]/40 bg-[#171717]/10">
        {vm.isSandbox ? (
          vm.displayInstances.map((inst) => (
            <SandboxRow key={inst.id} instance={inst} />
          ))
        ) : (
          vm.displayFunctions.map((fn) => (
            <FunctionRow key={fn} fn={fn} appId={app.id} badges={vm.getBadgesForFunction(fn)} />
          ))
        )}
      </div>
    </div>
  );
}

function SandboxRow({ instance }: { instance: import('@/control-panel/core/models/app.model').InstanceConfigModel }) {
  return (
    <div className="flex items-center justify-between hover:bg-[#1c1c1c]/40 transition-colors px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1f1f1f] text-gray-400">
          <Box className="h-3 w-3" />
        </div>
        <span className="font-mono text-xs font-medium text-gray-300">{instance.name}</span>
        <div className="flex items-center gap-1.5 ml-2">
          <Badge variant="sandbox">Sandbox</Badge>
          {instance.gpu && <Badge variant="gpu">GPU</Badge>}
          {instance.cpu > 0 && <Badge variant="cpu">{instance.cpu} CPU</Badge>}
        </div>
      </div>

      <div className="flex-1 mx-4 border-b border-dashed border-[#262626]" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500">
          {instance.status === 'stopped' ? 'STOPPED' : 'RUNNING'}
        </span>
        <StatusBadge active={instance.status !== 'stopped'} />
      </div>
    </div>
  );
}

function FunctionRow({
  fn,
  appId,
  badges,
}: {
  fn: string;
  appId: string;
  badges: { label: string; variant: 'cpu' | 'gpu' | 'web' | 'sandbox' | 'status' }[];
}) {
  const calls = useMemo(() => generateCallCounts(`${appId}:${fn}`), [appId, fn]);
  const totalCalls = useMemo(() => calls.reduce((a, b) => a + b, 0), [calls]);

  return (
    <div className="flex items-center justify-between hover:bg-[#1c1c1c]/40 transition-colors px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1f1f1f] text-gray-400">
          <Terminal className="h-3 w-3" />
        </div>
        <span className="font-mono text-xs font-medium text-gray-300">{fn}</span>
        <div className="flex items-center gap-1.5 ml-2">
          {badges.map((badge) => (
            <Badge key={badge.label} variant={badge.variant}>{badge.label}</Badge>
          ))}
          <Badge variant="web" icon={<Globe className="h-3 w-3" />}>Web Function</Badge>
        </div>
      </div>

      <div className="relative w-[180px] shrink-0 group">
        <MiniBarChart data={calls} height={32} className="w-full" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="bg-[#1f1f1f] border border-[#262626] text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded">
            {totalCalls.toLocaleString()} calls
          </span>
        </div>
      </div>
    </div>
  );
}
