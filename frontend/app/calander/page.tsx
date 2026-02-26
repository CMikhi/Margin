'use client';

import { PageWithCommandMenu } from '../../components/PageWithCommandMenu';
import { DashboardGrid } from '../../components/DashboardGrid';
import { CalendarWidget } from '../../components/CalendarWidget';
import { DailyEventsWidget } from '../../components/DailyEventsWidget';
import { EditableTextWidget } from '../../components/EditableTextWidget';
import { ImageWidget } from '../../components/ImageWidget';
import type { ReactNode } from 'react';
import { useGridLayout } from '@/lib/hooks/useGridLayout';

export default function CalendarPage() {
  const {
    layout,
    textWidgets,
    imageWidgets,
    hiddenWidgets,
    moveWidget,
    resizeWidget,
    addTextWidget,
    addImageWidget,
    addCalendarWidget,
    addDailyEventsWidget,
    updateTextWidget,
    updateImageWidget,
    deleteWidget,
    resetLayout,
    isLoaded,
  } = useGridLayout('calendar-page');

  type LocalWidget = { id: string; minColSpan?: number; minRowSpan?: number; content: ReactNode };

  const widgets: LocalWidget[] = [];

  // Calendar widget - takes up large portion of the screen
  if (!hiddenWidgets.has('calendar')) {
    widgets.push({
      id: 'calendar',
      minColSpan: 4,
      minRowSpan: 4,
      content: (
        <CalendarWidget 
          id="calendar" 
          onDelete={deleteWidget}
        />
      ),
    });
  }

  // Daily events widget - shows today's events
  if (!hiddenWidgets.has('dailyEvents')) {
    widgets.push({
      id: 'dailyEvents',
      minColSpan: 2,
      minRowSpan: 3,
      content: (
        <DailyEventsWidget 
          id="dailyEvents" 
          onDelete={deleteWidget}
        />
      ),
    });
  }

  // Text widgets
  Object.entries(textWidgets).forEach(([id, text]) => {
    widgets.push({
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
    });
  });

  // Image widgets
  Object.entries(imageWidgets).forEach(([id, imageSrc]) => {
    widgets.push({
      id,
      minColSpan: 2,
      minRowSpan: 2,
      content: (
        <ImageWidget
          id={id}
          imageSrc={imageSrc}
          onImageChange={updateImageWidget}
          onDelete={deleteWidget}
        />
      ),
    });
  });

  return (
    <PageWithCommandMenu
      pageTitle="📅 Calendar"
      onAddTextBox={addTextWidget}
      onAddImage={addImageWidget}
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

