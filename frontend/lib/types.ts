export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Task = {
  id: string
  title: string
  status: TaskStatus
  createdAt: number
}

export type WeeklyBoard = {
  weekStart: string // ISO date string (Monday)
  tasks: Task[]
}

export type Column = {
  id: TaskStatus
  title: string
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
]

// Custom Pages
export type CustomPage = {
  id: string
  name: string
  icon: string
  createdAt: number
}

// Calendar Events
export interface CalendarEvent {
  id: string
  title: string
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string   // ISO date string (YYYY-MM-DD)
  time: string      // 'all-day' or specific time like '09:00'
  description: string
  color: string
}
