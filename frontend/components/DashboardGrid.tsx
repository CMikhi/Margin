'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { GRID_COLS, GRID_ROWS, type WidgetPosition } from '@/lib/hooks/useGridLayout'

interface WidgetConfig {
  id: string
  content: ReactNode
  minColSpan?: number
  minRowSpan?: number
}

interface DashboardGridProps {
  widgets: WidgetConfig[]
  layout: Record<string, WidgetPosition>
  moveWidget: (widgetId: string, col: number, row: number) => void
  resizeWidget: (widgetId: string, colSpan: number, rowSpan: number) => void
  deleteWidget: (widgetId: string) => void
  bringToFront: (widgetId: string) => void
  sendToBack: (widgetId: string) => void
  resetLayout: () => void
  isLoaded: boolean
}

type InteractionMode = 'drag' | 'resize' | null

export function DashboardGrid({ widgets, layout, moveWidget, resizeWidget, deleteWidget, bringToFront, sendToBack, resetLayout, isLoaded }: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  // Shared interaction state
  const [activeWidget, setActiveWidget] = useState<string | null>(null)
  const [mode, setMode] = useState<InteractionMode>(null)

  // Drag state
  const [dragPreview, setDragPreview] = useState<{ col: number; row: number } | null>(null)
  const dragOffset = useRef<{ col: number; row: number }>({ col: 0, row: 0 })

  // Resize state
  const [resizePreview, setResizePreview] = useState<{ colSpan: number; rowSpan: number } | null>(null)

  const getCellFromPointer = useCallback(
    (clientX: number, clientY: number): { col: number; row: number } | null => {
      if (!gridRef.current) return null
      const rect = gridRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const cellW = rect.width / GRID_COLS
      const cellH = rect.height / GRID_ROWS
      const col = Math.floor(x / cellW)
      const row = Math.floor(y / cellH)
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null
      return { col, row }
    },
    []
  )

  // ── Drag handlers ──────────────────────────────
  const handleDragPointerDown = useCallback(
    (widgetId: string, e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      const cell = getCellFromPointer(e.clientX, e.clientY)
      if (!cell) return

      const widgetPos = layout[widgetId]
      if (!widgetPos) return

      dragOffset.current = {
        col: cell.col - widgetPos.col,
        row: cell.row - widgetPos.row,
      }
      setActiveWidget(widgetId)
      setMode('drag')
      setDragPreview({ col: widgetPos.col, row: widgetPos.row })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [layout, getCellFromPointer]
  )

  // ── Resize handlers ────────────────────────────
  const handleResizePointerDown = useCallback(
    (widgetId: string, e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const widgetPos = layout[widgetId]
      if (!widgetPos) return

      setActiveWidget(widgetId)
      setMode('resize')
      setResizePreview({ colSpan: widgetPos.colSpan, rowSpan: widgetPos.rowSpan })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [layout]
  )

  // ── Shared pointer move ────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeWidget) return
      const cell = getCellFromPointer(e.clientX, e.clientY)
      if (!cell) return

      const widgetPos = layout[activeWidget]
      if (!widgetPos) return

      if (mode === 'drag') {
        const newCol = Math.max(0, Math.min(cell.col - dragOffset.current.col, GRID_COLS - widgetPos.colSpan))
        const newRow = Math.max(0, Math.min(cell.row - dragOffset.current.row, GRID_ROWS - widgetPos.rowSpan))
        setDragPreview({ col: newCol, row: newRow })
      }

      if (mode === 'resize') {
        // New span = distance from widget origin to hovered cell + 1
        const minCol = widgets.find(w => w.id === activeWidget)?.minColSpan ?? 1
        const minRow = widgets.find(w => w.id === activeWidget)?.minRowSpan ?? 1
        const newColSpan = Math.max(minCol, Math.min(cell.col - widgetPos.col + 1, GRID_COLS - widgetPos.col))
        const newRowSpan = Math.max(minRow, Math.min(cell.row - widgetPos.row + 1, GRID_ROWS - widgetPos.row))
        setResizePreview({ colSpan: newColSpan, rowSpan: newRowSpan })
      }
    },
    [activeWidget, mode, layout, getCellFromPointer, widgets]
  )

  // ── Shared pointer up ──────────────────────────
  const handlePointerUp = useCallback(() => {
    if (!activeWidget) return

    if (mode === 'drag' && dragPreview) {
      moveWidget(activeWidget, dragPreview.col, dragPreview.row)
    }
    if (mode === 'resize' && resizePreview) {
      resizeWidget(activeWidget, resizePreview.colSpan, resizePreview.rowSpan)
    }

    setActiveWidget(null)
    setMode(null)
    setDragPreview(null)
    setResizePreview(null)
  }, [activeWidget, mode, dragPreview, resizePreview, moveWidget, resizeWidget])

  if (!isLoaded) {
    return <div className="h-screen" style={{ backgroundColor: 'var(--bg-primary)' }} />
  }

  const isInteracting = activeWidget !== null

  return (
    <div className="relative h-screen overflow-hidden select-none" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Reset layout button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={resetLayout}
        className="absolute top-3 right-3 z-20 px-2 py-1 rounded-md text-[11px] font-medium transition-colors duration-150"
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--border-default)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        Reset Layout
      </motion.button>

      {/* Grid container */}
      <div
        ref={gridRef}
        className="relative h-full p-4"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          gap: '4px',
        }}
      >
        {/* Background grid lines — visible when interacting */}
        {isInteracting && (
          <>
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
              const col = i % GRID_COLS
              const row = Math.floor(i / GRID_COLS)
              return (
                <div
                  key={`bg-${i}`}
                  className="pointer-events-none rounded"
                  style={{
                    gridColumn: `${col + 1} / ${col + 2}`,
                    gridRow: `${row + 1} / ${row + 2}`,
                    backgroundColor: 'var(--bg-hover)',
                    opacity: 0.5,
                    border: '1px dashed var(--border-default)',
                  }}
                />
              )
            })}
          </>
        )}

        {/* Drag preview */}
        {mode === 'drag' && activeWidget && dragPreview && layout[activeWidget] && (
          <div
            className="pointer-events-none rounded-lg z-10"
            style={{
              gridColumn: `${dragPreview.col + 1} / ${dragPreview.col + 1 + layout[activeWidget].colSpan}`,
              gridRow: `${dragPreview.row + 1} / ${dragPreview.row + 1 + layout[activeWidget].rowSpan}`,
              backgroundColor: 'var(--accent-blue-light)',
              border: '2px dashed var(--accent-blue)',
              opacity: 0.6,
            }}
          />
        )}

        {/* Resize preview */}
        {mode === 'resize' && activeWidget && resizePreview && layout[activeWidget] && (
          <div
            className="pointer-events-none rounded-lg z-10"
            style={{
              gridColumn: `${layout[activeWidget].col + 1} / ${layout[activeWidget].col + 1 + resizePreview.colSpan}`,
              gridRow: `${layout[activeWidget].row + 1} / ${layout[activeWidget].row + 1 + resizePreview.rowSpan}`,
              backgroundColor: 'var(--accent-blue-light)',
              border: '2px dashed var(--accent-blue)',
              opacity: 0.6,
            }}
          />
        )}

        {/* Widgets */}
        {widgets.map((widget) => {
          const pos = layout[widget.id]
          if (!pos) return null

          const isActive = activeWidget === widget.id

          return (
            <motion.div
              key={widget.id}
              layout
              transition={{
                layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
              }}
              className="relative rounded-lg overflow-hidden group/widget"
              style={{
                gridColumn: `${pos.col + 1} / ${pos.col + 1 + pos.colSpan}`,
                gridRow: `${pos.row + 1} / ${pos.row + 1 + pos.rowSpan}`,
                opacity: isActive ? 0.5 : 1,
                zIndex: pos.zIndex,
              }}
              onClick={() => {
                // Bring to front when clicked
                if (!isActive) {
                  bringToFront(widget.id)
                }
              }}
            >
              <div className="relative h-full">
                {/* Drag handle — 6-dot icon at top center */}
                <button
                  onPointerDown={(e) => handleDragPointerDown(widget.id, e)}
                  className="absolute top-1 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    cursor: isActive && mode === 'drag' ? 'grabbing' : 'grab',
                  }}
                  title="Drag to move"
                >
                  <svg className="w-3 h-3" viewBox="0 0 10 10" fill="var(--text-muted)">
                    <circle cx="2" cy="3" r="0.8" />
                    <circle cx="5" cy="3" r="0.8" />
                    <circle cx="8" cy="3" r="0.8" />
                    <circle cx="2" cy="6" r="0.8" />
                    <circle cx="5" cy="6" r="0.8" />
                    <circle cx="8" cy="6" r="0.8" />
                  </svg>
                </button>

                {/* Delete button — top right, shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteWidget(widget.id)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 z-20 p-1 rounded-md opacity-0 group-hover/widget:opacity-100 transition-opacity duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent-red)'
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title="Delete widget"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Layer control buttons — top right, below delete button */}
                <div className="absolute top-8 right-1 z-20 flex flex-col gap-0.5 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      bringToFront(widget.id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 rounded-md"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Move layer up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      sendToBack(widget.id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="p-1 rounded-md"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Move layer down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </button>
                </div>

                {/* Widget content */}
                <div className="h-full p-4 overflow-auto">
                  {widget.content}
                </div>
              </div>

              {/* Resize handle — bottom-right corner */}
              <div
                onPointerDown={(e) => handleResizePointerDown(widget.id, e)}
                className="absolute bottom-0 right-0 w-5 h-5 z-30 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-150"
                style={{ cursor: 'nwse-resize' }}
              >
                {/* Resize icon — 3 diagonal lines */}
                <svg
                  className="absolute bottom-0.5 right-0.5 w-3 h-3"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                >
                  <line x1="9" y1="1" x2="1" y2="9" />
                  <line x1="9" y1="4" x2="4" y2="9" />
                  <line x1="9" y1="7" x2="7" y2="9" />
                </svg>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
