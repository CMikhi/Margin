import { useState, useEffect } from 'react'
import type { Task, TaskStatus, WeeklyBoard } from '@/lib/types'
import { getCurrentWeekStart } from '@/lib/utils/date'
import { loadBoard, saveBoard } from '@/lib/utils/storage'

export function useWeeklyBoard() {
  const [board, setBoard] = useState<WeeklyBoard>(() => {
    const currentWeek = getCurrentWeekStart()
    return {
      weekStart: currentWeek,
      tasks: []
    }
  })

  // Load board on mount and check for week rollover
  useEffect(() => {
    const currentWeek = getCurrentWeekStart()
    const stored = loadBoard()

    if (stored && stored.weekStart === currentWeek) {
      // Same week, restore tasks
      setBoard(stored)
    } else {
      // New week or no stored data, start fresh
      const freshBoard: WeeklyBoard = {
        weekStart: currentWeek,
        tasks: []
      }
      setBoard(freshBoard)
      saveBoard(freshBoard)
    }
  }, [])

  // Save to localStorage whenever board changes
  useEffect(() => {
    saveBoard(board)
  }, [board])

  const addTask = (title: string) => {
    if (!title.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status: 'todo',
      createdAt: Date.now()
    }

    setBoard(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }))
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setBoard(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    }))
  }

  const deleteTask = (taskId: string) => {
    setBoard(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }))
  }

  return {
    board,
    addTask,
    updateTaskStatus,
    deleteTask
  }
}
