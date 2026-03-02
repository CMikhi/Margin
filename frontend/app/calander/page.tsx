'use client';

import { PageWithCommandMenu } from '@/components/PageWithCommandMenu';
import { DashboardGrid } from '@/components/DashboardGrid';
import { CalendarWidget } from '@/components/CalendarWidget';
import { DailyEventsWidget } from '@/components/DailyEventsWidget';
import { EditableTextWidget } from '@/components/EditableTextWidget';
import { ImageWidget } from '@/components/ImageWidget';
import { StickyDrawingWidget } from '@/components/StickyDrawingWidget';
import { FullCanvasWidget } from '@/components/FullCanvasWidget';
import { useGridLayout } from '@/lib/hooks/useGridLayout';
import { ReactNode } from 'react';

export default function CalendarPage() {
  const {
    layout,
    textWidgets,
    imageWidgets,
    canvasWidgets,
    hiddenWidgets,
    moveWidget,
    resizeWidget,
    addTextWidget,
    addImageWidget,
    addCalendarWidget,
    addDailyEventsWidget,
    addStickyDrawing,
    addFullCanvas,
    updateTextWidget,
    updateImageWidget,
    updateCanvasWidget,
    deleteWidget,
    bringToFront,
    sendToBack,
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

  // Canvas widgets (sticky drawings & full canvases)
  Object.entries(canvasWidgets).forEach(([widgetId, data]) => {
    widgets.push({
      id: widgetId,
      minColSpan: 2,
      minRowSpan: 2,
      content: widgetId.startsWith('sticky-drawing-') ? (
        <StickyDrawingWidget
          id={widgetId}
          initialData={data || undefined}
          onDataChange={updateCanvasWidget}
          onDelete={deleteWidget}
        />
      ) : (
        <FullCanvasWidget
          id={widgetId}
          initialData={data || undefined}
          onDataChange={updateCanvasWidget}
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
      onAddStickyDrawing={addStickyDrawing}
      onAddFullCanvas={addFullCanvas}
    >
      <DashboardGrid
        widgets={widgets}
        layout={layout}
        moveWidget={moveWidget}
        resizeWidget={resizeWidget}
        deleteWidget={deleteWidget}
        bringToFront={bringToFront}
        sendToBack={sendToBack}
        resetLayout={resetLayout}
        isLoaded={isLoaded}
      />
      
    </PageWithCommandMenu>
  );
}

