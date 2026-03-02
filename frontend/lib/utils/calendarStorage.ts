import { CalendarEvent } from '@/lib/types';

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const EVENTS_STORAGE_KEY = 'margin-calendar-events';
const RECENT_COLORS_KEY = 'margin-recent-colors';

// ─── Event Colors ──────────────────────────────────────────────────────────────
export const EVENT_COLORS = [
  { name: 'Red', value: '#A41623' },
  { name: 'Orange', value: '#F85E00' },
  { name: 'Sand', value: '#FFB563' },
  { name: 'Appricot', value: '#FFD29D' },
  { name: 'Olive', value: '#918450' },
  { name: 'Sage', value: '#C9CBA3' },
  { name: 'Coral', value: '#E26D5C' },
  { name: 'Plum', value: '#723D46' },
];

// ─── Events Storage ────────────────────────────────────────────────────────────
export function loadEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

// ─── Recent Colors Storage ─────────────────────────────────────────────────────
export function loadRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentColors(colors: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors.slice(0, 8)));
  } catch {
    // ignore
  }
}

// ─── Date Utilities ────────────────────────────────────────────────────────────
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
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

export function getEventsForDay(events: CalendarEvent[], dateKey: string): CalendarEvent[] {
  return events.filter(event => {
    const eventDays = getDaysBetween(event.startDate, event.endDate);
    return eventDays.includes(dateKey);
  });
}
