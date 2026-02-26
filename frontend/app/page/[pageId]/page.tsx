'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { DashboardGrid } from '@/frontend/components/DashboardGrid';
import { PageWithCommandMenu } from '@/frontend/components/PageWithCommandMenu';
import { EditableTextWidget } from '@/frontend/components/EditableTextWidget';
import { ImageWidget } from '@/frontend/components/ImageWidget';
import { CalendarWidget } from '@/frontend/components/CalendarWidget';
import { DailyEventsWidget } from '@/frontend/components/DailyEventsWidget';
import { WelcomeWidget } from '@/frontend/components/WelcomeWidget';
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
    
    return [...textWidgetsList, ...imageWidgetsList];
  }, [textWidgets, imageWidgets, updateTextWidget, updateImageWidget, deleteWidget]);

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
