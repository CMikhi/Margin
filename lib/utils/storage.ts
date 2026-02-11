import type { WeeklyBoard, CustomPage } from '@/lib/types'

const STORAGE_KEY = 'margin-weekly-board'
const CUSTOM_PAGES_KEY = 'margin-custom-pages'

/**
 * Load the weekly board from localStorage
 */
export function loadBoard(): WeeklyBoard | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to load board from storage:', error)
    return null
  }
}

/**
 * Save the weekly board to localStorage
 */
export function saveBoard(board: WeeklyBoard): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
  } catch (error) {
    console.error('Failed to save board to storage:', error)
  }
}

/**
 * Clear the board from localStorage (optional utility)
 */
export function clearBoard(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Load custom pages from localStorage
 */
export function loadCustomPages(): CustomPage[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CUSTOM_PAGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load custom pages from storage:', error)
    return []
  }
}

/**
 * Save custom pages to localStorage
 */
export function saveCustomPages(pages: CustomPage[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CUSTOM_PAGES_KEY, JSON.stringify(pages))
  } catch (error) {
    console.error('Failed to save custom pages to storage:', error)
  }
}

/**
 * Add a new custom page
 */
export function addCustomPage(page: CustomPage): void {
  const pages = loadCustomPages()
  pages.push(page)
  saveCustomPages(pages)
}

/**
 * Delete a custom page
 */
export function deleteCustomPage(pageId: string): void {
  const pages = loadCustomPages()
  const filtered = pages.filter(p => p.id !== pageId)
  saveCustomPages(filtered)
  
  // Also clean up page-specific data
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`margin-grid-layout-${pageId}`)
    localStorage.removeItem(`margin-text-widgets-${pageId}`)
    localStorage.removeItem(`margin-hidden-widgets-${pageId}`)
    localStorage.removeItem(`margin-static-content-${pageId}`)
  }
}

/**
 * Update a custom page
 */
export function updateCustomPage(pageId: string, updates: Partial<CustomPage>): void {
  const pages = loadCustomPages()
  const index = pages.findIndex(p => p.id === pageId)
  if (index !== -1) {
    pages[index] = { ...pages[index], ...updates }
    saveCustomPages(pages)
  }
}
