'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
      className="group relative touch-none"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing rounded-md px-3 py-2.5 transition-all duration-120 flex items-start gap-2"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          e.currentTarget.style.borderColor = 'var(--border-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }}
      >
        {/* Drag handle - visible on hover */}
        <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-120 mt-0.5 cursor-grab">
          <svg className="w-3.5 h-3.5" viewBox="0 0 10 10" fill="var(--text-muted)">
            <circle cx="2.5" cy="2" r="1" />
            <circle cx="7.5" cy="2" r="1" />
            <circle cx="2.5" cy="5" r="1" />
            <circle cx="7.5" cy="5" r="1" />
            <circle cx="2.5" cy="8" r="1" />
            <circle cx="7.5" cy="8" r="1" />
          </svg>
        </span>

        <p
          className="text-sm leading-relaxed flex-1 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </p>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-120 rounded p-0.5 mt-0.5"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-red)'
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Delete task"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
