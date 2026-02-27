'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, TaskStatus } from '@/lib/types'
import { TaskCard } from '@/components/TaskCard'

interface ColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onDeleteTask: (taskId: string) => void
}

export function Column({ id, title, tasks, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col min-h-80 flex-1">
      {/* Column header*/}
      <div className="flex items-center gap-2 mb-3 px-1">
        <h2
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </h2>
        <span
          className="text-xs tabular-nums px-1.5 py-0.5 rounded"
          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)' }}
        >
          {tasks.length}
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 rounded-lg p-2 transition-colors duration-150"
        style={{
          backgroundColor: isOver ? 'var(--bg-drag-over)' : 'var(--bg-secondary)',
          border: isOver ? '1px dashed var(--accent-blue)' : '1px solid transparent',
        }}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div layout className="space-y-1.5">
            <AnimatePresence>
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={onDeleteTask}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center h-24 text-xs rounded-md"
            style={{ color: 'var(--text-muted)', border: '1px dashed var(--border-default)' }}
          >
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  )
}
