interface BadgeProps {
  children: React.ReactNode;
  variant: 'cpu' | 'gpu' | 'web' | 'sandbox' | 'status';
  icon?: React.ReactNode;
}

const STYLES: Record<BadgeProps['variant'], string> = {
  cpu: 'bg-blue-950/20 border-blue-900/40 text-blue-400',
  gpu: 'bg-purple-950/20 border-purple-900/40 text-purple-400',
  web: 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400',
  sandbox: 'bg-amber-950/20 border-amber-900/40 text-amber-400',
  status: 'bg-gray-800 border-gray-700 text-gray-300',
};

export function Badge({ children, variant, icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border ${STYLES[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
  );
}
