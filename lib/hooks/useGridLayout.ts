import { useState, useEffect, useCallback } from 'react'

export interface WidgetPosition {
  col: number   // 0-based column index
  row: number   // 0-based row index
  colSpan: number
  rowSpan: number
}

export interface WidgetLayout {
  [widgetId: string]: WidgetPosition
}

export interface TextWidget {
  id: string
  text: string
}

export interface TextWidgetsMap {
  [widgetId: string]: string // widgetId -> text content
}

export interface ImageWidgetsMap {
  [widgetId: string]: string // widgetId -> image src (base64)
}

export const GRID_COLS = 8
export const GRID_ROWS = 8

// ─── Page-specific defaults ────────────────────────────────
const HOME_DEFAULT_WELCOME_HTML = `<h1>Margin</h1><h2>Welcome to Margin!</h2><p>This is a all-in-one platform that allows users to keep notes and ideas in a centerlized platform that is both functional and customizable.</p><hr><h2>Defining Features</h2><p>Besides just adding text, there's much more you can do to customize your individualized pages. Some of this being:</p><ul><li><p>Movable components</p></li><li><p>Resizable components</p></li></ul><p>The customizability will only grow, with the current options built basde on demand. Every aspect on the page is referred to as a "widget". If you drag the 6-dots at the top of the currently selected widget, it will allow you to drag the widget around. While you're dragging the widget, the website's snap-grid will appear, showing you the options for placement. If you want to expand the size of the widget, you can hold down the bottom-right corner and drag the widget to the dimensions you are happy with.</p><hr><h2>Adding Widgets</h2><p>As the user, you can add widgets by click "CMD+k" for Mac and "CTR+k" for Windows to open the tool and navigation menu. This menu allows you to quickly jump between different pages by searching it up, or to add new widget of your choice.</p><p>The current widgets that Margin has included:</p><ul><li><p>Text boxes</p></li><li><p>Images</p></li><li><p>Calendar</p></li><li><p>Daily events (Add-on to the calendar)</p></li></ul><p>The types of widgets are still expanding and any feedback is greatly appreciated!</p>`

function getDefaultLayout(pageId?: string): WidgetLayout {
  if (pageId === 'calendar-page') {
    return {
      calendar: { col: 0, row: 0, colSpan: 8, rowSpan: 8 },
    }
  }
  if (pageId) {
    return {
      welcome: { col: 1, row: 1, colSpan: 6, rowSpan: 4 },
    }
  }
  // Home page
  return {
    'image-default-cat': { col: 0, row: 0, colSpan: 1, rowSpan: 2 },
    quickLinks: { col: 0, row: 2, colSpan: 1, rowSpan: 2 },
    'text-default-welcome': { col: 1, row: 0, colSpan: 6, rowSpan: 8 },
    'image-default-bookmark': { col: 7, row: 0, colSpan: 1, rowSpan: 8 },
  }
}

function getDefaultTextWidgets(pageId?: string): TextWidgetsMap {
  if (pageId) return {}
  return {
    'text-default-welcome': HOME_DEFAULT_WELCOME_HTML,
  }
}

function getDefaultImageWidgets(pageId?: string): ImageWidgetsMap {
  if (pageId) return {}
  return {
    'image-default-cat': '/default-cat.jpg',
    'image-default-bookmark': '/default-bears.jpg',
  }
}

function getDefaultHiddenWidgets(pageId?: string): string[] {
  if (pageId === 'calendar-page') {
    return ['dailyEvents']
  }
  if (pageId) {
    return ['calendar', 'dailyEvents']
  }
  // Home page: hide greeting, shortcutHint, calendar, dailyEvents
  return ['greeting', 'shortcutHint', 'calendar', 'dailyEvents']
}

function getStorageKey(baseKey: string, pageId?: string): string {
  return pageId ? `${baseKey}-${pageId}` : baseKey
}

function loadLayout(pageId?: string): WidgetLayout | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getStorageKey('margin-grid-layout', pageId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveLayout(layout: WidgetLayout, pageId?: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey('margin-grid-layout', pageId), JSON.stringify(layout))
  } catch {
    // ignore
  }
}

function loadTextWidgets(pageId?: string): TextWidgetsMap | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getStorageKey('margin-text-widgets', pageId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveTextWidgets(textWidgets: TextWidgetsMap, pageId?: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey('margin-text-widgets', pageId), JSON.stringify(textWidgets))
  } catch {
    // ignore
  }
}

function loadImageWidgets(pageId?: string): ImageWidgetsMap | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getStorageKey('margin-image-widgets', pageId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveImageWidgets(imageWidgets: ImageWidgetsMap, pageId?: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey('margin-image-widgets', pageId), JSON.stringify(imageWidgets))
  } catch {
    // ignore
  }
}

function loadStaticContent(pageId?: string): TextWidgetsMap | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getStorageKey('margin-static-content', pageId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveStaticContent(content: TextWidgetsMap, pageId?: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey('margin-static-content', pageId), JSON.stringify(content))
  } catch {
    // ignore
  }
}

/**
 * Check if a position would overlap with any other widget (excluding the one being moved)
 */
function hasOverlap(
  layout: WidgetLayout,
  widgetId: string,
  pos: WidgetPosition
): boolean {
  for (const [id, other] of Object.entries(layout)) {
    if (id === widgetId) continue

    const aLeft = pos.col
    const aRight = pos.col + pos.colSpan
    const aTop = pos.row
    const aBottom = pos.row + pos.rowSpan

    const bLeft = other.col
    const bRight = other.col + other.colSpan
    const bTop = other.row
    const bBottom = other.row + other.rowSpan

    if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
      return true
    }
  }
  return false
}

/**
 * Clamp a widget position to stay within the grid bounds
 */
function clampPosition(pos: WidgetPosition): WidgetPosition {
  return {
    ...pos,
    col: Math.max(0, Math.min(pos.col, GRID_COLS - pos.colSpan)),
    row: Math.max(0, Math.min(pos.row, GRID_ROWS - pos.rowSpan)),
  }
}

/**
 * Find an empty spot in the grid for a new widget
 */
function findEmptySpot(layout: WidgetLayout, colSpan: number, rowSpan: number): { col: number; row: number } | null {
  for (let row = 0; row <= GRID_ROWS - rowSpan; row++) {
    for (let col = 0; col <= GRID_COLS - colSpan; col++) {
      const testPos: WidgetPosition = { col, row, colSpan, rowSpan }
      if (!hasOverlap(layout, '__test__', testPos)) {
        return { col, row }
      }
    }
  }
  return null
}

export function useGridLayout(pageId?: string) {
  const [layout, setLayout] = useState<WidgetLayout>(() => getDefaultLayout(pageId))
  const [textWidgets, setTextWidgets] = useState<TextWidgetsMap>(() => getDefaultTextWidgets(pageId))
  const [imageWidgets, setImageWidgets] = useState<ImageWidgetsMap>(() => getDefaultImageWidgets(pageId))
  const [staticContent, setStaticContent] = useState<TextWidgetsMap>({})
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(() => new Set(getDefaultHiddenWidgets(pageId)))
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const defaults = getDefaultLayout(pageId)
    const storedLayout = loadLayout(pageId)
    const storedText = loadTextWidgets(pageId)
    const storedImages = loadImageWidgets(pageId)
    const storedStatic = loadStaticContent(pageId)

    if (storedLayout) {
      setLayout(storedLayout)
    } else {
      setLayout(defaults)
    }
    if (storedText) {
      setTextWidgets(storedText)
    } else {
      setTextWidgets(getDefaultTextWidgets(pageId))
    }
    if (storedImages) {
      setImageWidgets(storedImages)
    } else {
      setImageWidgets(getDefaultImageWidgets(pageId))
    }
    if (storedStatic) {
      setStaticContent(storedStatic)
    }
    
    // Load hidden widgets or use defaults
    const hiddenData = localStorage.getItem(getStorageKey('margin-hidden-widgets', pageId))
    if (hiddenData) {
      try {
        setHiddenWidgets(new Set(JSON.parse(hiddenData)))
      } catch (e) {
        console.error('Failed to load hidden widgets', e)
        setHiddenWidgets(new Set(getDefaultHiddenWidgets(pageId)))
      }
    } else {
      setHiddenWidgets(new Set(getDefaultHiddenWidgets(pageId)))
    }
    
    setIsLoaded(true)
  }, [pageId])

  // Persist on change
  useEffect(() => {
    if (isLoaded) {
      saveLayout(layout, pageId)
      saveTextWidgets(textWidgets, pageId)
      saveImageWidgets(imageWidgets, pageId)
      saveStaticContent(staticContent, pageId)
    }
  }, [layout, textWidgets, imageWidgets, staticContent, isLoaded, pageId])

  const moveWidget = useCallback(
    (widgetId: string, newCol: number, newRow: number) => {
      setLayout((prev) => {
        const widget = prev[widgetId]
        if (!widget) return prev

        const newPos = clampPosition({
          ...widget,
          col: newCol,
          row: newRow,
        })

        // Allow move even if it overlaps with other widgets
        return { ...prev, [widgetId]: newPos }
      })
    },
    []
  )

  const resizeWidget = useCallback(
    (widgetId: string, newColSpan: number, newRowSpan: number) => {
      setLayout((prev) => {
        const widget = prev[widgetId]
        if (!widget) return prev

        // Enforce minimum 1×1
        const colSpan = Math.max(1, Math.min(newColSpan, GRID_COLS - widget.col))
        const rowSpan = Math.max(1, Math.min(newRowSpan, GRID_ROWS - widget.row))

        const newPos: WidgetPosition = { ...widget, colSpan, rowSpan }

        // Allow resize even if it overlaps with other widgets
        return { ...prev, [widgetId]: newPos }
      })
    },
    []
  )

  const addTextWidget = useCallback(() => {
    const widgetId = `text-${Date.now()}`
    const spot = findEmptySpot(layout, 3, 2)

    if (!spot) {
      // Grid is full, place at 0,0 anyway (will overlap)
      setLayout((prev) => ({ ...prev, [widgetId]: { col: 0, row: 0, colSpan: 3, rowSpan: 2 } }))
    } else {
      setLayout((prev) => ({ ...prev, [widgetId]: { ...spot, colSpan: 3, rowSpan: 2 } }))
    }

    setTextWidgets((prev) => ({ ...prev, [widgetId]: 'Click to edit...' }))
    return widgetId
  }, [layout])

  const addCalendarWidget = useCallback(() => {
    const widgetId = 'calendar'
    // Remove from hidden widgets if it was hidden
    setHiddenWidgets((prev) => {
      const newHidden = new Set(prev)
      newHidden.delete(widgetId)
      localStorage.setItem(getStorageKey('margin-hidden-widgets', pageId), JSON.stringify([...newHidden]))
      return newHidden
    })
    
    // If not in layout, add it
    if (!layout[widgetId]) {
      const spot = findEmptySpot(layout, 6, 6)
      if (!spot) {
        setLayout((prev) => ({ ...prev, [widgetId]: { col: 0, row: 0, colSpan: 6, rowSpan: 6 } }))
      } else {
        setLayout((prev) => ({ ...prev, [widgetId]: { ...spot, colSpan: 6, rowSpan: 6 } }))
      }
    }
    
    return widgetId
  }, [layout, pageId])

  const addDailyEventsWidget = useCallback(() => {
    const widgetId = 'dailyEvents'
    // Remove from hidden widgets if it was hidden
    setHiddenWidgets((prev) => {
      const newHidden = new Set(prev)
      newHidden.delete(widgetId)
      localStorage.setItem(getStorageKey('margin-hidden-widgets', pageId), JSON.stringify([...newHidden]))
      return newHidden
    })
    
    // If not in layout, add it
    if (!layout[widgetId]) {
      const spot = findEmptySpot(layout, 3, 4)
      if (!spot) {
        setLayout((prev) => ({ ...prev, [widgetId]: { col: 0, row: 0, colSpan: 3, rowSpan: 4 } }))
      } else {
        setLayout((prev) => ({ ...prev, [widgetId]: { ...spot, colSpan: 3, rowSpan: 4 } }))
      }
    }
    
    return widgetId
  }, [layout, pageId])

  const addImageWidget = useCallback(() => {
    const widgetId = `image-${Date.now()}`
    const spot = findEmptySpot(layout, 2, 2)

    if (!spot) {
      // Grid is full, place at 0,0 anyway (will overlap)
      setLayout((prev) => ({ ...prev, [widgetId]: { col: 0, row: 0, colSpan: 2, rowSpan: 2 } }))
    } else {
      setLayout((prev) => ({ ...prev, [widgetId]: { ...spot, colSpan: 2, rowSpan: 2 } }))
    }

    setImageWidgets((prev) => ({ ...prev, [widgetId]: '' }))
    return widgetId
  }, [layout])

  const updateTextWidget = useCallback((widgetId: string, text: string) => {
    setTextWidgets((prev) => ({ ...prev, [widgetId]: text }))
  }, [])

  const updateStaticContent = useCallback((widgetId: string, content: string) => {
    setStaticContent((prev) => ({ ...prev, [widgetId]: content }))
  }, [])

  const updateImageWidget = useCallback((widgetId: string, imageSrc: string) => {
    setImageWidgets((prev) => ({ ...prev, [widgetId]: imageSrc }))
  }, [])

  const deleteWidget = useCallback((widgetId: string) => {
    // If it's a text widget, remove from layout and textWidgets
    if (widgetId.startsWith('text-')) {
      setLayout((prev) => {
        const newLayout = { ...prev }
        delete newLayout[widgetId]
        return newLayout
      })
      setTextWidgets((prev) => {
        const newText = { ...prev }
        delete newText[widgetId]
        return newText
      })
    } else if (widgetId.startsWith('image-')) {
      // If it's an image widget, remove from layout and imageWidgets
      setLayout((prev) => {
        const newLayout = { ...prev }
        delete newLayout[widgetId]
        return newLayout
      })
      setImageWidgets((prev) => {
        const newImages = { ...prev }
        delete newImages[widgetId]
        return newImages
      })
    } else {
      // For static widgets, add to hidden set
      setHiddenWidgets((prev) => {
        const newHidden = new Set(prev)
        newHidden.add(widgetId)
        localStorage.setItem(getStorageKey('margin-hidden-widgets', pageId), JSON.stringify([...newHidden]))
        return newHidden
      })
    }
  }, [pageId])

  const resetLayout = useCallback(() => {
    const defaultHidden = getDefaultHiddenWidgets(pageId)
    setLayout(getDefaultLayout(pageId))
    setTextWidgets(getDefaultTextWidgets(pageId))
    setImageWidgets(getDefaultImageWidgets(pageId))
    setHiddenWidgets(new Set(defaultHidden))
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('margin-hidden-widgets', pageId), JSON.stringify(defaultHidden))
    }
  }, [pageId])

  return { 
    layout, 
    textWidgets, 
    imageWidgets, 
    staticContent, 
    hiddenWidgets, 
    moveWidget, 
    resizeWidget, 
    addTextWidget, 
    addImageWidget, 
    addCalendarWidget,
    addDailyEventsWidget,
    updateTextWidget, 
    updateImageWidget, 
    updateStaticContent, 
    deleteWidget, 
    resetLayout, 
    isLoaded 
  }
}
