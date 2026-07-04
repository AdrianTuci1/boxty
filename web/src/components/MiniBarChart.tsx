import { useEffect, useMemo, useRef, useState } from 'react'

export interface MiniBarChartProps {
  /** One value per bar. Defaults to an array of zeros. */
  data?: number[]
  /** Optional labels for each bar. */
  labels?: string[]
  /** Color for non-empty bars. */
  barColor?: string
  /** Color for the centered zero-state bars. */
  emptyColor?: string
  /** Color for the hovered bar. */
  hoverColor?: string
  /** Rendered height in pixels. */
  height?: number
  className?: string
  /** Tooltip text factory: (value, index) => string. */
  tooltipFormatter?: (value: number, index: number) => string
  /** Show a gray skeleton while data is loading. */
  loading?: boolean
  /** How zero values are rendered: 'centered' keeps a short centered line, 'hidden' leaves the bar empty. */
  emptyMode?: 'centered' | 'hidden'
  /** Color for the loading skeleton bars. */
  loadingColor?: string
}

/**
 * Compact canvas bar chart with N bars (defaults to 7).
 * - When a value is zero the bar is rendered as a short centered line (or hidden when emptyMode is 'hidden').
 * - Hovering a bar shows a custom tooltip with "x calls".
 * - A loading skeleton can be shown with gray filled bars.
 */
export default function MiniBarChart({
  data = [],
  labels = [],
  barColor = '#34d399',
  emptyColor = '#333333',
  hoverColor = '#4ade80',
  height = 40,
  className = '',
  tooltipFormatter = (value) => `${value} calls`,
  loading = false,
  emptyMode = 'centered',
  loadingColor = '#3f3f3f',
}: MiniBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const bars = useMemo(() => {
    const values = data.length > 0 ? [...data] : Array(7).fill(0)
    const max = Math.max(...values, 1)
    return values.map((value, i) => ({
      value,
      label: labels[i] || '',
      isEmpty: value === 0,
      normalized: value / max,
    }))
  }, [data, labels])

  // Stable skeleton heights so they don't flicker on every render
  const skeletonHeights = useMemo(() => {
    const count = data.length || 7
    return Array.from({ length: count }, (_, i) => 0.3 + ((i * 13) % 7) / 10)
  }, [data.length])

  const getLayout = (width: number, height: number) => {
    const padding = { top: 4, right: 4, bottom: 4, left: 4 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const count = bars.length || 7
    const gap = Math.max(4, chartWidth / (count * 4))
    const barWidth = Math.max(2, (chartWidth - gap * (count - 1)) / count)
    return { padding, chartWidth, chartHeight, gap, barWidth, count }
  }

  const draw = (hoverIndex: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, rect.width * dpr)
    canvas.height = Math.max(1, rect.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const { padding, chartHeight, gap, barWidth, count } = getLayout(rect.width, rect.height)
    const centerY = padding.top + chartHeight / 2

    for (let i = 0; i < count; i++) {
      const bar = bars[i] ?? { value: 0, label: '', isEmpty: true, normalized: 0 }
      const x = padding.left + i * (barWidth + gap)
      const barHeight = bar.isEmpty ? 4 : Math.max(4, bar.normalized * chartHeight)
      const y = bar.isEmpty ? centerY - 2 : padding.top + chartHeight - barHeight
      const fill = i === hoverIndex ? hoverColor : bar.isEmpty ? emptyColor : barColor

      if (loading) {
        const h = Math.max(4, skeletonHeights[i] * chartHeight)
        ctx.fillStyle = loadingColor
        drawRoundedRect(ctx, x, padding.top + chartHeight - h, barWidth, h, 2)
        ctx.fill()
        continue
      }

      if (bar.isEmpty && emptyMode === 'hidden') {
        continue
      }

      ctx.fillStyle = fill
      drawRoundedRect(ctx, x, y, barWidth, barHeight, 2)
      ctx.fill()
    }
  }

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  useEffect(() => {
    draw(hoveredIndex)

    const handleResize = () => draw(hoveredIndex)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [bars, hoveredIndex, height])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const { padding, gap, barWidth, count } = getLayout(rect.width, rect.height)

    if (mouseX < padding.left || mouseX > rect.width - padding.right) {
      setHoveredIndex(null)
      setTooltip(null)
      return
    }

    const index = Math.floor((mouseX - padding.left) / (barWidth + gap))
    if (index >= 0 && index < count) {
      setHoveredIndex(index)
      const bar = bars[index]
      setTooltip({
        text: loading ? 'Loading…' : tooltipFormatter(bar.value, index),
        x: mouseX,
        y: mouseY,
      })
    } else {
      setHoveredIndex(null)
      setTooltip(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltip(null)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-[#1f1f1f] border border-[#262626] text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: Math.max(0, tooltip.y - 28),
            transform: 'translateX(-50%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
