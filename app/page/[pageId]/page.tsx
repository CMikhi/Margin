'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, use } from 'react';
import { DashboardGrid } from '@/components/DashboardGrid';
import { PageWithCommandMenu } from '@/components/PageWithCommandMenu';
import { EditableTextWidget } from '@/components/EditableTextWidget';
import { CalendarWidget } from '@/components/CalendarWidget';
import { DailyEventsWidget } from '@/components/DailyEventsWidget';
import { EditableSpan } from '@/components/EditableSpan';
import { useGridLayout } from '@/lib/hooks/useGridLayout';
import { loadCustomPages } from '@/lib/utils/storage';
import { useRouter } from 'next/navigation';

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/* ─── Widget: Greeting ──────────────────────── */
function GreetingWidget({ greeting, welcomeMessage, onGreetingChange, onWelcomeChange }: { greeting: string; welcomeMessage: string; onGreetingChange: (id: string, content: string) => void; onWelcomeChange: (id: string, content: string) => void }) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <div className="">
        <EditableSpan
          id="greeting-text"
          content={greeting}
          onContentChange={onGreetingChange}
          className="text-[36px] font-bold leading-tight mb-1 block"
          style={{ color: 'var(--text-primary)' }}
        />
        <EditableSpan
          id="welcome-message"
          content={welcomeMessage}
          onContentChange={onWelcomeChange}
          className="text-base block"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Widget: Shortcut Hint ─────────────────── */
function ShortcutHintWidget({ hint, onHintChange }: { hint: string; onHintChange: (id: string, content: string) => void }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2 text-xs"
      style={{ color: 'var(--text-muted)' }}
    >
      <EditableSpan
        id="shortcut-hint"
        content={hint}
        onContentChange={onHintChange}
        style={{ color: 'var(--text-muted)' }}
      />
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────── */
const DEFAULT_STATIC_CONTENT = {
  'greeting-text': 'Welcome',
  'welcome-message': 'Start customizing your page by adding text widgets.',
  'shortcut-hint': 'Press <kbd style="background-color: var(--bg-hover); border: 1px solid var(--border-default); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace;">⌘ K</kbd> to open the command menu',
};

export default function CustomPage({ params }: { params: Promise<{ pageId: string }> }) {
  const router = useRouter();
  const { pageId } = use(params);
  const [pageName, setPageName] = useState('');
  const { 
    layout, 
    textWidgets, 
    staticContent, 
    hiddenWidgets, 
    moveWidget, 
    resizeWidget, 
    addTextWidget,
    addCalendarWidget,
    addDailyEventsWidget, 
    updateTextWidget, 
    updateStaticContent, 
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

  const currentGreeting = staticContent['greeting-text'] || DEFAULT_STATIC_CONTENT['greeting-text'];
  const welcomeMessage = staticContent['welcome-message'] || DEFAULT_STATIC_CONTENT['welcome-message'];
  const shortcutHint = staticContent['shortcut-hint'] || DEFAULT_STATIC_CONTENT['shortcut-hint'];

  // Build dynamic widgets from textWidgets
  const dynamicWidgets = useMemo(() => {
    return Object.entries(textWidgets).map(([widgetId, text]) => ({
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
  }, [textWidgets, updateTextWidget, deleteWidget]);

  const STATIC_WIDGETS = useMemo(() => [
    {
      id: 'greeting',
      content: (
        <GreetingWidget
          greeting={currentGreeting}
          welcomeMessage={welcomeMessage}
          onGreetingChange={updateStaticContent}
          onWelcomeChange={updateStaticContent}
        />
      ),
    },
    {
      id: 'shortcutHint',
      content: (
        <ShortcutHintWidget
          hint={shortcutHint}
          onHintChange={updateStaticContent}
        />
      ),
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
  ], [currentGreeting, welcomeMessage, shortcutHint, updateStaticContent, deleteWidget]);

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
