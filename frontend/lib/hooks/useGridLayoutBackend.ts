import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { useWidgets } from "./useApiData";

export interface WidgetPosition {
  col: number; // 0-based column index
  row: number; // 0-based row index
  colSpan: number;
  rowSpan: number;
  zIndex: number; // layering order (higher = on top)
}

export interface WidgetLayout {
  [widgetId: string]: WidgetPosition;
}

export interface BackendWidget {
  id: string;
  type:
    | "text"
    | "image"
    | "calendar"
    | "dailyEvents"
    | "stickyDrawing"
    | "canvas";
  position: WidgetPosition;
  content: string;
  pageId?: string;
}

export interface TextWidget {
  id: string;
  text: string;
}

export interface TextWidgetsMap {
  [widgetId: string]: string; // widgetId -> text content
}

export interface ImageWidgetsMap {
  [widgetId: string]: string; // widgetId -> image src (base64)
}

export interface CanvasWidgetsMap {
  [widgetId: string]: string; // widgetId -> serialised Fabric JSON
}

export const GRID_COLS = 8;
export const GRID_ROWS = 8;

// ─── Page-specific defaults ────────────────────────────────────
const HOME_DEFAULT_WELCOME_HTML = `<h1>Margin</h1><h2>Welcome to Margin!</h2><p>This is a all-in-one platform that allows users to keep notes and ideas in a centerlized platform that is both functional and customizable.</p><hr><h2>Defining Features</h2><p>Besides just adding text, there's much more you can do to customize your individualized pages. Some of this being:</p><ul><li><p>Movable components</p></li><li><p>Resizable components</p></li></ul><p>The customizability will only grow, with the current options built basde on demand. Every aspect on the page is referred to as a "widget". If you hold the drag handle at the top of the currently selected widget, it will allow you to drag the widget around. While you're dragging the widget, the website's snap-grid will appear, showing you the options for placement. If you want to expand the size of the widget, you can hold down the bottom-right corner and drag the widget to the dimensions you are happy with.</p><hr><h2>Adding Widgets</h2><p>You can add widgets by clicking "CMD+k" for Mac and "CTR+k" for Windows to open the tool and navigation menu. This menu allows you to quickly jump between different pages by searching it up, or to add new widget of your choice.</p><p>The current widgets that Margin has includes:</p><ul><li><p>Text boxes</p></li><li><p>Images</p></li><li><p>Calendar</p></li><li><p>Daily events (Add-on to the calendar)</p></li></ul><p>The types of widgets are still expanding and any feedback is greatly appreciated!</p>`;

function getDefaultLayout(pageId?: string): WidgetLayout {
  if (pageId === "calendar-page") {
    return {
      calendar: { col: 0, row: 0, colSpan: 8, rowSpan: 8, zIndex: 0 },
    };
  }
  if (pageId) {
    return {
      welcome: { col: 1, row: 1, colSpan: 6, rowSpan: 4, zIndex: 0 },
    };
  }
  // Home page
  return {
    "image-default-cat": { col: 0, row: 0, colSpan: 1, rowSpan: 2, zIndex: 0 },
    quickLinks: { col: 0, row: 2, colSpan: 1, rowSpan: 2, zIndex: 1 },
    "text-default-welcome": {
      col: 1,
      row: 0,
      colSpan: 6,
      rowSpan: 8,
      zIndex: 2,
    },
    "image-default-bookmark": {
      col: 7,
      row: 0,
      colSpan: 1,
      rowSpan: 8,
      zIndex: 3,
    },
  };
}

function getDefaultTextWidgets(pageId?: string): TextWidgetsMap {
  if (pageId) return {};
  return {
    "text-default-welcome": HOME_DEFAULT_WELCOME_HTML,
  };
}

function getDefaultImageWidgets(pageId?: string): ImageWidgetsMap {
  if (pageId) return {};
  return {
    "image-default-cat": "/default-cat.jpg",
    "image-default-bookmark": "/default-bears.jpg",
  };
}

function getDefaultHiddenWidgets(pageId?: string): string[] {
  if (pageId === "calendar-page") {
    return ["dailyEvents"];
  }
  if (pageId) {
    return ["calendar", "dailyEvents"];
  }
  // Home page: hide greeting, shortcutHint, calendar, dailyEvents
  return ["greeting", "shortcutHint", "calendar", "dailyEvents"];
}

// Transform backend widgets to local layout format
function backendWidgetsToLayout(widgets: any[]): {
  layout: WidgetLayout;
  textWidgets: TextWidgetsMap;
  imageWidgets: ImageWidgetsMap;
  canvasWidgets: CanvasWidgetsMap;
} {
  const layout: WidgetLayout = {};
  const textWidgets: TextWidgetsMap = {};
  const imageWidgets: ImageWidgetsMap = {};
  const canvasWidgets: CanvasWidgetsMap = {};

  widgets.forEach((widget) => {
    const id = widget.widgetKey;

    // Transform from backend format (x,y,width,height) to local format (col,row,colSpan,rowSpan)
    layout[id] = {
      col: widget.x,
      row: widget.y,
      colSpan: widget.width,
      rowSpan: widget.height,
      zIndex: widget.zIndex || 0,
    };

    // Extract content from config
    const config = widget.config || {};
    const type = config.type;
    const content = config.content || "";

    switch (type) {
      case "text":
        // Check if it's the special quickLinks widget
        if (content === "QUICKLINKS_WIDGET") {
          // Don't add to textWidgets, it will be handled specially
          break;
        }
        textWidgets[id] = content;
        break;
      case "image":
        imageWidgets[id] = content;
        break;
      case "stickyDrawing":
      case "canvas":
        canvasWidgets[id] = content;
        break;
    }
  });

  return { layout, textWidgets, imageWidgets, canvasWidgets };
}

// Transform local layout to backend widgets format
function layoutToBackendWidgets(
  layout: WidgetLayout,
  textWidgets: TextWidgetsMap,
  imageWidgets: ImageWidgetsMap,
  canvasWidgets: CanvasWidgetsMap,
  pageId?: string,
): any[] {
  const widgets: any[] = [];

  Object.entries(layout).forEach(([id, position]) => {
    let type: BackendWidget["type"] = "text";
    let content = "";

    if (
      id.startsWith("text-") ||
      id === "welcome" ||
      id === "text-default-welcome"
    ) {
      type = "text";
      content = textWidgets[id] || "";
    } else if (
      id.startsWith("image-") ||
      id === "image-default-cat" ||
      id === "image-default-bookmark"
    ) {
      type = "image";
      content = imageWidgets[id] || "";
    } else if (id.startsWith("sticky-drawing-")) {
      type = "stickyDrawing";
      content = canvasWidgets[id] || "";
    } else if (id.startsWith("canvas-")) {
      type = "canvas";
      content = canvasWidgets[id] || "";
    } else if (id === "calendar") {
      type = "calendar";
      content = "";
    } else if (id === "dailyEvents") {
      type = "dailyEvents";
      content = "";
    } else if (id === "quickLinks") {
      type = "text"; // Store as text type with special marker
      content = "QUICKLINKS_WIDGET";
    }

    // Transform to WidgetPlacementDto format
    widgets.push({
      widgetKey: id.substring(0, 255), // Ensure max 255 chars
      x: Math.round(position.col), // Convert to integer
      y: Math.round(position.row), // Convert to integer
      width: Math.max(1, Math.round(position.colSpan)), // Ensure min 1
      height: Math.max(1, Math.round(position.rowSpan)), // Ensure min 1
      zIndex: position.zIndex,
      config: {
        type,
        content,
        pageId,
      },
    });
  });

  return widgets;
}

// Legacy localStorage functions for fallback
function getStorageKey(baseKey: string, pageId?: string): string {
  return pageId ? `${baseKey}-${pageId}` : baseKey;
}

function loadLayout(pageId?: string): WidgetLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(
      getStorageKey("margin-grid-layout", pageId),
    );
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLayout(layout: WidgetLayout, pageId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey("margin-grid-layout", pageId),
      JSON.stringify(layout),
    );
  } catch {
    // ignore
  }
}

// Similar functions for other widget types...
function loadTextWidgets(pageId?: string): TextWidgetsMap | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(
      getStorageKey("margin-text-widgets", pageId),
    );
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveTextWidgets(textWidgets: TextWidgetsMap, pageId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey("margin-text-widgets", pageId),
      JSON.stringify(textWidgets),
    );
  } catch {
    // ignore
  }
}

function loadImageWidgets(pageId?: string): ImageWidgetsMap | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(
      getStorageKey("margin-image-widgets", pageId),
    );
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveImageWidgets(
  imageWidgets: ImageWidgetsMap,
  pageId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey("margin-image-widgets", pageId),
      JSON.stringify(imageWidgets),
    );
  } catch {
    // ignore
  }
}

function loadCanvasWidgets(pageId?: string): CanvasWidgetsMap | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(
      getStorageKey("margin-canvas-widgets", pageId),
    );
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveCanvasWidgets(
  canvasWidgets: CanvasWidgetsMap,
  pageId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey("margin-canvas-widgets", pageId),
      JSON.stringify(canvasWidgets),
    );
  } catch {
    // ignore
  }
}

/**
 * Check if a position would overlap with any other widget (excluding the one being moved)
 */
function hasOverlap(
  layout: WidgetLayout,
  widgetId: string,
  pos: WidgetPosition,
): boolean {
  for (const [id, other] of Object.entries(layout)) {
    if (id === widgetId) continue;

    const aLeft = pos.col;
    const aRight = pos.col + pos.colSpan;
    const aTop = pos.row;
    const aBottom = pos.row + pos.rowSpan;

    const bLeft = other.col;
    const bRight = other.col + other.colSpan;
    const bTop = other.row;
    const bBottom = other.row + other.rowSpan;

    if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
      return true;
    }
  }
  return false;
}

/**
 * Clamp a widget position to stay within the grid bounds
 */
function clampPosition(pos: WidgetPosition): WidgetPosition {
  return {
    ...pos,
    col: Math.max(0, Math.min(pos.col, GRID_COLS - pos.colSpan)),
    row: Math.max(0, Math.min(pos.row, GRID_ROWS - pos.rowSpan)),
  };
}

/**
 * Find an empty spot in the grid for a new widget
 */
function findEmptySpot(
  layout: WidgetLayout,
  colSpan: number,
  rowSpan: number,
): { col: number; row: number } | null {
  for (let row = 0; row <= GRID_ROWS - rowSpan; row++) {
    for (let col = 0; col <= GRID_COLS - colSpan; col++) {
      const testPos: WidgetPosition = { col, row, colSpan, rowSpan, zIndex: 0 };
      if (!hasOverlap(layout, "__test__", testPos)) {
        return { col, row };
      }
    }
  }
  return null;
}

export function useGridLayoutBackend(pageId?: string) {
  const { isAuthenticated } = useAuth();
  const { widgets, loading: backendLoading, updateWidgets } = useWidgets();

  const [layout, setLayout] = useState<WidgetLayout>(() =>
    getDefaultLayout(pageId),
  );
  const [textWidgets, setTextWidgets] = useState<TextWidgetsMap>(() =>
    getDefaultTextWidgets(pageId),
  );
  const [imageWidgets, setImageWidgets] = useState<ImageWidgetsMap>(() =>
    getDefaultImageWidgets(pageId),
  );
  const [staticContent, setStaticContent] = useState<TextWidgetsMap>({});
  const [canvasWidgets, setCanvasWidgets] = useState<CanvasWidgetsMap>({});
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(
    () => new Set(getDefaultHiddenWidgets(pageId)),
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  // Optimization: Track data changes and page visibility for smart syncing
  const lastSyncDataRef = useRef<string>("");
  const isPageVisibleRef = useRef(
    typeof document !== "undefined" ? !document.hidden : true,
  );
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef(Date.now());

  // Track page visibility for sync optimization
  useEffect(() => {
    if (typeof document === "undefined") return; // SSR guard

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const wasVisible = isPageVisibleRef.current;
      isPageVisibleRef.current = isVisible;

      if (!wasVisible && isVisible && pendingSync) {
        // Page became visible and we have pending changes
        console.log("📱 Page visible again - syncing pending changes");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pendingSync]);

  // Load data on mount - prefer backend, fallback to localStorage
  useEffect(() => {
    if (isAuthenticated && !backendLoading && widgets) {
      // Load from backend
      const pageWidgets = widgets.filter(
        (w: any) =>
          w.config?.pageId === pageId || (!w.config?.pageId && !pageId),
      );
      if (pageWidgets.length > 0) {
        const { layout, textWidgets, imageWidgets, canvasWidgets } =
          backendWidgetsToLayout(pageWidgets);

        // Get default layout but exclude items that exist in backend layout
        const defaultLayout = getDefaultLayout(pageId);
        const mergedLayout = { ...defaultLayout };

        // Remove default entries that exist in backend layout to prevent duplicates
        Object.keys(layout).forEach((key) => {
          delete mergedLayout[key];
        });

        setLayout({ ...mergedLayout, ...layout });
        setTextWidgets({ ...getDefaultTextWidgets(pageId), ...textWidgets });
        setImageWidgets({ ...getDefaultImageWidgets(pageId), ...imageWidgets });
        setCanvasWidgets(canvasWidgets);
        setIsLoaded(true);
        return;
      }
    }

    if (!isAuthenticated || !isLoaded) {
      // Load from localStorage
      const defaults = getDefaultLayout(pageId);
      const storedLayout = loadLayout(pageId);
      const storedText = loadTextWidgets(pageId);
      const storedImages = loadImageWidgets(pageId);
      const storedCanvas = loadCanvasWidgets(pageId);

      if (storedLayout) {
        // Migrate old layouts that don't have zIndex
        const migratedLayout: WidgetLayout = {};
        let nextZIndex = 0;
        for (const [id, pos] of Object.entries(storedLayout)) {
          migratedLayout[id] = {
            ...pos,
            zIndex: pos.zIndex ?? nextZIndex++,
          };
        }
        setLayout(migratedLayout);
      } else {
        setLayout(defaults);
      }

      if (storedText) {
        setTextWidgets(storedText);
      } else {
        setTextWidgets(getDefaultTextWidgets(pageId));
      }

      if (storedImages) {
        setImageWidgets(storedImages);
      } else {
        setImageWidgets(getDefaultImageWidgets(pageId));
      }

      if (storedCanvas) {
        setCanvasWidgets(storedCanvas);
      }

      // Load hidden widgets or use defaults
      const hiddenData = localStorage.getItem(
        getStorageKey("margin-hidden-widgets", pageId),
      );
      if (hiddenData) {
        try {
          setHiddenWidgets(new Set(JSON.parse(hiddenData)));
        } catch (e) {
          console.error("Failed to load hidden widgets", e);
          setHiddenWidgets(new Set(getDefaultHiddenWidgets(pageId)));
        }
      } else {
        setHiddenWidgets(new Set(getDefaultHiddenWidgets(pageId)));
      }

      setIsLoaded(true);
    }
  }, [pageId, isAuthenticated, widgets, backendLoading]);

  // Optimized sync to backend with change detection and visibility awareness
  useEffect(() => {
    if (!isLoaded || !isAuthenticated || pendingSync) return;

    // Create a hash of current data for change detection
    const currentDataHash = JSON.stringify({
      layout,
      textWidgets,
      imageWidgets,
      canvasWidgets,
      pageId,
    });

    // Skip if data hasn't actually changed
    if (lastSyncDataRef.current === currentDataHash) {
      return;
    }

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Determine sync delay based on page visibility and time since last sync
    const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
    const isPageVisible = isPageVisibleRef.current;

    let syncDelay: number;
    if (!isPageVisible) {
      // Page not visible - sync less frequently, but don't exceed 5 minutes between syncs
      const maxHiddenInterval = 300000; // 5 minutes
      const minHiddenDelay = 5000; // at least 5s debounce

      const timeUntilMax = maxHiddenInterval - timeSinceLastSync;
      syncDelay = Math.max(
        minHiddenDelay,
        Math.min(maxHiddenInterval, timeUntilMax),
      );
      console.log("📴 Page not visible - delaying sync", { syncDelay });
    } else if (timeSinceLastSync < 5000) {
      // Recent sync - use normal debounce
      syncDelay = 1500;
    } else {
      // Long time since last sync - sync immediately
      syncDelay = 100;
    }

    syncTimeoutRef.current = setTimeout(async () => {
      // Double-check page visibility at sync time
      if (!isPageVisibleRef.current && timeSinceLastSync < 30000) {
        console.log(
          "📴 Skipping sync - page not visible and recent sync exists",
        );
        return;
      }

      setPendingSync(true);

      try {
        console.log("🔄 Syncing widgets to backend...");
        const backendWidgets = layoutToBackendWidgets(
          layout,
          textWidgets,
          imageWidgets,
          canvasWidgets,
          pageId,
        );

        await updateWidgets(backendWidgets);
        lastSyncDataRef.current = currentDataHash;
        lastSyncTimeRef.current = Date.now();
        console.log("✅ Widgets synced successfully");
      } catch (error) {
        console.error("❌ Failed to sync widgets to backend:", error);
        // Don't update lastSyncDataRef on error so we retry later
      } finally {
        setPendingSync(false);
      }
    }, syncDelay);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    layout,
    textWidgets,
    imageWidgets,
    canvasWidgets,
    isLoaded,
    isAuthenticated,
    pageId,
    updateWidgets,
    pendingSync,
  ]);

  // Always persist to localStorage as backup
  useEffect(() => {
    if (isLoaded) {
      saveLayout(layout, pageId);
      saveTextWidgets(textWidgets, pageId);
      saveImageWidgets(imageWidgets, pageId);
      saveCanvasWidgets(canvasWidgets, pageId);
    }
  }, [layout, textWidgets, imageWidgets, canvasWidgets, isLoaded, pageId]);

  // All the same methods as original useGridLayout...
  const bringToFront = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const widget = prev[widgetId];
      if (!widget) return prev;

      // Get all z-indices sorted
      const allZIndices = Object.values(prev)
        .map((pos) => pos.zIndex)
        .sort((a, b) => a - b);
      const uniqueZIndices = [...new Set(allZIndices)];

      // Find the next higher z-index
      const nextHigherZ = uniqueZIndices.find((z) => z > widget.zIndex);

      // If no higher layer exists, widget is already on top
      if (nextHigherZ === undefined) return prev;

      // Find the widget(s) at the next higher layer and swap z-indices
      const newLayout = { ...prev };
      for (const [id, pos] of Object.entries(prev)) {
        if (id === widgetId) {
          newLayout[id] = { ...pos, zIndex: nextHigherZ };
        } else if (pos.zIndex === nextHigherZ) {
          newLayout[id] = { ...pos, zIndex: widget.zIndex };
        }
      }

      return newLayout;
    });
  }, []);

  const sendToBack = useCallback((widgetId: string) => {
    setLayout((prev) => {
      const widget = prev[widgetId];
      if (!widget) return prev;

      // Get all z-indices sorted
      const allZIndices = Object.values(prev)
        .map((pos) => pos.zIndex)
        .sort((a, b) => a - b);
      const uniqueZIndices = [...new Set(allZIndices)];

      // Find the next lower z-index
      const nextLowerZ = [...uniqueZIndices]
        .reverse()
        .find((z) => z < widget.zIndex);

      // If no lower layer exists, widget is already at bottom
      if (nextLowerZ === undefined) return prev;

      // Find the widget(s) at the next lower layer and swap z-indices
      const newLayout = { ...prev };
      for (const [id, pos] of Object.entries(prev)) {
        if (id === widgetId) {
          newLayout[id] = { ...pos, zIndex: nextLowerZ };
        } else if (pos.zIndex === nextLowerZ) {
          newLayout[id] = { ...pos, zIndex: widget.zIndex };
        }
      }

      return newLayout;
    });
  }, []);

  const moveWidget = useCallback(
    (widgetId: string, newCol: number, newRow: number) => {
      setLayout((prev) => {
        const widget = prev[widgetId];
        if (!widget) return prev;

        const newPos = clampPosition({
          ...widget,
          col: newCol,
          row: newRow,
        });

        // Allow move even if it overlaps with other widgets
        return { ...prev, [widgetId]: newPos };
      });
    },
    [],
  );

  const resizeWidget = useCallback(
    (widgetId: string, newColSpan: number, newRowSpan: number) => {
      setLayout((prev) => {
        const widget = prev[widgetId];
        if (!widget) return prev;

        // Enforce minimum 1×1
        const colSpan = Math.max(
          1,
          Math.min(newColSpan, GRID_COLS - widget.col),
        );
        const rowSpan = Math.max(
          1,
          Math.min(newRowSpan, GRID_ROWS - widget.row),
        );

        const newPos: WidgetPosition = { ...widget, colSpan, rowSpan };

        // Allow resize even if it overlaps with other widgets
        return { ...prev, [widgetId]: newPos };
      });
    },
    [],
  );

  const addTextWidget = useCallback(() => {
    const widgetId = `text-${Date.now()}`;
    const spot = findEmptySpot(layout, 3, 2);
    const maxZ = Math.max(0, ...Object.values(layout).map((pos) => pos.zIndex));

    if (!spot) {
      // Grid is full, place at 0,0 anyway (will overlap)
      setLayout((prev) => ({
        ...prev,
        [widgetId]: {
          col: 0,
          row: 0,
          colSpan: 3,
          rowSpan: 2,
          zIndex: maxZ + 1,
        },
      }));
    } else {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: { ...spot, colSpan: 3, rowSpan: 2, zIndex: maxZ + 1 },
      }));
    }

    setTextWidgets((prev) => ({ ...prev, [widgetId]: "Click to edit..." }));
    return widgetId;
  }, [layout]);

  const addCalendarWidget = useCallback(() => {
    const widgetId = "calendar";
    // Remove from hidden widgets if it was hidden
    setHiddenWidgets((prev) => {
      const newHidden = new Set(prev);
      newHidden.delete(widgetId);
      localStorage.setItem(
        getStorageKey("margin-hidden-widgets", pageId),
        JSON.stringify([...newHidden]),
      );
      return newHidden;
    });

    // If not in layout, add it
    if (!layout[widgetId]) {
      const spot = findEmptySpot(layout, 6, 6);
      const maxZ = Math.max(
        0,
        ...Object.values(layout).map((pos) => pos.zIndex),
      );
      if (!spot) {
        setLayout((prev) => ({
          ...prev,
          [widgetId]: {
            col: 0,
            row: 0,
            colSpan: 6,
            rowSpan: 6,
            zIndex: maxZ + 1,
          },
        }));
      } else {
        setLayout((prev) => ({
          ...prev,
          [widgetId]: { ...spot, colSpan: 6, rowSpan: 6, zIndex: maxZ + 1 },
        }));
      }
    }

    return widgetId;
  }, [layout, pageId]);

  const addDailyEventsWidget = useCallback(() => {
    const widgetId = "dailyEvents";
    // Remove from hidden widgets if it was hidden
    setHiddenWidgets((prev) => {
      const newHidden = new Set(prev);
      newHidden.delete(widgetId);
      localStorage.setItem(
        getStorageKey("margin-hidden-widgets", pageId),
        JSON.stringify([...newHidden]),
      );
      return newHidden;
    });

    // If not in layout, add it
    if (!layout[widgetId]) {
      const spot = findEmptySpot(layout, 3, 4);
      const maxZ = Math.max(
        0,
        ...Object.values(layout).map((pos) => pos.zIndex),
      );
      if (!spot) {
        setLayout((prev) => ({
          ...prev,
          [widgetId]: {
            col: 0,
            row: 0,
            colSpan: 3,
            rowSpan: 4,
            zIndex: maxZ + 1,
          },
        }));
      } else {
        setLayout((prev) => ({
          ...prev,
          [widgetId]: { ...spot, colSpan: 3, rowSpan: 4, zIndex: maxZ + 1 },
        }));
      }
    }

    return widgetId;
  }, [layout, pageId]);

  const addImageWidget = useCallback(() => {
    const widgetId = `image-${Date.now()}`;
    const spot = findEmptySpot(layout, 2, 2);
    const maxZ = Math.max(0, ...Object.values(layout).map((pos) => pos.zIndex));

    if (!spot) {
      // Grid is full, place at 0,0 anyway (will overlap)
      setLayout((prev) => ({
        ...prev,
        [widgetId]: {
          col: 0,
          row: 0,
          colSpan: 2,
          rowSpan: 2,
          zIndex: maxZ + 1,
        },
      }));
    } else {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: { ...spot, colSpan: 2, rowSpan: 2, zIndex: maxZ + 1 },
      }));
    }

    setImageWidgets((prev) => ({ ...prev, [widgetId]: "" }));
    return widgetId;
  }, [layout]);

  const updateTextWidget = useCallback((widgetId: string, text: string) => {
    setTextWidgets((prev) => ({ ...prev, [widgetId]: text }));
  }, []);

  const updateStaticContent = useCallback(
    (widgetId: string, content: string) => {
      setStaticContent((prev) => ({ ...prev, [widgetId]: content }));
    },
    [],
  );

  const updateImageWidget = useCallback(
    (widgetId: string, imageSrc: string) => {
      setImageWidgets((prev) => ({ ...prev, [widgetId]: imageSrc }));
    },
    [],
  );

  const updateCanvasWidget = useCallback((widgetId: string, json: string) => {
    setCanvasWidgets((prev) => ({ ...prev, [widgetId]: json }));
  }, []);

  const addStickyDrawing = useCallback(() => {
    const widgetId = `sticky-drawing-${Date.now()}`;
    const spot = findEmptySpot(layout, 2, 2);
    const maxZ = Math.max(0, ...Object.values(layout).map((pos) => pos.zIndex));

    if (!spot) {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: {
          col: 0,
          row: 0,
          colSpan: 2,
          rowSpan: 2,
          zIndex: maxZ + 1,
        },
      }));
    } else {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: { ...spot, colSpan: 2, rowSpan: 2, zIndex: maxZ + 1 },
      }));
    }
    setCanvasWidgets((prev) => ({ ...prev, [widgetId]: "" }));
    return widgetId;
  }, [layout]);

  const addFullCanvas = useCallback(() => {
    const widgetId = `canvas-${Date.now()}`;
    const spot = findEmptySpot(layout, 4, 4);
    const maxZ = Math.max(0, ...Object.values(layout).map((pos) => pos.zIndex));

    if (!spot) {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: {
          col: 0,
          row: 0,
          colSpan: 4,
          rowSpan: 4,
          zIndex: maxZ + 1,
        },
      }));
    } else {
      setLayout((prev) => ({
        ...prev,
        [widgetId]: { ...spot, colSpan: 4, rowSpan: 4, zIndex: maxZ + 1 },
      }));
    }
    setCanvasWidgets((prev) => ({ ...prev, [widgetId]: "" }));
    return widgetId;
  }, [layout]);

  const deleteWidget = useCallback(
    (widgetId: string) => {
      // If it's a text widget, remove from layout and textWidgets
      if (widgetId.startsWith("text-")) {
        setLayout((prev) => {
          const newLayout = { ...prev };
          delete newLayout[widgetId];
          return newLayout;
        });
        setTextWidgets((prev) => {
          const newText = { ...prev };
          delete newText[widgetId];
          return newText;
        });
      } else if (widgetId.startsWith("image-")) {
        // If it's an image widget, remove from layout and imageWidgets
        setLayout((prev) => {
          const newLayout = { ...prev };
          delete newLayout[widgetId];
          return newLayout;
        });
        setImageWidgets((prev) => {
          const newImages = { ...prev };
          delete newImages[widgetId];
          return newImages;
        });
      } else if (
        widgetId.startsWith("sticky-drawing-") ||
        widgetId.startsWith("canvas-")
      ) {
        // Canvas widgets — remove from layout and canvasWidgets
        setLayout((prev) => {
          const newLayout = { ...prev };
          delete newLayout[widgetId];
          return newLayout;
        });
        setCanvasWidgets((prev) => {
          const newCanvas = { ...prev };
          delete newCanvas[widgetId];
          return newCanvas;
        });
      } else {
        // For static widgets, add to hidden set
        setHiddenWidgets((prev) => {
          const newHidden = new Set(prev);
          newHidden.add(widgetId);
          localStorage.setItem(
            getStorageKey("margin-hidden-widgets", pageId),
            JSON.stringify([...newHidden]),
          );
          return newHidden;
        });
      }
    },
    [pageId],
  );

  const resetLayout = useCallback(() => {
    const defaultHidden = getDefaultHiddenWidgets(pageId);
    setLayout(getDefaultLayout(pageId));
    setTextWidgets(getDefaultTextWidgets(pageId));
    setImageWidgets(getDefaultImageWidgets(pageId));
    setCanvasWidgets({});
    setHiddenWidgets(new Set(defaultHidden));
    if (typeof window !== "undefined") {
      localStorage.setItem(
        getStorageKey("margin-hidden-widgets", pageId),
        JSON.stringify(defaultHidden),
      );
    }
  }, [pageId]);

  return {
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
    resetLayout,
    bringToFront,
    sendToBack,
    isLoaded,
    syncStatus: pendingSync ? "syncing" : "synced",
  };
}
