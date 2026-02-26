'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddTaskInputProps {
  onAdd: (title: string) => void
}

export function AddTaskInput({ onAdd }: AddTaskInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value)
      setValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setValue('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="mb-6">
      <div
        className="relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-120"
        style={{
          backgroundColor: isFocused ? 'var(--bg-primary)' : 'transparent',
          border: isFocused ? '1px solid var(--accent-blue)' : '1px solid var(--border-default)',
          boxShadow: isFocused ? '0 0 0 3px var(--accent-blue-light)' : 'none',
        }}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke={isFocused ? 'var(--accent-blue)' : 'var(--text-muted)'}
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{
            color: 'var(--text-primary)',
          }}
        />

        <AnimatePresence>
          {value.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={handleSubmit}
              className="shrink-0 px-2 py-0.5 rounded text-xs font-medium transition-colors duration-120"
              style={{
                backgroundColor: 'var(--accent-blue)',
                color: 'white',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-blue)'}
              aria-label="Add task"
            >
              Add
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-1.5 text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
        Press Enter to add · Esc to clear
      </p>
    </div>
  )
}
