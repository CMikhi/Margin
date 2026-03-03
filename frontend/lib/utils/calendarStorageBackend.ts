import { CalendarEvent } from "@/lib/types";
import { useAuth } from "../hooks/useAuth";
import { useCalendarEvents } from "../hooks/useApiData";

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const EVENTS_STORAGE_KEY = "margin-calendar-events";
const RECENT_COLORS_KEY = "margin-recent-colors";

// ─── Event Colors ──────────────────────────────────────────────────────────────
export const EVENT_COLORS = [
  { name: "Red", value: "#A41623" },
  { name: "Orange", value: "#F85E00" },
  { name: "Sand", value: "#FFB563" },
  { name: "Appricot", value: "#FFD29D" },
  { name: "Olive", value: "#918450" },
  { name: "Sage", value: "#C9CBA3" },
  { name: "Coral", value: "#E26D5C" },
  { name: "Plum", value: "#723D46" },
];

// ─── Legacy localStorage functions (for fallback) ────────────────────────────
export function loadEventsFromLocal(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveEventsToLocal(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

// ─── Hybrid hook for calendar events ──────────────────────────────────────────
export function useCalendarStorage() {
  const { isAuthenticated } = useAuth();
  const {
    events: backendEvents,
    loading,
    createEvent: createBackendEvent,
    updateEvent: updateBackendEvent,
    deleteEvent: deleteBackendEvent,
    fetchEvents,
  } = useCalendarEvents();

  // Transform backend events to local format if needed
  const transformToLocal = (event: any): CalendarEvent => {
    // Safety checks for required fields - backend uses startAt/endAt
    if (!event.startAt || !event.endAt) {
      console.error("Calendar event missing startAt/endAt date:", event);
      // Return a default event to prevent crashes
      return {
        id: event.id || `error-${Date.now()}`,
        title: event.title || "Invalid Event",
        startDate: formatDateKey(new Date()),
        endDate: formatDateKey(new Date()),
        time: "all-day",
        description: event.description || "",
        color: "#A41623",
      };
    }

    return {
      id: event.id,
      title: event.title,
      startDate: event.startAt.split("T")[0], // Extract date from ISO string
      endDate: event.endAt.split("T")[0],
      time: event.allDay
        ? "all-day"
        : event.startAt.split("T")[1]?.slice(0, 5) || "09:00",
      description: event.description || "",
      color: "#A41623", // Default color, could be extended
    };
  };

  // Transform local events to backend format
  const transformToBackend = (event: CalendarEvent) => {
    const isAllDay = event.time === "all-day";
    let startAt: string;
    let endAt: string;

    if (isAllDay) {
      startAt = `${event.startDate}T00:00:00`;
      endAt = `${event.endDate}T23:59:59`;
    } else {
      startAt = `${event.startDate}T${event.time}:00`;
      // If single day event, end same day
      endAt =
        event.startDate === event.endDate
          ? `${event.endDate}T${event.time}:00`
          : `${event.endDate}T${event.time}:00`;
    }

    return {
      title: event.title,
      description: event.description,
      startAt, // Backend expects startAt not start
      endAt, // Backend expects endAt not end
      allDay: isAllDay,
    };
  };

  const loadEvents = (): CalendarEvent[] => {
    if (isAuthenticated && backendEvents) {
      return backendEvents.map(transformToLocal);
    }
    return loadEventsFromLocal();
  };

  const saveEvents = async (events: CalendarEvent[]): Promise<void> => {
    // Always save to localStorage as backup
    saveEventsToLocal(events);

    if (isAuthenticated) {
      // For authenticated users, we don't bulk save all events
      // Instead, individual operations (create/update/delete) should be used
      console.log(
        "Use individual create/update/delete operations for backend sync",
      );
    }
  };

  const createEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
    if (isAuthenticated) {
      const backendEvent = transformToBackend(event);
      const created = await createBackendEvent(backendEvent);
      return transformToLocal(created);
    } else {
      // Local storage fallback
      const events = loadEventsFromLocal();
      const newEvent = { ...event, id: `local-${Date.now()}` };
      events.push(newEvent);
      saveEventsToLocal(events);
      return newEvent;
    }
  };

  const updateEvent = async (
    eventId: string,
    updates: Partial<CalendarEvent>,
  ): Promise<CalendarEvent> => {
    if (isAuthenticated && !eventId.startsWith("local-")) {
      // Find the original event to merge updates
      const originalEvent = backendEvents?.find((e) => e.id === eventId);
      if (originalEvent) {
        const localEvent = transformToLocal(originalEvent);
        const updatedEvent = { ...localEvent, ...updates };
        const backendUpdate = transformToBackend(updatedEvent);
        const updated = await updateBackendEvent(eventId, backendUpdate);
        return transformToLocal(updated);
      }
    }

    // Local storage fallback
    const events = loadEventsFromLocal();
    const index = events.findIndex((e) => e.id === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      saveEventsToLocal(events);
      return events[index];
    }
    throw new Error("Event not found");
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    if (isAuthenticated && !eventId.startsWith("local-")) {
      await deleteBackendEvent(eventId);
    } else {
      // Local storage fallback
      const events = loadEventsFromLocal();
      const filtered = events.filter((e) => e.id !== eventId);
      saveEventsToLocal(filtered);
    }
  };

  const refreshEvents = async (start?: string, end?: string) => {
    if (isAuthenticated) {
      await fetchEvents(start, end);
    }
  };

  return {
    events: loadEvents(),
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    saveEvents,
    refreshEvents,
  };
}

// ─── Recent Colors Storage ─────────────────────────────────────────────────────
export function loadRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentColors(colors: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors.slice(0, 8)));
  } catch {
    // ignore
  }
}

// ─── Date Utilities ────────────────────────────────────────────────────────────
export function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function parseDate(dateKey: string): Date {
  if (!dateKey || typeof dateKey !== "string") {
    console.error("Invalid dateKey provided to parseDate:", dateKey);
    return new Date(); // Return current date as fallback
  }

  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    console.error("Invalid date format in parseDate:", dateKey);
    return new Date(); // Return current date as fallback
  }

  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error("Invalid date values in parseDate:", dateKey);
    return new Date(); // Return current date as fallback
  }

  return new Date(year, month - 1, day);
}

export function getDaysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getEventsForDay(
  events: CalendarEvent[],
  dateKey: string,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventDays = getDaysBetween(event.startDate, event.endDate);
    return eventDays.includes(dateKey);
  });
}

// Legacy functions for backward compatibility
export const loadEvents = loadEventsFromLocal;
export const saveEvents = saveEventsToLocal;
