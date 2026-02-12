'use client'

import { CommandMenu } from './CommandMenu'

interface PageWithCommandMenuProps {
  children: React.ReactNode
  pageTitle?: string
  onAddTextBox?: () => void
  onAddCalendar?: () => void
  onAddDailyEvents?: () => void
}

export function PageWithCommandMenu({ 
  children, 
  pageTitle,
  onAddTextBox, 
  onAddCalendar,
  onAddDailyEvents
}: PageWithCommandMenuProps) {
  return (
    <>
      <CommandMenu 
        pageTitle={pageTitle}
        onAddTextWidget={onAddTextBox} 
        onAddCalendar={onAddCalendar}
        onAddDailyEvents={onAddDailyEvents}
      />
      {children}
    </>
  )
}

