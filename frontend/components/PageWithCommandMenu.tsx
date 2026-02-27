'use client'

import { CommandMenu } from '@/components/CommandMenu'

interface PageWithCommandMenuProps {
  children: React.ReactNode
  pageTitle?: string
  onAddTextBox?: () => void
  onAddImage?: () => void
  onAddCalendar?: () => void
  onAddDailyEvents?: () => void
  onAddStickyDrawing?: () => void
  onAddFullCanvas?: () => void
}

export function PageWithCommandMenu({ 
  children, 
  pageTitle,
  onAddTextBox, 
  onAddImage,
  onAddCalendar,
  onAddDailyEvents,
  onAddStickyDrawing,
  onAddFullCanvas,
}: PageWithCommandMenuProps) {
  return (
    <>
      <CommandMenu 
        pageTitle={pageTitle}
        onAddTextWidget={onAddTextBox} 
        onAddImage={onAddImage}
        onAddCalendar={onAddCalendar}
        onAddDailyEvents={onAddDailyEvents}
        onAddStickyDrawing={onAddStickyDrawing}
        onAddFullCanvas={onAddFullCanvas}
      />
      {children}
    </>
  )
}

