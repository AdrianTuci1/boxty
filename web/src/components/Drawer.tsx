import { useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Drawer({
  open,
  onClose,
  width = 'w-[500px]',
  children,
}: {
  open: boolean
  onClose: () => void
  width?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full ${width} border-l border-[#262626] bg-[#161616] shadow-2xl overflow-y-auto`}
      >
        {children}
      </div>
    </>
  )
}

export function useDrawerParam(param: string): [string | null, () => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(param)
  const close = () => {
    const next = new URLSearchParams(searchParams)
    next.delete(param)
    setSearchParams(next, { replace: true })
  }
  return [value, close]
}
