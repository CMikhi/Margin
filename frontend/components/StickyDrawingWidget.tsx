'use client'

/**
 * StickyDrawingWidget — lightweight freehand drawing sticky note.
 *
 * Client-only component. Fabric.js is dynamically imported inside
 * useFabricCanvas so nothing touches the server.
 *
 * Features:
 *  - Free-draw mode only (no selection, shapes, or layers)
 *  - Basic colour swatch bar
 *  - Brush-width toggle (thin / medium / thick)
 *  - Auto-resizes canvas to container via ResizeObserver
 *  - Pointer-event driven (stylus / Apple Pencil friendly)
 *  - Serialises to JSON for persistence
 *  - Fully self-contained — no state leaks outside
 */

import { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { useFabricCanvas } from '@/lib/hooks/useFabricCanvas'

// ── Colour palette ──────────────────────────────────────────
const COLORS = [
  '#1e1e1e', // black
  '#e03131', // red
  '#2f9e44', // green
  '#1971c2', // blue
  '#f08c00', // orange
  '#7048e8', // purple
]

const BRUSH_SIZES = [
  { label: 'S', width: 2 },
  { label: 'M', width: 5 },
  { label: 'L', width: 10 },
]

// ── Props ───────────────────────────────────────────────────
interface StickyDrawingWidgetProps {
  id: string
  /** Persisted JSON blob — pass in to restore previous drawing */
  initialData?: string
  /** Called whenever the canvas changes, with a JSON string */
  onDataChange?: (id: string, json: string) => void
  onDelete?: (id: string) => void
}

const STICKY_BG = '#fef9c3' // warm yellow sticky-note background

export function StickyDrawingWidget({
  id,
  initialData,
  onDataChange,
  onDelete,
}: StickyDrawingWidgetProps) {
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeBrushIdx, setActiveBrushIdx] = useState(0)
  const [showBackground, setShowBackground] = useState(true)
  const hasRestored = useRef(false)

  // Fabric hook — starts in free-drawing mode
  const { canvasElRef, containerRef, getCanvas, toJSON, loadFromJSON, isReady } =
    useFabricCanvas({
      freeDrawing: true,
      brushColor: COLORS[0],
      brushWidth: BRUSH_SIZES[0].width,
    })

  // ── Debug logging ─────────────────────────────────────────
  useEffect(() => {
    console.log('[StickyDrawingWidget] isReady changed:', isReady)
    if (isReady) {
      const canvas = getCanvas()
      console.log('[StickyDrawingWidget] canvas:', canvas)
      console.log('[StickyDrawingWidget] isDrawingMode:', canvas?.isDrawingMode)
      console.log('[StickyDrawingWidget] freeDrawingBrush:', canvas?.freeDrawingBrush)
      console.log('[StickyDrawingWidget] freeDrawingBrush color:', canvas?.freeDrawingBrush?.color)
      console.log('[StickyDrawingWidget] freeDrawingBrush width:', canvas?.freeDrawingBrush?.width)
      console.log('[StickyDrawingWidget] containerRef:', containerRef.current)
      console.log('[StickyDrawingWidget] canvasElRef:', canvasElRef.current)

      // Check if canvas elements are in the DOM
      const canvasEls = containerRef.current?.querySelectorAll('canvas')
      console.log('[StickyDrawingWidget] canvas elements in container:', canvasEls?.length)
      canvasEls?.forEach((el, i) => {
        const style = window.getComputedStyle(el)
        console.log(`[StickyDrawingWidget] canvas[${i}]:`, {
          width: el.width, height: el.height,
          cssWidth: style.width, cssHeight: style.height,
          display: style.display, visibility: style.visibility,
          pointerEvents: style.pointerEvents,
          position: style.position,
          zIndex: style.zIndex,
        })
      })
    }
  }, [isReady, getCanvas, containerRef, canvasElRef])

  // ── Restore persisted data once canvas is ready ───────────
  useEffect(() => {
    if (!isReady || hasRestored.current) return
    if (initialData) {
      loadFromJSON(initialData)
    }
    hasRestored.current = true
  }, [isReady, initialData, loadFromJSON])

  // ── Persist on every path-created event ───────────────────
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const handlePathCreated = () => {
      console.log('[StickyDrawingWidget] path:created fired!')
      const json = toJSON()
      if (json && onDataChange) {
        onDataChange(id, JSON.stringify(json))
      }
    }

    // Also log mouse events for debugging
    const handleMouseDown = (e: any) => console.log('[StickyDrawingWidget] mouse:down', e.pointer)
    const handleMouseMove = (e: any) => {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.02) console.log('[StickyDrawingWidget] mouse:move (sampled)', e.pointer)
    }
    const handleMouseUp = (e: any) => console.log('[StickyDrawingWidget] mouse:up', e.pointer)

    canvas.on('path:created', handlePathCreated)
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    return () => {
      canvas.off('path:created', handlePathCreated)
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [isReady, getCanvas, toJSON, id, onDataChange])

  // ── Colour change ─────────────────────────────────────────
  const handleColorChange = useCallback(
    (color: string) => {
      setActiveColor(color)
      const canvas = getCanvas()
      if (canvas?.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color
      }
    },
    [getCanvas],
  )

  // ── Brush width change ────────────────────────────────────
  const handleBrushSize = useCallback(
    (idx: number) => {
      setActiveBrushIdx(idx)
      const canvas = getCanvas()
      if (canvas?.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = BRUSH_SIZES[idx].width
      }
    },
    [getCanvas],
  )

  // ── Clear canvas ──────────────────────────────────────────
  const handleClear = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = 'transparent'
    canvas.renderAll()
    if (onDataChange) {
      onDataChange(id, JSON.stringify(canvas.toJSON()))
    }
  }, [getCanvas, id, onDataChange])

  // ── Toggle background ─────────────────────────────────
  const handleToggleBg = useCallback(() => {
    setShowBackground((prev) => !prev)
  }, [])

  const rootStyle: CSSProperties = {
    backgroundColor: showBackground ? STICKY_BG : 'transparent',
    borderRadius: showBackground ? '6px' : undefined,
  }

  return (
    <div className="flex flex-col h-full w-full select-none" style={rootStyle}>
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-divider)' }}
      >
        {/* Colour swatches */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className="w-4 h-4 rounded-full transition-transform duration-100"
              style={{
                backgroundColor: c,
                transform: activeColor === c ? 'scale(1.3)' : 'scale(1)',
                boxShadow:
                  activeColor === c
                    ? '0 0 0 2px var(--bg-primary), 0 0 0 3px ' + c
                    : 'none',
              }}
              title={c}
            />
          ))}
        </div>

        {/* Divider */}
        <div
          className="w-px h-4 mx-1"
          style={{ backgroundColor: 'var(--border-default)' }}
        />

        {/* Brush widths */}
        <div className="flex items-center gap-1">
          {BRUSH_SIZES.map((b, idx) => (
            <button
              key={b.label}
              onClick={() => handleBrushSize(idx)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors duration-100"
              style={{
                color:
                  activeBrushIdx === idx
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                backgroundColor:
                  activeBrushIdx === idx ? 'var(--bg-hover)' : 'transparent',
                border:
                  activeBrushIdx === idx
                    ? '1px solid var(--border-default)'
                    : '1px solid transparent',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Background toggle */}
        <button
          onClick={handleToggleBg}
          className="text-[10px] px-1.5 py-0.5 rounded transition-colors duration-100"
          style={{
            color: showBackground ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: showBackground ? 'var(--bg-hover)' : 'transparent',
            border: showBackground
              ? '1px solid var(--border-default)'
              : '1px solid transparent',
          }}
          title={showBackground ? 'Hide background' : 'Show background'}
        >
          BG
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="text-[10px] px-1.5 py-0.5 rounded transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-red)'
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Clear canvas"
        >
          Clear
        </button>
      </div>

      {/* ── Canvas container ────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  )
}
