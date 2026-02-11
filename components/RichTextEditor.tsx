'use client'

import { useRef, useEffect, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onBlur: () => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, onBlur, placeholder = 'Start typing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Set initial content and focus on mount
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content
      }
      // Auto-focus the editor when it mounts
      editorRef.current.focus()
      setShowToolbar(true)
    }
  }, [])

  // Sync content changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleFocus = () => {
    setShowToolbar(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the blur is due to clicking on a toolbar button
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('.toolbar')) {
      return // Don't blur if clicking toolbar
    }
    setShowToolbar(false)
    onBlur()
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const toggleBold = () => execCommand('bold')
  const toggleItalic = () => execCommand('italic')
  const toggleBulletList = () => execCommand('insertUnorderedList')
  
  const insertCheckbox = () => {
    const checkbox = '☐ '
    execCommand('insertText', checkbox)
  }

  const changeFontSize = (size: string) => {
    execCommand('fontSize', size)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {showToolbar && (
        <div
          className="toolbar flex items-center gap-0.5 px-1 py-1 mb-2 rounded-md"
          style={{
            backgroundColor: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleBold()
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Bold (Cmd+B)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleItalic()
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Italic (Cmd+I)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
            </svg>
          </button>

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: 'var(--border-default)' }}
          />

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              toggleBulletList()
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              insertCheckbox()
            }}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-active)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Checkbox"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>

          <div
            className="w-px h-4 mx-1"
            style={{ backgroundColor: 'var(--border-default)' }}
          />

          <select
            onChange={(e) => {
              if (e.target.value) {
                changeFontSize(e.target.value)
              }
              e.target.value = ''
            }}
            onBlur={() => editorRef.current?.focus()}
            className="px-2 py-1 rounded text-xs transition-colors"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            title="Font Size"
          >
            <option value="">Size</option>
            <option value="1">Small (8px)</option>
            <option value="3">Normal (16px)</option>
            <option value="5">Large (32px)</option>
            <option value="6">XL (48px)</option>
            <option value="7">XXL (64px)</option>
          </select>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="flex-1 outline-none overflow-auto text-sm leading-relaxed"
        style={{
          color: 'var(--text-primary)',
          minHeight: '40px',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  )
}
