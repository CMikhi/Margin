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
