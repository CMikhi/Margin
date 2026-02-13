'use client';

import { PageWithCommandMenu } from '@/components/PageWithCommandMenu';
import { DashboardGrid } from '@/components/DashboardGrid';
import { CalendarWidget } from '@/components/CalendarWidget';
import { DailyEventsWidget } from '@/components/DailyEventsWidget';
import { EditableTextWidget } from '@/components/EditableTextWidget';
import { useGridLayout } from '@/lib/hooks/useGridLayout';

export default function CalendarPage() {
  const {
    layout,
    textWidgets,
    hiddenWidgets,
    moveWidget,
    resizeWidget,
    addTextWidget,
    addCalendarWidget,
    addDailyEventsWidget,
    updateTextWidget,
    deleteWidget,
    resetLayout,
    isLoaded,
  } = useGridLayout('calendar-page');

  const widgets = [
    // Calendar widget - takes up large portion of the screen
    !hiddenWidgets.has('calendar') && {
      id: 'calendar',
      minColSpan: 4,
      minRowSpan: 4,
      content: (
        <CalendarWidget 
          id="calendar" 
          onDelete={deleteWidget}
        />
      ),
    },
    // Daily events widget - shows today's events
    !hiddenWidgets.has('dailyEvents') && {
      id: 'dailyEvents',
      minColSpan: 2,
      minRowSpan: 3,
      content: (
        <DailyEventsWidget 
          id="dailyEvents" 
          onDelete={deleteWidget}
        />
      ),
    },
    // Text widgets
    ...Object.entries(textWidgets).map(([id, text]) => ({
      id,
      minColSpan: 2,
      minRowSpan: 2,
      content: (
        <EditableTextWidget
          id={id}
          text={text}
          onTextChange={updateTextWidget}
          onDelete={deleteWidget}
        />
      ),
    })),
  ].filter((widget) => widget !== false);

  return (
    <PageWithCommandMenu
      pageTitle="📅 Calendar"
      onAddTextBox={addTextWidget}
      onAddCalendar={addCalendarWidget}
      onAddDailyEvents={addDailyEventsWidget}
    >
      <DashboardGrid
        widgets={widgets}
        layout={layout}
        moveWidget={moveWidget}
        resizeWidget={resizeWidget}
        deleteWidget={deleteWidget}
        resetLayout={resetLayout}
        isLoaded={isLoaded}
      />
    </PageWithCommandMenu>
  );
}

