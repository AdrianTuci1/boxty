import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { commandPaletteRegistry } from '@/control-panel/features/command-palette/services/command-palette.registry';
import { NavigationCommandFactory } from '@/control-panel/features/command-palette/factories/navigation-command.factory';
import type { ICommandPaletteCommand } from '@/control-panel/core/ports/command-palette.port';

interface CommandPaletteCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CommandPaletteCtx>({ open: false, setOpen: () => {} });

export function useCommandPalette() {
  return useContext(Ctx);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <CommandPaletteOverlay open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

function CommandPaletteOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    commandPaletteRegistry.clear();
    const factory = new NavigationCommandFactory(navigate, location.pathname);
    factory.all().forEach((cmd) => commandPaletteRegistry.register(cmd));
  }, [navigate, location.pathname]);

  const filtered = commandPaletteRegistry.list(query);
  const categories = groupByCategory(filtered);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery('');
  }, [open]);

  const execute = useCallback(
    (item: ICommandPaletteCommand) => {
      item.execute();
      onClose();
    },
    [onClose],
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[540px] max-w-full bg-[#161616] border border-[#262626] rounded-xl overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 border-b border-[#262626] px-4 flex items-center gap-3 bg-[#161616]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            className="bg-transparent border-0 outline-0 p-0 text-sm text-white font-sans tracking-wide w-full placeholder-gray-600"
            placeholder="Enter an ID or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="py-2 max-h-[380px] overflow-y-auto">
          {categories.map(([category, items]) => (
            <div key={category}>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1.5 block">
                {category}
              </span>
              {items.map((item, idx) => {
                const globalIdx = getGlobalIndex(categories, category, idx);
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    className={`w-[calc(100%-16px)] mx-2 px-3 py-2 rounded-md flex items-center justify-between cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-[#1f1f1f] text-white' : 'bg-transparent hover:bg-[#1f1f1f] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="h-10 bg-[#111111]/40 border-t border-[#262626] px-4 flex items-center gap-4 text-[11px] font-sans text-gray-500 mt-2">
          <KeyHint label="↵" desc="Open" />
          <KeyHint label="↑↓" desc="Select" />
          <KeyHint label="esc" desc="Close" />
        </div>
      </div>
    </div>
  );
}

function KeyHint({ label, desc }: { label: string; desc: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-gray-400 bg-[#1f1f1f] border border-[#262626] px-1 py-0.2 rounded font-mono text-[10px]">
        {label}
      </span>
      {desc}
    </span>
  );
}

function groupByCategory(items: ICommandPaletteCommand[]): [string, ICommandPaletteCommand[]][] {
  const map = new Map<string, ICommandPaletteCommand[]>();
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  }
  return Array.from(map.entries());
}

function getGlobalIndex(categories: [string, ICommandPaletteCommand[]][], category: string, idx: number): number {
  let count = 0;
  for (const [cat, items] of categories) {
    if (cat === category) return count + idx;
    count += items.length;
  }
  return 0;
}
