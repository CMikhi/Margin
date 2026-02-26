'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { loadCustomPages } from '@/lib/utils/storage'
import type { CustomPage } from '@/lib/types'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

const menuVariants = {
  hidden: { opacity: 0, scale: 0.98, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: { duration: 0.1 },
  },
}

interface CommandMenuProps {
  pageTitle?: string
  onAddTextWidget?: () => void
  onAddImage?: () => void
  onAddCalendar?: () => void
  onAddDailyEvents?: () => void
}

export function CommandMenu({ 
  pageTitle,
  onAddTextWidget,
  onAddImage,
  onAddCalendar,
  onAddDailyEvents
}: CommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [customPages, setCustomPages] = useState<CustomPage[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load custom pages when menu opens
  useEffect(() => {
    if (isOpen) {
      setCustomPages(loadCustomPages())
    }
  }, [isOpen])

  const commands: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      description: 'Navigate to the home page',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      action: () => router.push('/'),
      keywords: ['home', 'dashboard', 'main'],
    },
    {
      id: 'calendar',
      label: 'Go to Calendar',
      description: 'View your monthly calendar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      action: () => router.push('/calander'),
      keywords: ['calendar', 'date', 'month', 'schedule'],
    },
    // Add custom pages dynamically
    ...customPages.map((page) => ({
      id: `page-${page.id}`,
      label: `Go to ${page.name}`,
      description: page.name,
      icon: <span className="text-sm">{page.icon}</span>,
      action: () => router.push(`/page/${page.id}`),
      keywords: [page.name.toLowerCase(), 'page', 'custom'],
    })),
    ...(onAddTextWidget
      ? [
          {
            id: 'add-text',
            label: 'Add Text Widget',
            description: 'Create a new text widget on the dashboard',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            ),
            action: () => onAddTextWidget(),
            keywords: ['add', 'text', 'widget', 'note', 'write', 'create'],
          },
        ]
      : []),
    ...(onAddImage
      ? [
          {
            id: 'add-image',
            label: 'Add Image Widget',
            description: 'Upload and display an image',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            ),
            action: () => onAddImage(),
            keywords: ['add', 'image', 'photo', 'picture', 'widget', 'upload', 'create'],
          },
        ]
      : []),
    ...(onAddCalendar
      ? [
          {
            id: 'add-calendar',
            label: 'Add Calendar Widget',
            description: 'Add a full calendar to the page',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            ),
            action: () => onAddCalendar(),
            keywords: ['add', 'calendar', 'widget', 'month', 'schedule', 'create'],
          },
        ]
      : []),
    ...(onAddDailyEvents
      ? [
          {
            id: 'add-daily-events',
            label: 'Add Daily Events Widget',
            description: 'Add a widget showing today\'s events',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            action: () => onAddDailyEvents(),
            keywords: ['add', 'daily', 'events', 'today', 'widget', 'tasks', 'create'],
          },
        ]
      : []),
  ]

  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        )
      })
    : commands

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const runCommand = useCallback(
    (command: CommandItem) => {
      close()
      // Small delay to let the menu close animation play
      setTimeout(() => command.action(), 100)
    },
    [close]
  )

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        if (!isOpen) {
          setQuery('')
          setSelectedIndex(0)
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        close()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        runCommand(filteredCommands[selectedIndex])
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-100 flex items-start justify-center pt-[20vh]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
          onClick={close}
        >
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-130 rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-overlay)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-divider)' }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search or jump to..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-default)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Command list */}
            <div ref={listRef} className="py-1 max-h-80 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No results found
                </div>
              ) : (
                filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => runCommand(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75"
                    style={{
                      backgroundColor:
                        index === selectedIndex ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {command.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{command.label}</span>
                      {command.description && (
                        <span
                          className="text-xs block truncate"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {command.description}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-4 py-2 text-[10px]"
              style={{
                borderTop: '1px solid var(--border-divider)',
                color: 'var(--text-muted)',
              }}
            >
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
                >
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
                >
                  ↵
                </kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-0.5 rounded font-mono"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
                >
                  Esc
                </kbd>
                Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
