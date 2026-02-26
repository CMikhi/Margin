/**
 * Get the Monday of the current week in ISO format (YYYY-MM-DD)
 */
export function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // Adjust when day is Sunday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

/**
 * Format a date string to a readable week range (e.g., "Jan 6 – 12, 2026")
 */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const monthStart = start.toLocaleDateString('en-US', { month: 'short' })
  const dayStart = start.getDate()
  const dayEnd = end.getDate()
  const year = start.getFullYear()

  return `${monthStart} ${dayStart} – ${dayEnd}, ${year}`
}
