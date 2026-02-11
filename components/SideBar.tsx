'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadCustomPages, addCustomPage, deleteCustomPage } from '@/lib/utils/storage'
import type { CustomPage } from '@/lib/types'

const sidebarVariants = {
  open: {
    width: 240,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  },
  closed: {
    width: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  },
}

const contentVariants = {
  open: {
    opacity: 1,
    transition: { delay: 0.05, duration: 0.15 },
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
}

export default function SideBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [customPages, setCustomPages] = useState<CustomPage[]>([])
  const [showNewPageInput, setShowNewPageInput] = useState(false)
  const [newPageName, setNewPageName] = useState('')

  // Load custom pages on mount
  useEffect(() => {
    setCustomPages(loadCustomPages())
  }, [])

  const handleCreatePage = useCallback(() => {
    if (!newPageName.trim()) return

    const newPage: CustomPage = {
      id: `page-${Date.now()}`,
      name: newPageName.trim(),
      icon: '📄',
      createdAt: Date.now(),
    }

    addCustomPage(newPage)
    setCustomPages(loadCustomPages())
    setNewPageName('')
    setShowNewPageInput(false)
    router.push(`/page/${newPage.id}`)
  }, [newPageName, router])

  const handleDeletePage = useCallback((pageId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this page? All content will be lost.')) {
      deleteCustomPage(pageId)
      setCustomPages(loadCustomPages())
      
      // If we're on the deleted page, redirect to home
      if (pathname === `/page/${pageId}`) {
        router.push('/')
      }
    }
  }, [pathname, router])

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      name: 'Todo Board',
      href: '/todo',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Calendar',
      href: '/calander',
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
  ]

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  return (
    <>
      {/* Collapsed toggle button */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={toggleSidebar}
            className="fixed top-3 left-3 z-50 p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Expand sidebar"
            suppressHydrationWarning
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" suppressHydrationWarning>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isCollapsed ? 'closed' : 'open'}
        variants={sidebarVariants}
        className="relative h-screen shrink-0 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          variants={contentVariants}
          className="flex flex-col h-full w-60"
        >
          {/* Workspace header */}
          <div className="flex items-center justify-between px-3 py-2.5 group">
            <Link href="/" className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-(--bg-hover) transition-colors flex-1 min-w-0">
              <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-semibold bg-linear-to-br from-(--accent-blue) to-(--accent-purple) text-white shrink-0">
                M
              </div>
              <span className="text-sm font-medium text-(--text-primary) truncate">Margin</span>
            </Link>

            {/* Collapse button */}
            <motion.button
              onClick={toggleSidebar}
              className="p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              initial={false}
              animate={{ opacity: isHovering ? 1 : 0 }}
              transition={{ duration: 0.12 }}
              aria-label="Collapse sidebar"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              suppressHydrationWarning
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" suppressHydrationWarning>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-1 overflow-y-auto">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 px-2.5 py-1.25 rounded-md text-sm transition-colors duration-120"
                      style={{
                        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span className="shrink-0" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Divider */}
            {customPages.length > 0 && (
              <div className="my-2 mx-2 border-t" style={{ borderColor: 'var(--border-divider)' }} />
            )}

            {/* Custom Pages */}
            <ul className="space-y-0.5">
              {customPages.map((page) => {
                const isActive = pathname === `/page/${page.id}`
                return (
                  <li key={page.id} className="group/page">
                    <Link
                      href={`/page/${page.id}`}
                      className="flex items-center gap-2.5 px-2.5 py-1.25 rounded-md text-sm transition-colors duration-120 relative"
                      style={{
                        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span className="shrink-0 text-sm">{page.icon}</span>
                      <span className="truncate flex-1">{page.name}</span>
                      <button
                        onClick={(e) => handleDeletePage(page.id, e)}
                        className="opacity-0 group-hover/page:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/10"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Delete page"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Add Page Button / Input */}
            {showNewPageInput ? (
              <div className="mt-1 px-2">
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePage()
                    if (e.key === 'Escape') {
                      setShowNewPageInput(false)
                      setNewPageName('')
                    }
                  }}
                  onBlur={() => {
                    if (newPageName.trim()) {
                      handleCreatePage()
                    } else {
                      setShowNewPageInput(false)
                    }
                  }}
                  placeholder="Page name..."
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm rounded-md bg-transparent border focus:outline-none"
                  style={{
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewPageInput(true)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.25 mx-2 mt-1 rounded-md text-sm transition-colors duration-120"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New Page</span>
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border-divider)' }}>
            <p className="text-[11px] px-1.5" style={{ color: 'var(--text-muted)' }}>
              Margin · Weekly Focus
            </p>
          </div>
        </motion.div>

        {/* Resize handle visual indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border-divider)' }} />
      </motion.aside>
    </>
  )
}

