'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TipTapEditor } from './TipTapEditor'

interface EditableTextWidgetProps {
  id: string
  text: string
  onTextChange: (id: string, text: string) => void
  onDelete: (id: string) => void
}

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
}

export function EditableTextWidget({ id, text, onTextChange, onDelete }: EditableTextWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localText, setLocalText] = useState(text)

  useEffect(() => {
    setLocalText(text)
  }, [text])

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (localText !== text) {
      onTextChange(id, localText)
    }
  }

  const handleChange = (html: string) => {
    setLocalText(html)
  }

  const isEmpty = !localText || localText === 'Click to edit...' || localText.trim() === '' || localText === '<p></p>'

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="h-full">
      {isEditing ? (
        <TipTapEditor
          content={isEmpty ? '' : localText}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Type '/' for commands..."
          autoFocus={true}
        />
      ) : (
        <div
          onClick={handleClick}
          className="cursor-text w-full h-full text-sm leading-relaxed tiptap-editor"
          style={{
            color: isEmpty ? 'var(--text-muted)' : 'var(--text-primary)',
          }}
        >
          {isEmpty ? (
            'Click to edit...'
          ) : (
            <div dangerouslySetInnerHTML={{ __html: localText }} />
          )}
        </div>
      )}
    </motion.div>
  )
}
