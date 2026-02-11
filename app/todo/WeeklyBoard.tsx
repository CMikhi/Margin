'use client'

import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TaskStatus } from '@/lib/types'
import { useWeeklyBoard } from '@/lib/hooks/useWeeklyBoard'
import { formatWeekRange } from '@/lib/utils/date'
import { COLUMNS } from '@/lib/types'
import { Column } from '../../components/Column'
import { AddTaskInput } from '../../components/AddTaskInput'
import { TaskCard } from '../../components/TaskCard'

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
}

export function WeeklyBoard() {
  const { board, addTask, updateTaskStatus, deleteTask } = useWeeklyBoard()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const task = board.tasks.find(t => t.id === taskId)
    if (!task) return

    // Check if dropped on a column
    const columnId = over.id as TaskStatus
    if (COLUMNS.some(col => col.id === columnId)) {
      updateTaskStatus(taskId, columnId)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return board.tasks.filter(task => task.status === status)
  }

  const activeTask = activeId ? board.tasks.find(t => t.id === activeId) : null

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen py-10 px-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-275 mx-auto">
        {/* Header - Notion page style */}
        <div className="mb-8 max-w-180">
          <div className="mb-2">
          </div>
          <h1
            className="text-[32px] font-bold leading-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Weekly Focus
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {formatWeekRange(board.weekStart)}
          </p>
        </div>

        {/* Add Task Input */}
        <div className="max-w-180 mb-6">
          <AddTaskInput onAdd={addTask} />
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(column => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
                onDeleteTask={deleteTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="cursor-grabbing" style={{ transform: 'rotate(2deg) scale(1.02)' }}>
                <TaskCard task={activeTask} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </motion.div>
  )
}
