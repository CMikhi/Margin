'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { DashboardGrid } from '@/components/DashboardGrid';
import { PageWithCommandMenu } from '@/components/PageWithCommandMenu';
import { EditableTextWidget } from '@/components/EditableTextWidget';
import { ImageWidget } from '@/components/ImageWidget';
import { CalendarWidget } from '@/components/CalendarWidget';
import { DailyEventsWidget } from '@/components/DailyEventsWidget';
import { StickyDrawingWidget } from '@/components/StickyDrawingWidget';
import { FullCanvasWidget } from '@/components/FullCanvasWidget';
import { WelcomeWidget } from '@/components/WelcomeWidget';
import { useGridLayout } from '@/lib/hooks/useGridLayout';
import { loadCustomPages } from '@/lib/utils/storage';
import { useRouter } from 'next/navigation';

export default function CustomPage({ params }: { params: Promise<{ pageId: string }> }) {
  const router = useRouter();
  const { pageId } = use(params);
  const [pageName, setPageName] = useState('');
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
    resetLayout, 
    isLoaded 
  } = useGridLayout(pageId);

  // Check if page exists
  useEffect(() => {
    const pages = loadCustomPages();
    const page = pages.find(p => p.id === pageId);
    if (!page) {
      // Page doesn't exist, redirect to home
      router.push('/');
    } else {
      setPageName(page.name);
    }
  }, [pageId, router]);

  // Build dynamic widgets from textWidgets and imageWidgets
  const dynamicWidgets = useMemo(() => {
    const textWidgetsList = Object.entries(textWidgets).map(([widgetId, text]) => ({
      id: widgetId,
      content: (
        <EditableTextWidget
          id={widgetId}
          text={text}
          onTextChange={updateTextWidget}
          onDelete={deleteWidget}
        />
      ),
    }));
    
    const imageWidgetsList = Object.entries(imageWidgets).map(([widgetId, imageSrc]) => ({
      id: widgetId,
      content: (
        <ImageWidget
          id={widgetId}
          imageSrc={imageSrc}
          onImageChange={updateImageWidget}
          onDelete={deleteWidget}
        />
      ),
    }));

    const canvasWidgetsList = Object.entries(canvasWidgets).map(([widgetId, data]) => ({
      id: widgetId,
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
    }));
    
    return [...textWidgetsList, ...imageWidgetsList, ...canvasWidgetsList];
  }, [textWidgets, imageWidgets, canvasWidgets, updateTextWidget, updateImageWidget, updateCanvasWidget, deleteWidget]);

  const STATIC_WIDGETS = useMemo(() => {
    return [
      {
        id: 'welcome',
        content: <WelcomeWidget />,
      },
      {
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
      {
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
    ];
  }, [deleteWidget]);

  const allWidgets = useMemo(() => {
    // Filter out hidden static widgets
    const visibleStatic = STATIC_WIDGETS.filter(w => !hiddenWidgets.has(w.id));
    return [...visibleStatic, ...dynamicWidgets];
  }, [STATIC_WIDGETS, dynamicWidgets, hiddenWidgets]);

  if (!pageName) {
    return null; // Loading or redirecting
  }

  return (
    <PageWithCommandMenu 
      pageTitle={pageName}
      onAddTextBox={addTextWidget}
      onAddImage={addImageWidget}
      onAddCalendar={addCalendarWidget}
      onAddDailyEvents={addDailyEventsWidget}
      onAddStickyDrawing={addStickyDrawing}
      onAddFullCanvas={addFullCanvas}
    >
      <DashboardGrid
        widgets={allWidgets}
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
