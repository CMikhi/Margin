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

const ERASER_SIZES = [
  { label: 'S', width: 10 },
  { label: 'M', width: 24 },
  { label: 'L', width: 44 },
]

// Eraser preview colour — fully opaque so destination-out erases 100%.
// Visible on the upper canvas during the live stroke, then swapped to
// a destination-out path on commit.
const ERASER_PREVIEW = '#f5a0a0'

// ── Props ───────────────────────────────────────────────────
interface StickyDrawingWidgetProps {
  id: string
  /** Persisted JSON blob — pass in to restore previous drawing */
  initialData?: string
  /** Called whenever the canvas changes, with a JSON string */
  onDataChange?: (id: string, json: string) => void
  onDelete?: (id: string) => void
}

const STICKY_BG = '#F7F7F5' // cream sticky-note background

export function StickyDrawingWidget({
  id,
  initialData,
  onDataChange,
  onDelete,
}: StickyDrawingWidgetProps) {
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeBrushIdx, setActiveBrushIdx] = useState(0)
  const [activeEraserIdx, setActiveEraserIdx] = useState(1) // default Medium
  const [showBackground, setShowBackground] = useState(true)
  const [isErasing, setIsErasing] = useState(false)
  const isErasingRef = useRef(false)
  const hasRestored = useRef(false)
  const eraserCursorRef = useRef<HTMLDivElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)

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

    const handlePathCreated = (opt: any) => {
      const path = opt.path
      if (isErasingRef.current && path) {
        // Replace the visible preview path with a proper eraser path:
        // - fully-opaque black stroke so destination-out removes 100%
        // - globalCompositeOperation tells the renderer to erase
        path.set({
          stroke: '#000000',
          globalCompositeOperation: 'destination-out',
        })
        canvas.renderAll()
      }
      const json = toJSON()
      if (json && onDataChange) {
        onDataChange(id, JSON.stringify(json))
      }
    }

    canvas.on('path:created', handlePathCreated)
    return () => {
      canvas.off('path:created', handlePathCreated)
    }
  }, [isReady, getCanvas, toJSON, id, onDataChange])

  // ── Helper: update the existing brush (never replace it) ──
  const setBrush = useCallback(
    (color: string, width: number) => {
      const canvas = getCanvas()
      if (!canvas?.freeDrawingBrush) return
      canvas.freeDrawingBrush.color = color
      canvas.freeDrawingBrush.width = width
    },
    [getCanvas],
  )

  // ── Colour change ─────────────────────────────────────────
  const handleColorChange = useCallback(
    (color: string) => {
      setActiveColor(color)
      // Exit eraser mode when a colour is selected
      if (isErasingRef.current) {
        setIsErasing(false)
        isErasingRef.current = false
      }
      setBrush(color, BRUSH_SIZES[activeBrushIdx].width)
    },
    [activeBrushIdx, setBrush],
  )

  // ── Brush width change ────────────────────────────────────
  const handleBrushSize = useCallback(
    (idx: number) => {
      setActiveBrushIdx(idx)
      if (isErasingRef.current) return // brush size doesn't affect eraser
      const canvas = getCanvas()
      if (canvas?.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = BRUSH_SIZES[idx].width
      }
    },
    [getCanvas],
  )

  // ── Eraser toggle ─────────────────────────────────────────
  const handleToggleEraser = useCallback(() => {
    if (isErasingRef.current) {
      // Back to drawing
      setIsErasing(false)
      isErasingRef.current = false
      setBrush(activeColor, BRUSH_SIZES[activeBrushIdx].width)
    } else {
      // Enter eraser mode — use a visible preview colour
      setIsErasing(true)
      isErasingRef.current = true
      setBrush(ERASER_PREVIEW, ERASER_SIZES[activeEraserIdx].width)
    }
  }, [activeColor, activeBrushIdx, activeEraserIdx, setBrush])

  // ── Eraser size change ────────────────────────────────────
  const handleEraserSize = useCallback(
    (idx: number) => {
      setActiveEraserIdx(idx)
      if (isErasingRef.current) {
        const canvas = getCanvas()
        if (canvas?.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = ERASER_SIZES[idx].width
        }
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

  // ── Eraser cursor tracking (direct DOM — no React re-renders) ──
  useEffect(() => {
    const el = canvasContainerRef.current
    const cursor = eraserCursorRef.current
    if (!el || !cursor) return

    if (!isErasing) {
      cursor.style.display = 'none'
      el.style.cursor = ''
      return
    }

    // Hide native cursor while erasing
    el.style.cursor = 'none'
    cursor.style.display = 'none' // hidden until first move

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      cursor.style.display = 'block'
      cursor.style.left = `${e.clientX - rect.left}px`
      cursor.style.top = `${e.clientY - rect.top}px`
    }
    const handleLeave = () => {
      cursor.style.display = 'none'
    }
    const handleEnter = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      cursor.style.display = 'block'
      cursor.style.left = `${e.clientX - rect.left}px`
      cursor.style.top = `${e.clientY - rect.top}px`
    }

    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerleave', handleLeave)
    el.addEventListener('pointerenter', handleEnter)
    return () => {
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerleave', handleLeave)
      el.removeEventListener('pointerenter', handleEnter)
      el.style.cursor = ''
      cursor.style.display = 'none'
    }
  }, [isErasing])

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

        {/* Divider */}
        <div
          className="w-px h-4 mx-1"
          style={{ backgroundColor: 'var(--border-default)' }}
        />

        {/* Eraser toggle */}
        <button
          onClick={handleToggleEraser}
          className="text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors duration-100"
          style={{
            color: isErasing ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: isErasing ? 'var(--bg-hover)' : 'transparent',
            border: isErasing
              ? '1px solid var(--border-default)'
              : '1px solid transparent',
          }}
          title={isErasing ? 'Switch to draw' : 'Eraser'}
        >
          Eraser
        </button>

        {/* Eraser sizes — visible only when erasing */}
        {isErasing && (
          <div className="flex items-center gap-1">
            {ERASER_SIZES.map((e, idx) => (
              <button
                key={e.label}
                onClick={() => handleEraserSize(idx)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors duration-100"
                style={{
                  color:
                    activeEraserIdx === idx
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  backgroundColor:
                    activeEraserIdx === idx ? 'var(--bg-hover)' : 'transparent',
                  border:
                    activeEraserIdx === idx
                      ? '1px solid var(--border-default)'
                      : '1px solid transparent',
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}

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
      <div className="flex-1 min-h-0 relative" ref={canvasContainerRef}>
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas ref={canvasElRef} />
        </div>

        {/* Eraser size outline cursor (always in DOM, visibility toggled via ref) */}
        <div
          ref={eraserCursorRef}
          style={{
            display: 'none',
            position: 'absolute',
            width: ERASER_SIZES[activeEraserIdx].width,
            height: ERASER_SIZES[activeEraserIdx].width,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1.5px solid rgba(0,0,0,0.45)',
            pointerEvents: 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
            zIndex: 50,
          }}
        />
      </div>
    </div>
  )
}
