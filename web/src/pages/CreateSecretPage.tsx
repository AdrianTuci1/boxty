import { useState, useRef, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createSecret } from '../api/secrets'
import { ArrowLeft, Key, MinusCircle, Upload } from 'lucide-react'

interface EnvVarRow {
  key: string
  value: string
}

export default function CreateSecretPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('custom-secret')
  const [envVars, setEnvVars] = useState<EnvVarRow[]>([{ key: '', value: '' }])
  const [submitting, setSubmitting] = useState(false)

  const isValid =
    name.trim().length > 0 &&
    envVars.some((r) => r.key.trim().length > 0 && r.value.trim().length > 0)

  const handleAddRow = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '' }])
  }

  const handleRemoveRow = (idx: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleRowChange = (idx: number, field: 'key' | 'value', val: string) => {
    setEnvVars((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  }

  const handleImportEnv = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed: EnvVarRow[] = []
      for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        const k = trimmed.slice(0, eqIdx).trim()
        const v = trimmed.slice(eqIdx + 1).trim()
        if (k) parsed.push({ key: k, value: v })
      }
      if (parsed.length > 0) {
        setEnvVars((prev) => {
          const filtered = prev.filter((r) => r.key.trim() !== '' || r.value.trim() !== '')
          return [...filtered, ...parsed]
        })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        value: envVars
          .filter((r) => r.key.trim() && r.value.trim())
          .map((r) => `${r.key.trim()}=${r.value.trim()}`)
          .join('\n'),
      }
      await createSecret(payload)
      qc.invalidateQueries({ queryKey: ['secrets'] })
      navigate(`/secrets/${workspace}/${environment}`)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex gap-10">
      {/* Left column — Back */}
      <div className="w-32 shrink-0">
        <button
          onClick={() => navigate(`/secrets/${workspace}/${environment}`)}
          className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
      </div>

      {/* Right column — content */}
      <div className="flex-1 min-w-0">
        {/* Title + Tag */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create new secret</h1>
          <span className="bg-[#142920] border border-[#1e3f31] text-[#34d399] text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5">
            <Key className="h-3 w-3" />
            Custom
          </span>
        </div>

        {/* Name */}
        <label className="text-sm font-semibold text-white block mb-1">Name</label>
        <p className="text-gray-400 text-xs font-medium mb-3 block">
          Choose a unique name to reference this secret in your code.
        </p>
        <div className="bg-[#161616] border border-[#262626] focus-within:border-[#34d399] rounded-md px-3 py-2 w-full max-w-sm transition-all flex items-center">
          <input
            className="bg-transparent border-0 outline-0 p-0 text-xs text-white font-mono tracking-tight w-full placeholder-gray-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Environment variables */}
        <label className="text-sm font-semibold text-white block mt-8 mb-1">Environment variables</label>
        <p className="text-gray-400 text-xs font-medium mb-3 block">
          Assign environment variables to this secret.
        </p>

        <div className="bg-[#161616] border border-[#262626] rounded-xl p-5 w-full max-w-3xl space-y-4">
          {envVars.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              {/* Key */}
              <div className="col-span-5">
                <span className="text-gray-400 text-xs font-medium mb-1.5 block">Key</span>
                <input
                  className="bg-[#111111] border border-[#262626] rounded-md px-3 py-2 w-full text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
                  placeholder="e.g. CLIENT_TOKEN_1"
                  value={row.key}
                  onChange={(e) => handleRowChange(idx, 'key', e.target.value)}
                />
              </div>

              {/* Value */}
              <div className="col-span-6">
                <span className="text-gray-400 text-xs font-medium mb-1.5 block">Value</span>
                <input
                  className="bg-[#111111] border border-[#262626] rounded-md px-3 py-2 w-full text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
                  value={row.value}
                  onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                />
              </div>

              {/* Remove */}
              <div className="col-span-1 flex justify-center mt-6">
                {envVars.length > 1 && (
                  <button onClick={() => handleRemoveRow(idx)}>
                    <MinusCircle className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors cursor-pointer" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAddRow}
              className="bg-transparent hover:bg-[#1f1f1f] border border-[#262626] text-gray-300 hover:text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all"
            >
              + Add another
            </button>
            <button
              onClick={handleImportEnv}
              className="bg-transparent hover:bg-[#1f1f1f] border border-[#262626] text-gray-300 hover:text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              ⇄ Import .env
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".env,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Done */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all ${
              isValid
                ? 'bg-[#34d399] text-black font-semibold cursor-pointer hover:bg-[#2bc48a]'
                : 'bg-[#14211a] border border-[#1b3527] text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
