'use client'

import { CommandMenu } from './CommandMenu'

interface PageWithCommandMenuProps {
  children: React.ReactNode
  pageTitle?: string
  onAddTextBox?: () => void
  onAddImage?: () => void
  onAddCalendar?: () => void
  onAddDailyEvents?: () => void
}

export function PageWithCommandMenu({ 
  children, 
  pageTitle,
  onAddTextBox, 
  onAddImage,
  onAddCalendar,
  onAddDailyEvents
}: PageWithCommandMenuProps) {
  return (
    <>
      <CommandMenu 
        pageTitle={pageTitle}
        onAddTextWidget={onAddTextBox} 
        onAddImage={onAddImage}
        onAddCalendar={onAddCalendar}
        onAddDailyEvents={onAddDailyEvents}
      />
      {children}
    </>
  )
}

