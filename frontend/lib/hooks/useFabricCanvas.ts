'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

/**
 * SSR-safe Fabric.js canvas hook.
 *
 * - Dynamically imports Fabric only on the client (no SSR leakage).
 * - Manages a single fabric.Canvas instance per mount.
 * - Sets up a ResizeObserver to keep the canvas sized to its container.
 * - Disposes Fabric on unmount to prevent memory leaks.
 * - Uses pointer events so stylus / Apple Pencil works automatically.
 */

type FabricCanvas = import('fabric').Canvas

interface UseFabricCanvasOptions {
  /** Enable free-drawing mode on init */
  freeDrawing?: boolean
  /** Initial brush color */
  brushColor?: string
  /** Initial brush width */
  brushWidth?: number
  /** Called once the canvas is ready */
  onReady?: (canvas: FabricCanvas) => void
}

export function useFabricCanvas(options: UseFabricCanvasOptions = {}) {
  const {
    freeDrawing = false,
    brushColor = '#000000',
    brushWidth = 2,
    onReady,
  } = options

  const canvasElRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Resize the canvas to fill its container
  const syncSize = useCallback(() => {
    const canvas = fabricRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    canvas.setDimensions({ width, height })
    canvas.renderAll()
  }, [])

  // ------------------------------------------------------------------
  // Init & teardown
  // ------------------------------------------------------------------
  useEffect(() => {
    // Guard: only run on client
    if (typeof window === 'undefined') return
    if (!canvasElRef.current || !containerRef.current) return

    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    async function init() {
      console.log('[useFabricCanvas] init() called')
      console.log('[useFabricCanvas] canvasElRef.current:', canvasElRef.current)
      console.log('[useFabricCanvas] containerRef.current:', containerRef.current)

      // Dynamic import keeps Fabric out of the SSR bundle
      const fabric = await import('fabric')
      console.log('[useFabricCanvas] fabric imported, version:', (fabric as any).version)

      if (disposed || !canvasElRef.current || !containerRef.current) {
        console.warn('[useFabricCanvas] Aborted: disposed=', disposed, 'canvasEl=', !!canvasElRef.current, 'container=', !!containerRef.current)
        return
      }

      const { width, height } = containerRef.current.getBoundingClientRect()
      console.log('[useFabricCanvas] container size:', { width, height })

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: width || 300,
        height: height || 200,
        isDrawingMode: freeDrawing,
        selection: !freeDrawing,
      })
      console.log('[useFabricCanvas] Canvas created, isDrawingMode:', canvas.isDrawingMode)

      // Fabric wraps the raw <canvas> in its own div. Style that wrapper
      // so it fills our container and doesn't break layout.
      const selectionEl = canvas.getSelectionElement?.()
      console.log('[useFabricCanvas] selectionElement:', selectionEl)
      const wrapperEl = selectionEl?.parentElement
      console.log('[useFabricCanvas] wrapperEl:', wrapperEl)
      if (wrapperEl) {
        wrapperEl.style.position = 'absolute'
        wrapperEl.style.inset = '0'
        wrapperEl.style.width = '100%'
        wrapperEl.style.height = '100%'
        console.log('[useFabricCanvas] Wrapper styled successfully')
      } else {
        console.warn('[useFabricCanvas] No wrapper element found!')
      }

      // Configure brush
      console.log('[useFabricCanvas] freeDrawingBrush:', canvas.freeDrawingBrush)
      console.log('[useFabricCanvas] freeDrawingBrush type:', canvas.freeDrawingBrush?.constructor?.name)
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushWidth
        console.log('[useFabricCanvas] Brush configured:', { color: brushColor, width: brushWidth })
      } else {
        console.warn('[useFabricCanvas] No freeDrawingBrush found! Attempting manual creation...')
        try {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
          canvas.freeDrawingBrush.color = brushColor
          canvas.freeDrawingBrush.width = brushWidth
          console.log('[useFabricCanvas] PencilBrush created manually:', canvas.freeDrawingBrush)
        } catch (e) {
          console.error('[useFabricCanvas] Failed to create PencilBrush:', e)
        }
      }

      // Log all canvas DOM elements
      console.log('[useFabricCanvas] lowerCanvasEl:', canvas.lowerCanvasEl)
      console.log('[useFabricCanvas] upperCanvasEl:', (canvas as any).upperCanvasEl)
      console.log('[useFabricCanvas] wrapperEl (fabric):', (canvas as any).wrapperEl)

      fabricRef.current = canvas
      setIsReady(true)
      console.log('[useFabricCanvas] ✅ Canvas ready, isReady=true')
      onReady?.(canvas)

      // Observe container resizes
      resizeObserver = new ResizeObserver(() => {
        if (!disposed) {
          const c = fabricRef.current
          const cont = containerRef.current
          if (!c || !cont) return
          const { width: w, height: h } = cont.getBoundingClientRect()
          if (w > 0 && h > 0) {
            c.setDimensions({ width: w, height: h })
            c.renderAll()
          }
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    init()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
      setIsReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run only on mount

  // ------------------------------------------------------------------
  // Imperative helpers consumers can call
  // ------------------------------------------------------------------
  const getCanvas = useCallback(() => fabricRef.current, [])

  const toJSON = useCallback(() => {
    return fabricRef.current?.toJSON() ?? null
  }, [])

  const loadFromJSON = useCallback(async (json: string | object) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const data = typeof json === 'string' ? JSON.parse(json) : json
    await canvas.loadFromJSON(data)
    canvas.renderAll()
  }, [])

  return {
    /** Ref to the <canvas> element — attach to your JSX */
    canvasElRef,
    /** Ref to the wrapping container div — attach to your JSX */
    containerRef,
    /** Direct access to the fabric.Canvas instance */
    fabricRef,
    /** True once Fabric has initialised */
    isReady,
    /** Returns the canvas (or null) */
    getCanvas,
    /** Serialise current canvas state to JSON */
    toJSON,
    /** Load a previously serialised JSON state */
    loadFromJSON,
    /** Manually trigger a resize sync */
    syncSize,
  }
}
