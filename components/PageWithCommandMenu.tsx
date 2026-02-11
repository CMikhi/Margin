'use client'

import { CommandMenu } from './CommandMenu'

interface PageWithCommandMenuProps {
  children: React.ReactNode
  onAddTextWidget?: () => void
}

export function PageWithCommandMenu({ children, onAddTextWidget }: PageWithCommandMenuProps) {
  return (
    <>
      <CommandMenu onAddTextWidget={onAddTextWidget} />
      {children}
    </>
  )
}
