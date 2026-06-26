import * as Switch from '@radix-ui/react-switch'
import { useState } from 'react'

const toggles = [
  { id: 'billing', title: 'Billing alerts', desc: 'Receive notifications about billing and payment updates.' },
  { id: 'product', title: 'Product Updates', desc: 'Get notified about new features and product improvements.' },
  { id: 'security', title: 'Security alerts', desc: 'Important security notifications about your account.' },
]

export default function EmailPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    billing: true,
    product: false,
    security: true,
  })

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Preferences</h1>
        <p className="text-sm text-gray-400 mt-1">Control your notification settings.</p>
      </div>

      <div className="rounded-xl border border-[#262626] bg-[#161616] p-6 space-y-4">
        {toggles.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-[#262626]/60 last:border-b-0">
            <div>
              <p className="text-sm text-white">{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
            </div>
            <Switch.Root
              checked={settings[t.id]}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, [t.id]: v }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings[t.id] ? 'bg-[#34d399]' : 'bg-[#262626]'}`}
            >
              <Switch.Thumb className="block h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>
        ))}
      </div>
    </div>
  )
}
