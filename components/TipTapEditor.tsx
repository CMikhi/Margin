'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { common, createLowlight } from 'lowlight'
import { useState, useCallback, useRef, useEffect } from 'react'
import { loadCustomPages } from '@/lib/utils/storage'
import type { CustomPage } from '@/lib/types'

const lowlight = createLowlight(common)

// Highlight colors configuration
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef3c7' },
  { name: 'Green', color: '#d1fae5' },
  { name: 'Blue', color: '#dbeafe' },
  { name: 'Pink', color: '#fce7f3' },
  { name: 'Purple', color: '#ede9fe' },
  { name: 'Orange', color: '#fed7aa' },
]

// Font families configuration
const FONT_FAMILIES = [
  { name: 'Sans', value: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Serif', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { name: 'Mono', value: 'SFMono-Regular, Menlo, Monaco, monospace' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
]

interface SlashCommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

interface TipTapEditorProps {
  content: string
  onChange: (html: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function TipTapEditor({
  content,
  onChange,
  onBlur,
  placeholder = 'Type \'/\' for commands...',
  className = '',
  autoFocus = true,
}: TipTapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
  const [slashFilter, setSlashFilter] = useState('')
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0)
  const [showLinkMenu, setShowLinkMenu] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showPageSearch, setShowPageSearch] = useState(false)
  const [pageSearchQuery, setPageSearchQuery] = useState('')
  const [workspacePages, setWorkspacePages] = useState<CustomPage[]>([])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [linkTooltip, setLinkTooltip] = useState<{ url: string; x: number; y: number } | null>(null)
  const [showBubbleMenu, setShowBubbleMenu] = useState(false)
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ x: 0, y: 0 })
  
  const slashMenuRef = useRef<HTMLDivElement>(null)
  const pageSearchRef = useRef<HTMLDivElement>(null)
  const linkMenuRef = useRef<HTMLDivElement>(null)
  const bubbleMenuRef = useRef<HTMLDivElement>(null)

  // Load workspace pages for page linking
  useEffect(() => {
    setWorkspacePages(loadCustomPages())
  }, [])

  const slashCommands: SlashCommandItem[] = [
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <span className="font-bold text-lg">H1</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <span className="font-bold text-base">H2</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <span className="font-bold text-sm">H3</span>,
      command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bullet List',
      description: 'Simple bullet list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      description: 'Numbered list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Checklist',
      description: 'Track tasks with checkboxes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Code Block',
      description: 'Display code with syntax highlighting',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Divider',
      description: 'Visual divider line',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: 'Highlight',
      description: 'Highlight important text',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      ),
      command: (editor) => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_COLORS[0].color }).run(),
    },
  ]

  const filteredSlashCommands = slashCommands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(slashFilter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(slashFilter.toLowerCase())
  )

  const filteredPages = workspacePages.filter((page) =>
    page.name.toLowerCase().includes(pageSearchQuery.toLowerCase())
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      FontFamily,
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      HorizontalRule,
    ],
    content,
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: `tiptap-editor outline-none min-h-[40px] ${className}`,
      },
      handleKeyDown: (view, event) => {
        // Handle Tab key for indentation (4 spaces)
        if (event.key === 'Tab') {
          event.preventDefault()
          if (event.shiftKey) {
            // Shift+Tab: outdent (remove up to 4 spaces from start of line)
            // For now, just prevent default
            return true
          } else {
            // Tab: insert 4 spaces
            editor?.chain().focus().insertContent('    ').run()
            return true
          }
        }

        // Handle slash commands
        if (event.key === '/' && !showSlashMenu) {
          const { from } = view.state.selection
          const coords = view.coordsAtPos(from)
          setSlashMenuPosition({ x: coords.left, y: coords.bottom + 8 })
          setShowSlashMenu(true)
          setSlashFilter('')
          setSelectedSlashIndex(0)
          return false
        }

        // Handle [[ for page linking
        if (event.key === '[' && !showPageSearch) {
          const { from } = view.state.selection
          const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from)
          if (textBefore === '[') {
            const coords = view.coordsAtPos(from)
            setSlashMenuPosition({ x: coords.left, y: coords.bottom + 8 })
            setShowPageSearch(true)
            setPageSearchQuery('')
            setSelectedPageIndex(0)
            // Delete the first [
            editor?.commands.deleteRange({ from: from - 1, to: from })
            return true
          }
        }

        // Handle slash menu navigation
        if (showSlashMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length)
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedSlashIndex((prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            if (filteredSlashCommands[selectedSlashIndex]) {
              filteredSlashCommands[selectedSlashIndex].command(editor!)
              // Delete the slash character
              const { from } = view.state.selection
              const textBefore = view.state.doc.textBetween(Math.max(0, from - slashFilter.length - 1), from)
              if (textBefore.startsWith('/')) {
                editor?.commands.deleteRange({ from: from - slashFilter.length - 1, to: from })
              }
            }
            setShowSlashMenu(false)
            return true
          }
          if (event.key === 'Escape') {
            setShowSlashMenu(false)
            return true
          }
          // Filter input
          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
            setSlashFilter((prev) => prev + event.key)
            setSelectedSlashIndex(0)
          }
          if (event.key === 'Backspace') {
            if (slashFilter.length > 0) {
              setSlashFilter((prev) => prev.slice(0, -1))
            } else {
              setShowSlashMenu(false)
            }
          }
        }

        // Handle page search navigation
        if (showPageSearch) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedPageIndex((prev) => (prev + 1) % filteredPages.length)
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedPageIndex((prev) => (prev - 1 + filteredPages.length) % filteredPages.length)
            return true
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            if (filteredPages[selectedPageIndex]) {
              insertPageLink(filteredPages[selectedPageIndex])
            }
            setShowPageSearch(false)
            return true
          }
          if (event.key === 'Escape') {
            setShowPageSearch(false)
            return true
          }
          // Filter input
          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
            setPageSearchQuery((prev) => prev + event.key)
            setSelectedPageIndex(0)
          }
          if (event.key === 'Backspace') {
            if (pageSearchQuery.length > 0) {
              setPageSearchQuery((prev) => prev.slice(0, -1))
            } else {
              setShowPageSearch(false)
            }
          }
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      
      if (hasSelection && !showSlashMenu && !showPageSearch && !showLinkMenu) {
        const domSelection = window.getSelection()
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          setBubbleMenuPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top - 8,
          })
          setShowBubbleMenu(true)
        }
      } else {
        setShowBubbleMenu(false)
        setShowHighlightPicker(false)
        setShowFontPicker(false)
      }
    },
    onBlur: () => {
      onBlur?.()
    },
  })

  // Handle Cmd+K for link dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (editor) {
          const previousUrl = editor.getAttributes('link').href
          setLinkUrl(previousUrl || '')
          setShowLinkMenu(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  // Handle link hover tooltip
  useEffect(() => {
    if (!editor) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' && target.classList.contains('tiptap-link')) {
        const url = target.getAttribute('href')
        if (url) {
          const rect = target.getBoundingClientRect()
          setLinkTooltip({ url, x: rect.left, y: rect.bottom + 4 })
        }
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') {
        setLinkTooltip(null)
      }
    }

    const editorEl = editor.view.dom
    editorEl.addEventListener('mouseover', handleMouseOver)
    editorEl.addEventListener('mouseout', handleMouseOut)

    return () => {
      editorEl.removeEventListener('mouseover', handleMouseOver)
      editorEl.removeEventListener('mouseout', handleMouseOut)
    }
  }, [editor])

  const insertPageLink = useCallback(
    (page: CustomPage) => {
      if (!editor) return
      // Insert plain text (page icon + name) without a link mark
      editor
        .chain()
        .focus()
        .insertContent(`${page.icon} ${page.name}`)
        .run()
    },
    [editor]
  )

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) {
      editor?.chain().focus().unsetLink().run()
      setShowLinkMenu(false)
      return
    }

    // Add protocol if missing
    let url = linkUrl
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      url = `https://${url}`
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setShowLinkMenu(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const clearFormatting = useCallback(() => {
    if (!editor) return
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="tiptap-wrapper h-full flex flex-col relative">
      {/* Fixed Toolbar at Top */}
      <div
        className="fixed-toolbar flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap"
        onMouseDown={(e) => e.preventDefault()}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Undo/Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-primary)' }}
          title="Undo (⌘Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-primary)' }}
          title="Redo (⌘⇧Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Heading Dropdown */}
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
          }
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value
            if (val === 'p') editor.chain().focus().setParagraph().run()
            else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
            else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
            else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
          }}
          className="px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        {/* Font Family Dropdown */}
        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run()
            }
          }}
          className="px-2 py-1 rounded text-xs"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.name} value={f.value}>{f.name}</option>
          ))}
        </select>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Text Formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Bold (⌘B)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Italic (⌘I)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Underline (⌘U)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Strikethrough (⌘⇧X)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
          </svg>
        </button>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('taskList') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Checklist"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Quote & Code */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('code') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Inline Code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className={`p-1.5 rounded transition-colors ${editor.isActive('highlight') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Highlight"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 1.15c-.53 0-1.04.19-1.43.58l-2.72 2.72-1.19-1.19c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l11 11c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.19-1.19 2.72-2.72c.78-.78.78-2.05 0-2.83l-5.76-5.76c-.39-.39-.9-.58-1.43-.58zM10 9L3 22h18l-2.5-4.25L10 9z" />
            </svg>
          </button>
          {showHighlightPicker && (
            <div
              className="absolute top-full left-0 mt-1 p-2 rounded-lg z-50 grid grid-cols-3 gap-1"
              onMouseDown={(e) => e.preventDefault()}
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-overlay)',
              }}
            >
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.name}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: h.color }).run()
                    setShowHighlightPicker(false)
                  }}
                  className="w-6 h-6 rounded border border-transparent hover:border-[var(--border-hover)]"
                  style={{ backgroundColor: h.color }}
                  title={h.name}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run()
                  setShowHighlightPicker(false)
                }}
                className="w-6 h-6 rounded border border-[var(--border-default)] flex items-center justify-center text-xs"
                style={{ color: 'var(--text-muted)' }}
                title="Remove highlight"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--text-primary)' }}
          title="Divider"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        </button>

        {/* Link */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href
            setLinkUrl(previousUrl || '')
            setShowLinkMenu(true)
          }}
          className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-[var(--bg-active)]' : ''}`}
          style={{ color: 'var(--text-primary)' }}
          title="Link (⌘K)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Clear Formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--text-primary)' }}
          title="Clear formatting"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bubble Menu Toolbar */}
      {showBubbleMenu && (
        <div
          ref={bubbleMenuRef}
          className="bubble-menu fixed z-50"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            left: bubbleMenuPosition.x,
            top: bubbleMenuPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
        <div
          className="flex items-center gap-0.5 px-1 py-1 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-overlay)',
          }}
        >
          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Bold (⌘B)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
            </svg>
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Italic (⌘I)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
            </svg>
          </button>

          {/* Underline */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Underline (⌘U)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
            </svg>
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Strikethrough (⌘⇧X)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
            </svg>
          </button>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Inline Code */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded transition-colors ${editor.isActive('code') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Inline Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          {/* Highlight Picker */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className={`p-1.5 rounded transition-colors ${editor.isActive('highlight') ? 'bg-[var(--bg-active)]' : ''}`}
              style={{ color: 'var(--text-primary)' }}
              title="Highlight"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 1.15c-.53 0-1.04.19-1.43.58l-2.72 2.72-1.19-1.19c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l11 11c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.19-1.19 2.72-2.72c.78-.78.78-2.05 0-2.83l-5.76-5.76c-.39-.39-.9-.58-1.43-.58zM10 9L3 22h18l-2.5-4.25L10 9z" />
              </svg>
            </button>
            {showHighlightPicker && (
              <div
                className="absolute top-full left-0 mt-1 p-2 rounded-lg z-50 grid grid-cols-3 gap-1"
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-overlay)',
                }}
              >
                {HIGHLIGHT_COLORS.map((h) => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: h.color }).run()
                      setShowHighlightPicker(false)
                    }}
                    className="w-6 h-6 rounded border border-transparent hover:border-[var(--border-hover)]"
                    style={{ backgroundColor: h.color }}
                    title={h.name}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run()
                    setShowHighlightPicker(false)
                  }}
                  className="w-6 h-6 rounded border border-[var(--border-default)] flex items-center justify-center text-xs"
                  style={{ color: 'var(--text-muted)' }}
                  title="Remove highlight"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href
              setLinkUrl(previousUrl || '')
              setShowLinkMenu(true)
            }}
            className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-[var(--bg-active)]' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            title="Link (⌘K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {/* Font Family Picker */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="p-1.5 rounded transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-primary)' }}
              title="Font Family"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>
            {showFontPicker && (
              <div
                className="absolute top-full right-0 mt-1 p-1 rounded-lg z-50 min-w-[140px]"
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-overlay)',
                }}
              >
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setFontFamily(f.value).run()
                      setShowFontPicker(false)
                    }}
                    className="w-full text-left px-3 py-1.5 rounded hover:bg-[var(--bg-hover)] text-sm"
                    style={{ fontFamily: f.value, color: 'var(--text-primary)' }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Clear Formatting */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearFormatting}
            className="p-1.5 rounded transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-primary)' }}
            title="Clear formatting"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />

      {/* Slash Commands Menu */}
      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="fixed z-50 p-1 rounded-lg max-h-80 overflow-auto min-w-[240px]"
          style={{
            left: Math.min(slashMenuPosition.x, window.innerWidth - 260),
            top: Math.min(slashMenuPosition.y, window.innerHeight - 340),
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-overlay)',
          }}
        >
          <div className="px-2 py-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {slashFilter ? `Searching "${slashFilter}"` : 'Basic blocks'}
          </div>
          {filteredSlashCommands.length === 0 ? (
            <div className="px-2 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              No results
            </div>
          ) : (
            filteredSlashCommands.map((cmd, i) => (
              <button
                key={cmd.title}
                type="button"
                onClick={() => {
                  cmd.command(editor)
                  // Delete the slash and filter
                  const { from } = editor.state.selection
                  const deleteLength = slashFilter.length + 1
                  editor.commands.deleteRange({ from: from - deleteLength, to: from })
                  setShowSlashMenu(false)
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left ${
                  i === selectedSlashIndex ? 'bg-[var(--bg-hover)]' : ''
                }`}
                style={{ color: 'var(--text-primary)' }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  {cmd.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{cmd.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Page Search Menu */}
      {showPageSearch && (
        <div
          ref={pageSearchRef}
          className="fixed z-50 p-1 rounded-lg max-h-80 overflow-auto min-w-[280px]"
          style={{
            left: Math.min(slashMenuPosition.x, window.innerWidth - 300),
            top: Math.min(slashMenuPosition.y, window.innerHeight - 340),
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-overlay)',
          }}
        >
          <div className="px-2 py-1.5 text-xs font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span>Link to page</span>
            {pageSearchQuery && <span>• "{pageSearchQuery}"</span>}
          </div>
          {filteredPages.length === 0 ? (
            <div className="px-2 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {workspacePages.length === 0 ? 'No pages in workspace' : 'No matching pages'}
            </div>
          ) : (
            filteredPages.map((page, i) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  insertPageLink(page)
                  setShowPageSearch(false)
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded text-left ${
                  i === selectedPageIndex ? 'bg-[var(--bg-hover)]' : ''
                }`}
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="text-lg">{page.icon}</span>
                <span className="text-sm">{page.name}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Link Input Dialog */}
      {showLinkMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setShowLinkMenu(false)}
        >
          <div
            ref={linkMenuRef}
            className="rounded-lg p-4 min-w-[400px]"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-overlay)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Add link
            </div>
            
            {/* Tab buttons */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded"
                style={{
                  backgroundColor: 'var(--bg-active)',
                  color: 'var(--text-primary)',
                }}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkMenu(false)
                  const { from } = editor.state.selection
                  const coords = editor.view.coordsAtPos(from)
                  setSlashMenuPosition({ x: coords.left, y: coords.bottom + 8 })
                  setShowPageSearch(true)
                  setPageSearchQuery('')
                  setSelectedPageIndex(0)
                }}
                className="px-3 py-1.5 text-sm rounded hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Link to page
              </button>
            </div>

            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setLink()
                }
                if (e.key === 'Escape') {
                  setShowLinkMenu(false)
                }
              }}
              placeholder="Paste link or search..."
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-3">
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setShowLinkMenu(false)
                  }}
                  className="px-3 py-1.5 text-sm rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--accent-red)' }}
                >
                  Remove link
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLinkMenu(false)}
                className="px-3 py-1.5 text-sm rounded hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={setLink}
                className="px-3 py-1.5 text-sm rounded"
                style={{
                  backgroundColor: 'var(--accent-blue)',
                  color: 'white',
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Tooltip */}
      {linkTooltip && (
        <div
          className="fixed z-50 px-2 py-1 rounded text-xs max-w-xs truncate"
          style={{
            left: linkTooltip.x,
            top: linkTooltip.y,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--text-secondary)',
          }}
        >
          {linkTooltip.url}
        </div>
      )}
    </div>
  )
}

export default TipTapEditor
