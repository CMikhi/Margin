'use client'

import { useState } from 'react'
import { TipTapEditor } from '@/components/TipTapEditor'

interface EditableSpanProps {
  id: string
  content: string
  onContentChange: (id: string, content: string) => void
  className?: string
  style?: React.CSSProperties
}

export function EditableSpan({ id, content, onContentChange, className = '', style = {} }: EditableSpanProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localContent, setLocalContent] = useState(content)

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (localContent !== content) {
      onContentChange(id, localContent)
    }
  }

  const handleChange = (html: string) => {
    setLocalContent(html)
  }

  return (
    <>
      {isEditing ? (
        <div className="w-full min-h-8">
          <TipTapEditor
            content={localContent}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Click to edit..."
            autoFocus={true}
          />
        </div>
      ) : (
        <span
          onClick={handleClick}
          className={`cursor-text transition-colors hover:opacity-70 ${className}`}
          style={style}
        >
          {content ? <span className="tiptap-editor" dangerouslySetInnerHTML={{ __html: content }} /> : 'Click to edit...'}
        </span>
      )}
    </>
  )
}
