"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { DashboardGrid } from "@/components/DashboardGrid";
import { PageWithCommandMenu } from "@/components/PageWithCommandMenu";
import { EditableTextWidget } from "@/components/EditableTextWidget";
import { ImageWidget } from "@/components/ImageWidget";
import { CalendarWidget } from "@/components/CalendarWidget";
import { DailyEventsWidget } from "@/components/DailyEventsWidget";
import { StickyDrawingWidget } from "@/components/StickyDrawingWidget";
import { FullCanvasWidget } from "@/components/FullCanvasWidget";
import { EditableSpan } from "@/components/EditableSpan";
import { useGridLayoutBackend } from "@/lib/hooks/useGridLayoutBackend";

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/* ─── Widget: Greeting ──────────────────────── */
function GreetingWidget({
  greeting,
  welcomeMessage,
  onGreetingChange,
  onWelcomeChange,
}: {
  greeting: string;
  welcomeMessage: string;
  onGreetingChange: (id: string, content: string) => void;
  onWelcomeChange: (id: string, content: string) => void;
}) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <div className="">
        <EditableSpan
          id="greeting-text"
          content={greeting}
          onContentChange={onGreetingChange}
          className="text-[36px] font-bold leading-tight mb-1 block"
          style={{ color: "var(--text-primary)" }}
        />
        <EditableSpan
          id="welcome-message"
          content={welcomeMessage}
          onContentChange={onWelcomeChange}
          className="text-base block"
          style={{ color: "var(--text-secondary)" }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Widget: Quick Links ───────────────────── */
function QuickLinksWidget({
  title,
  onTitleChange,
}: {
  title: string;
  onTitleChange: (id: string, content: string) => void;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-1.5"
    >
      <h2
        className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
        style={{ color: "var(--text-muted)" }}
      >
        <EditableSpan
          id="quicklinks-title"
          content={title}
          onContentChange={onTitleChange}
          style={{ color: "var(--text-muted)" }}
        />
      </h2>

      <Link
        href="/calander"
        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-120"
        style={{ color: "var(--text-primary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-sm"
          style={{}}
        >
          📅
        </span>
        <div>
          <span className="text-sm font-medium">Calendar</span>
          <span
            className="block text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            View your month at a glance
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Widget: Shortcut Hint ─────────────────── */
function ShortcutHintWidget({
  hint,
  onHintChange,
}: {
  hint: string;
  onHintChange: (id: string, content: string) => void;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2 text-xs"
      style={{ color: "var(--text-muted)" }}
    >
      <EditableSpan
        id="shortcut-hint"
        content={hint}
        onContentChange={onHintChange}
        style={{ color: "var(--text-muted)" }}
      />
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────── */
const DEFAULT_STATIC_CONTENT = {
  "greeting-text": "Good morning",
  "welcome-message": "Welcome to Margin — your calm space for weekly focus.",
  "quicklinks-title": "Jump to",
  "shortcut-hint":
    'Press <kbd style="background-color: var(--bg-hover); border: 1px solid var(--border-default); padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace; margin-left: 2px; margin-right: 2px;">⌘ K</kbd> to open the command menu',
};

export default function Home() {
  const {
    layout,
    textWidgets,
    imageWidgets,
    canvasWidgets,
    staticContent,
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
    updateStaticContent,
    deleteWidget,
    bringToFront,
    sendToBack,
    resetLayout,
    isLoaded,
  } = useGridLayoutBackend();

  // Get initial greeting based on time if not already customized
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    if (
      !staticContent["greeting-text"] ||
      staticContent["greeting-text"] === "Good morning"
    ) {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    }
  }, [staticContent]);

  const currentGreeting = staticContent["greeting-text"] || greeting;
  const welcomeMessage =
    staticContent["welcome-message"] ||
    DEFAULT_STATIC_CONTENT["welcome-message"];
  const quicklinksTitle =
    staticContent["quicklinks-title"] ||
    DEFAULT_STATIC_CONTENT["quicklinks-title"];
  const shortcutHint =
    staticContent["shortcut-hint"] || DEFAULT_STATIC_CONTENT["shortcut-hint"];

  // Build dynamic widgets from textWidgets and imageWidgets
  const dynamicWidgets = useMemo(() => {
    const textWidgetsList = Object.entries(textWidgets).map(
      ([widgetId, text]) => ({
        id: widgetId,
        content: (
          <EditableTextWidget
            id={widgetId}
            text={text}
            onTextChange={updateTextWidget}
            onDelete={deleteWidget}
          />
        ),
      }),
    );

    const imageWidgetsList = Object.entries(imageWidgets).map(
      ([widgetId, imageSrc]) => ({
        id: widgetId,
        content: (
          <ImageWidget
            id={widgetId}
            imageSrc={imageSrc}
            onImageChange={updateImageWidget}
            onDelete={deleteWidget}
          />
        ),
      }),
    );

    const canvasWidgetsList = Object.entries(canvasWidgets).map(
      ([widgetId, data]) => ({
        id: widgetId,
        content: widgetId.startsWith("sticky-drawing-") ? (
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
      }),
    );

    // Handle special static widgets that are in the layout
    const specialWidgets: any[] = [];
    if (layout.quickLinks && !hiddenWidgets.has("quickLinks")) {
      specialWidgets.push({
        id: "quickLinks",
        content: (
          <QuickLinksWidget
            title={quicklinksTitle}
            onTitleChange={updateStaticContent}
          />
        ),
      });
    }

    return [
      ...textWidgetsList,
      ...imageWidgetsList,
      ...canvasWidgetsList,
      ...specialWidgets,
    ];
  }, [
    textWidgets,
    imageWidgets,
    canvasWidgets,
    layout,
    hiddenWidgets,
    quicklinksTitle,
    updateTextWidget,
    updateImageWidget,
    updateCanvasWidget,
    updateStaticContent,
    deleteWidget,
  ]);

  const STATIC_WIDGETS = useMemo(
    () => [
      {
        id: "greeting",
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
        id: "shortcutHint",
        content: (
          <ShortcutHintWidget
            hint={shortcutHint}
            onHintChange={updateStaticContent}
          />
        ),
      },
      {
        id: "calendar",
        minColSpan: 4,
        minRowSpan: 4,
        content: <CalendarWidget id="calendar" onDelete={deleteWidget} />,
      },
      {
        id: "dailyEvents",
        minColSpan: 2,
        minRowSpan: 3,
        content: <DailyEventsWidget id="dailyEvents" onDelete={deleteWidget} />,
      },
      // Note: quickLinks is handled in dynamicWidgets as a special widget
    ],
    [
      currentGreeting,
      welcomeMessage,
      shortcutHint,
      updateStaticContent,
      deleteWidget,
    ],
  );

  const allWidgets = useMemo(() => {
    // Filter out hidden static widgets
    const visibleStatic = STATIC_WIDGETS.filter(
      (w) => !hiddenWidgets.has(w.id),
    );
    return [...visibleStatic, ...dynamicWidgets];
  }, [STATIC_WIDGETS, dynamicWidgets, hiddenWidgets]);

  return (
    <PageWithCommandMenu
      pageTitle="🏠 Home"
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
        bringToFront={bringToFront}
        sendToBack={sendToBack}
        resetLayout={resetLayout}
        isLoaded={isLoaded}
      />
    </PageWithCommandMenu>
  );
}
