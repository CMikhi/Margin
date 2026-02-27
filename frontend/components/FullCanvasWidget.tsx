'use client'

/**
 * FullCanvasWidget — professional drawing canvas with shape tools,
 * layer management, fullscreen toggle, and JSON persistence.
 *
 * Client-only; Fabric.js is dynamically imported in useFabricCanvas
 * so it never runs during SSR.
 *
 * Features:
 *  - Drawing / selection mode toggle
 *  - Shape tools: rectangle, circle, arrow
 *  - Colour picker & brush-width slider
 *  - Layer panel: list, reorder, delete objects
 *  - Fullscreen toggle
 *  - Responsive canvas (ResizeObserver)
 *  - Pointer-event driven (stylus / Apple Pencil)
 *  - Serialises / restores from JSON
 *  - Fully encapsulated — no global state
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useFabricCanvas } from '@/lib/hooks/useFabricCanvas'

// ── Types ───────────────────────────────────────────────────
type ToolMode = 'select' | 'draw' | 'rect' | 'circle' | 'arrow' | 'eraser'

interface LayerItem {
  index: number
  type: string
  id: string
}

// ── Props ───────────────────────────────────────────────────
interface FullCanvasWidgetProps {
  id: string
  /** Persisted JSON blob */
  initialData?: string
  /** Called on canvas change with a JSON string */
  onDataChange?: (id: string, json: string) => void
  onDelete?: (id: string) => void
}

// ── Constants ───────────────────────────────────────────────
const DEFAULT_STROKE = '#1e1e1e'
const DEFAULT_FILL = 'transparent'

const ERASER_SIZES = [
  { label: 'S', width: 10 },
  { label: 'M', width: 24 },
  { label: 'L', width: 44 },
]

// Visible preview colour shown while drawing an eraser stroke.
// Swapped to destination-out on commit.
const ERASER_PREVIEW = '#f5a0a0'

export function FullCanvasWidget({
  id,
  initialData,
  onDataChange,
  onDelete,
}: FullCanvasWidgetProps) {
  // ── Local state ─────────────────────────────────────────
  const [tool, setTool] = useState<ToolMode>('draw')
  const [color, setColor] = useState(DEFAULT_STROKE)
  const [brushWidth, setBrushWidth] = useState(3)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layers, setLayers] = useState<LayerItem[]>([])
  const [showLayers, setShowLayers] = useState(false)
  const [activeEraserIdx, setActiveEraserIdx] = useState(1) // default Medium

  const hasRestored = useRef(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const isErasingRef = useRef(false)
  const eraserCursorRef = useRef<HTMLDivElement | null>(null)
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)

  // ── Fabric hook ─────────────────────────────────────────
  const {
    canvasElRef,
    containerRef,
    getCanvas,
    toJSON,
    loadFromJSON,
    syncSize,
    isReady,
  } = useFabricCanvas({
    freeDrawing: true,
    brushColor: DEFAULT_STROKE,
    brushWidth: 3,
  })

  // ── Helpers ─────────────────────────────────────────────
  const persistCanvas = useCallback(() => {
    const json = toJSON()
    if (json && onDataChange) {
      onDataChange(id, JSON.stringify(json))
    }
  }, [toJSON, id, onDataChange])

  const refreshLayers = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const objects = canvas.getObjects()
    setLayers(
      objects.map((obj, i) => ({
        index: i,
        type: obj.type ?? 'object',
        id: (obj as unknown as Record<string, unknown>).id as string ?? `obj-${i}`,
      })),
    )
  }, [getCanvas])

  // ── Debug logging ─────────────────────────────────────────
  useEffect(() => {
    console.log('[FullCanvasWidget] isReady changed:', isReady)
    if (isReady) {
      const canvas = getCanvas()
      console.log('[FullCanvasWidget] canvas:', canvas)
      console.log('[FullCanvasWidget] isDrawingMode:', canvas?.isDrawingMode)
      console.log('[FullCanvasWidget] freeDrawingBrush:', canvas?.freeDrawingBrush)
      console.log('[FullCanvasWidget] freeDrawingBrush color:', canvas?.freeDrawingBrush?.color)
      console.log('[FullCanvasWidget] freeDrawingBrush width:', canvas?.freeDrawingBrush?.width)

      const canvasEls = containerRef.current?.querySelectorAll('canvas')
      console.log('[FullCanvasWidget] canvas elements in container:', canvasEls?.length)
      canvasEls?.forEach((el, i) => {
        const style = window.getComputedStyle(el)
        console.log(`[FullCanvasWidget] canvas[${i}]:`, {
          width: el.width, height: el.height,
          cssWidth: style.width, cssHeight: style.height,
          display: style.display, visibility: style.visibility,
          pointerEvents: style.pointerEvents,
          position: style.position,
          zIndex: style.zIndex,
        })
      })
    }
  }, [isReady, getCanvas, containerRef])

  // ── Restore data once canvas is ready ───────────────────
  useEffect(() => {
    if (!isReady || hasRestored.current) return
    if (initialData) {
      loadFromJSON(initialData).then(refreshLayers)
    }
    hasRestored.current = true
  }, [isReady, initialData, loadFromJSON, refreshLayers])

  // ── Listen to canvas modifications for persistence ──────
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return

    const onModified = () => {
      persistCanvas()
      refreshLayers()
    }

    const handleMouseDown = (e: any) => console.log('[FullCanvasWidget] mouse:down', e.pointer)
    const handleMouseUp = (e: any) => console.log('[FullCanvasWidget] mouse:up', e.pointer)
    const onAdded = () => { console.log('[FullCanvasWidget] object:added'); onModified() }
    const onPathCreated = (opt: any) => {
      console.log('[FullCanvasWidget] path:created')
      // If erasing, swap the preview path to a destination-out eraser path
      const path = opt.path
      if (isErasingRef.current && path) {
        path.set({
          stroke: '#000000',
          globalCompositeOperation: 'destination-out',
        })
        canvas.renderAll()
      }
      onModified()
    }

    canvas.on('object:added', onAdded)
    canvas.on('object:removed', onModified)
    canvas.on('object:modified', onModified)
    canvas.on('path:created', onPathCreated)
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:up', handleMouseUp)

    return () => {
      canvas.off('object:added', onAdded)
      canvas.off('object:removed', onModified)
      canvas.off('object:modified', onModified)
      canvas.off('path:created', onPathCreated)
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [isReady, getCanvas, persistCanvas, refreshLayers])

  // ── Tool switching ──────────────────────────────────────
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return

    if (tool === 'draw') {
      canvas.isDrawingMode = true
      canvas.selection = false
      isErasingRef.current = false
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color
        canvas.freeDrawingBrush.width = brushWidth
      }
    } else if (tool === 'eraser') {
      canvas.isDrawingMode = true
      canvas.selection = false
      isErasingRef.current = true
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = ERASER_PREVIEW
        canvas.freeDrawingBrush.width = ERASER_SIZES[activeEraserIdx].width
      }
    } else {
      canvas.isDrawingMode = false
      canvas.selection = tool === 'select'
      isErasingRef.current = false
    }
  }, [tool, color, brushWidth, activeEraserIdx, isReady, getCanvas])

  // ── Colour / brush updates while drawing ────────────────
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas || (tool !== 'draw' && tool !== 'eraser')) return
    if (canvas.freeDrawingBrush) {
      if (tool === 'eraser') {
        canvas.freeDrawingBrush.color = ERASER_PREVIEW
        canvas.freeDrawingBrush.width = ERASER_SIZES[activeEraserIdx].width
      } else {
        canvas.freeDrawingBrush.color = color
        canvas.freeDrawingBrush.width = brushWidth
      }
    }
  }, [color, brushWidth, tool, activeEraserIdx, getCanvas])

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

  // ── Eraser cursor tracking (direct DOM — no re-renders) ──
  useEffect(() => {
    const el = canvasAreaRef.current
    const cursor = eraserCursorRef.current
    if (!el || !cursor) return

    if (tool !== 'eraser') {
      cursor.style.display = 'none'
      el.style.cursor = ''
      return
    }

    el.style.cursor = 'none'
    cursor.style.display = 'none'

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      cursor.style.display = 'block'
      cursor.style.left = `${e.clientX - rect.left}px`
      cursor.style.top = `${e.clientY - rect.top}px`
    }
    const handleLeave = () => { cursor.style.display = 'none' }
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
  }, [tool])

  // ── Shape creation via pointer events on overlay ────────
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (tool !== 'rect' && tool !== 'circle' && tool !== 'arrow') return

      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      shapeStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    [tool, containerRef],
  )

  const handleCanvasPointerUp = useCallback(
    async (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = shapeStartRef.current
      if (!start) return
      shapeStartRef.current = null

      const canvas = getCanvas()
      const container = containerRef.current
      if (!canvas || !container) return

      const rect = container.getBoundingClientRect()
      const endX = e.clientX - rect.left
      const endY = e.clientY - rect.top

      const left = Math.min(start.x, endX)
      const top = Math.min(start.y, endY)
      const w = Math.abs(endX - start.x)
      const h = Math.abs(endY - start.y)

      // Minimum size guard
      if (w < 5 && h < 5) return

      const fabric = await import('fabric')

      if (tool === 'rect') {
        const shape = new fabric.Rect({
          left,
          top,
          width: w,
          height: h,
          fill: DEFAULT_FILL,
          stroke: color,
          strokeWidth: brushWidth,
        })
        canvas.add(shape)
      } else if (tool === 'circle') {
        const radius = Math.max(w, h) / 2
        const shape = new fabric.Ellipse({
          left,
          top,
          rx: w / 2,
          ry: h / 2,
          fill: DEFAULT_FILL,
          stroke: color,
          strokeWidth: brushWidth,
        })
        canvas.add(shape)
      } else if (tool === 'arrow') {
        // Arrow as a polyline from start to end with a head
        const dx = endX - start.x
        const dy = endY - start.y
        const angle = Math.atan2(dy, dx)
        const headLen = 14

        const points = [
          { x: start.x, y: start.y },
          { x: endX, y: endY },
        ]
        const headPoints = [
          {
            x: endX - headLen * Math.cos(angle - Math.PI / 6),
            y: endY - headLen * Math.sin(angle - Math.PI / 6),
          },
          { x: endX, y: endY },
          {
            x: endX - headLen * Math.cos(angle + Math.PI / 6),
            y: endY - headLen * Math.sin(angle + Math.PI / 6),
          },
        ]

        const line = new fabric.Polyline(points, {
          fill: 'transparent',
          stroke: color,
          strokeWidth: brushWidth,
          selectable: true,
        })
        const head = new fabric.Polyline(headPoints, {
          fill: 'transparent',
          stroke: color,
          strokeWidth: brushWidth,
          selectable: true,
        })

        const group = new fabric.Group([line, head], {
          selectable: true,
        })
        canvas.add(group)
      }

      canvas.setActiveObject(canvas.getObjects().at(-1)!)
      canvas.renderAll()
    },
    [tool, color, brushWidth, getCanvas, containerRef],
  )

  // ── Fullscreen toggle ───────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
    // Give the DOM a tick to resize then sync Fabric dimensions
    requestAnimationFrame(() => syncSize())
  }, [syncSize])

  // Sync size when fullscreen changes
  useEffect(() => {
    // Double-RAF to ensure layout reflow has occurred
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => syncSize())
      return () => cancelAnimationFrame(raf2)
    })
    return () => cancelAnimationFrame(raf1)
  }, [isFullscreen, syncSize])

  // ── Layer operations ────────────────────────────────────
  const bringForward = useCallback(
    (idx: number) => {
      const canvas = getCanvas()
      if (!canvas) return
      const obj = canvas.getObjects()[idx]
      if (obj) {
        canvas.bringObjectForward(obj)
        canvas.renderAll()
        refreshLayers()
      }
    },
    [getCanvas, refreshLayers],
  )

  const sendBackward = useCallback(
    (idx: number) => {
      const canvas = getCanvas()
      if (!canvas) return
      const obj = canvas.getObjects()[idx]
      if (obj) {
        canvas.sendObjectBackwards(obj)
        canvas.renderAll()
        refreshLayers()
      }
    },
    [getCanvas, refreshLayers],
  )

  const deleteObject = useCallback(
    (idx: number) => {
      const canvas = getCanvas()
      if (!canvas) return
      const obj = canvas.getObjects()[idx]
      if (obj) {
        canvas.remove(obj)
        canvas.renderAll()
        refreshLayers()
      }
    },
    [getCanvas, refreshLayers],
  )

  const deleteSelected = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const active = canvas.getActiveObjects()
    if (active.length) {
      active.forEach((o) => canvas.remove(o))
      canvas.discardActiveObject()
      canvas.renderAll()
      refreshLayers()
    }
  }, [getCanvas, refreshLayers])

  // ── Keyboard shortcut: delete / backspace ───────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only act if focus is inside this widget
        if (wrapperRef.current?.contains(document.activeElement) || wrapperRef.current === document.activeElement) {
          deleteSelected()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deleteSelected])

  // ── Render ──────────────────────────────────────────────
  const wrapperClasses = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col'
    : 'flex flex-col h-full w-full'

  return (
    <div
      ref={wrapperRef}
      className={wrapperClasses}
      style={{ backgroundColor: 'var(--bg-primary)' }}
      tabIndex={0}
    >
      {/* ── Top toolbar ──────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 shrink-0 flex-wrap"
        style={{ borderBottom: '1px solid var(--border-divider)' }}
      >
        {/* Mode buttons */}
        {(
          [
            { mode: 'select' as ToolMode, label: 'Select', icon: '⇢' },
            { mode: 'draw' as ToolMode, label: 'Draw', icon: '✎' },
            { mode: 'eraser' as ToolMode, label: 'Eraser', icon: '⌫' },
            { mode: 'rect' as ToolMode, label: 'Rect', icon: '▭' },
            { mode: 'circle' as ToolMode, label: 'Circle', icon: '○' },
            { mode: 'arrow' as ToolMode, label: 'Arrow', icon: '→' },
          ] as const
        ).map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setTool(mode)}
            className="text-[11px] px-2 py-1 rounded transition-colors duration-100"
            style={{
              color:
                tool === mode ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor:
                tool === mode ? 'var(--bg-hover)' : 'transparent',
              border:
                tool === mode
                  ? '1px solid var(--border-default)'
                  : '1px solid transparent',
            }}
            title={label}
          >
            {icon} {label}
          </button>
        ))}

        {/* Eraser sizes — visible only in eraser mode */}
        {tool === 'eraser' && (
          <>
            <div
              className="w-px h-4 mx-1"
              style={{ backgroundColor: 'var(--border-default)' }}
            />
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
          </>
        )}

        {/* Divider */}
        <div
          className="w-px h-4 mx-1"
          style={{ backgroundColor: 'var(--border-default)' }}
        />

        {/* Colour picker */}
        <label className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-5 h-5 border-none rounded cursor-pointer"
            style={{ backgroundColor: 'transparent' }}
          />
        </label>

        {/* Brush width slider */}
        <label className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>W</span>
          <input
            type="range"
            min={1}
            max={20}
            value={brushWidth}
            onChange={(e) => setBrushWidth(Number(e.target.value))}
            className="w-16 h-1 cursor-pointer accent-blue-500"
          />
          <span className="w-4 text-center">{brushWidth}</span>
        </label>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Layer toggle */}
        <button
          onClick={() => {
            setShowLayers((p) => !p)
            refreshLayers()
          }}
          className="text-[11px] px-2 py-1 rounded transition-colors duration-100"
          style={{
            color: showLayers ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: showLayers ? 'var(--bg-hover)' : 'transparent',
          }}
          title="Toggle layers panel"
        >
          Layers
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="text-[11px] px-2 py-1 rounded transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? '⊡' : '⊞'}
        </button>
      </div>

      {/* ── Body: canvas + optional layer panel ──────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative min-h-0" ref={canvasAreaRef}>
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden"
            style={{ touchAction: 'none' }}
            onPointerDown={handleCanvasPointerDown}
            onPointerUp={handleCanvasPointerUp}
          >
            <canvas ref={canvasElRef} />
          </div>

          {/* Eraser cursor outline */}
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

        {/* Layer panel (collapsible) */}
        {showLayers && (
          <div
            className="w-44 shrink-0 overflow-y-auto text-[11px]"
            style={{
              borderLeft: '1px solid var(--border-divider)',
              backgroundColor: 'var(--bg-secondary, var(--bg-primary))',
            }}
          >
            <div
              className="px-2 py-1.5 font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-divider)' }}
            >
              Layers ({layers.length})
            </div>

            {layers.length === 0 && (
              <div className="px-2 py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No objects
              </div>
            )}

            {[...layers].reverse().map((layer) => (
              <div
                key={layer.index}
                className="flex items-center gap-1 px-2 py-1"
                style={{ borderBottom: '1px solid var(--border-divider)' }}
              >
                <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {layer.type}
                </span>

                {/* Bring forward */}
                <button
                  onClick={() => bringForward(layer.index)}
                  className="px-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}
                  title="Bring forward"
                >
                  ↑
                </button>

                {/* Send backward */}
                <button
                  onClick={() => sendBackward(layer.index)}
                  className="px-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}
                  title="Send backward"
                >
                  ↓
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteObject(layer.index)}
                  className="px-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--accent-red, #e03131)' }}
                  title="Delete object"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
