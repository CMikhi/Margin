'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  time: string;      // 'all-day' or specific time like '09:00'
  description: string;
  color: string;
}

interface DayInfo {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
  dateKey: string;
}

// ─── Event Colors ──────────────────────────────────────────────────────────────
const EVENT_COLORS = [
  { name: 'Red', value: '#A41623' },
  { name: 'Orange', value: '#F85E00' },
  { name: 'Sand', value: '#FFB563' },
  { name: 'Appricot', value: '#FFD29D' },
  { name: 'Olive', value: '#918450' },
  { name: 'Sage', value: '#C9CBA3' },
  { name: 'Coral', value: '#E26D5C' },
  { name: 'Plum', value: '#723D46' },
];

// ─── Storage ───────────────────────────────────────────────────────────────────
const EVENTS_STORAGE_KEY = 'margin-calendar-events';

function loadEvents(): CalendarEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

const RECENT_COLORS_KEY = 'margin-recent-colors';

function loadRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentColors(colors: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors.slice(0, 8)));
  } catch {
    // ignore
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDaysBetween(start: string, end: string): string[] {
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

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } },
};

export default function CalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Selection state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('all-day');
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value);
  const [customColor, setCustomColor] = useState('');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  // Event type tabs: single day vs multi-day
  const [eventType, setEventType] = useState<'single' | 'multi'>('single');
  const [multiStartDate, setMultiStartDate] = useState('');
  const [multiEndDate, setMultiEndDate] = useState('');
  
  // Editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Load events from localStorage
  useEffect(() => {
    const storedEvents = loadEvents();
    setEvents(storedEvents);
    const storedColors = loadRecentColors();
    setRecentColors(storedColors);
    setIsLoaded(true);
  }, []);

  // Save events when changed
  useEffect(() => {
    if (isLoaded) {
      saveEvents(events);
    }
  }, [events, isLoaded]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPopup(false);
        setSelectedDates([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Calculate calendar grid
  const calendarDays = useMemo((): DayInfo[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: DayInfo[] = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date,
        dateKey: formatDateKey(date)
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        date,
        dateKey: formatDateKey(date)
      });
    }
    
    // Next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        day: i,
        isCurrentMonth: false,
        date,
        dateKey: formatDateKey(date)
      });
    }
    
    return days;
  }, [currentDate]);

  // Get events for display, organized by row position
  const eventsByRow = useMemo(() => {
    const rows: Map<number, CalendarEvent[]> = new Map();
    const eventPositions: Map<string, number> = new Map();
    
    // Sort events by start date, then by duration (longer first)
    const sortedEvents = [...events].sort((a, b) => {
      const startDiff = a.startDate.localeCompare(b.startDate);
      if (startDiff !== 0) return startDiff;
      const aDuration = getDaysBetween(a.startDate, a.endDate).length;
      const bDuration = getDaysBetween(b.startDate, b.endDate).length;
      return bDuration - aDuration;
    });
    
    sortedEvents.forEach((event) => {
      // Find the first row where this event can fit
      let row = 0;
      while (true) {
        const rowEvents = rows.get(row) || [];
        const hasConflict = rowEvents.some((existing) => {
          const existingDays = getDaysBetween(existing.startDate, existing.endDate);
          const eventDays = getDaysBetween(event.startDate, event.endDate);
          return existingDays.some((d) => eventDays.includes(d));
        });
        
        if (!hasConflict) {
          rows.set(row, [...rowEvents, event]);
          eventPositions.set(event.id, row);
          break;
        }
        row++;
      }
    });
    
    return { rows, positions: eventPositions };
  }, [events]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Handle day click for selection
  const handleDayClick = useCallback((dateKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Single click opens popup for that day
    setEditingEventId(null);
    setSelectedDates([dateKey]);
    setMultiStartDate(dateKey);
    setMultiEndDate(dateKey);
    setEventType('single');
    
    // Calculate popup position ensuring it stays on screen
    const popupWidth = 320;
    const popupHeight = 600;
    const margin = 16;
    
    // Clamp position to keep popup fully visible
    const x = Math.max(margin, Math.min(e.clientX, window.innerWidth - popupWidth - margin));
    const y = Math.max(margin, Math.min(e.clientY, window.innerHeight - popupHeight - margin));
    
    setPopupPosition({ x, y });
    setShowPopup(true);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setEventTitle('');
    setEventTime('all-day');
    setEventDescription('');
    setEventColor(EVENT_COLORS[0].value);
    setCustomColor('');
    setEventType('single');
    setMultiStartDate('');
    setMultiEndDate('');
    setSelectedDates([]);
    setEditingEventId(null);
  }, []);

  // Open event for editing
  const handleEditEvent = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventTime(event.time);
    setEventDescription(event.description);
    
    // Check if it's a preset color or custom
    const isPreset = EVENT_COLORS.some(c => c.value === event.color);
    if (isPreset) {
      setEventColor(event.color);
      setCustomColor('');
    } else {
      setEventColor(EVENT_COLORS[0].value);
      setCustomColor(event.color);
    }
    
    // Set event type based on whether it spans multiple days
    if (event.startDate === event.endDate) {
      setEventType('single');
      setSelectedDates([event.startDate]);
    } else {
      setEventType('multi');
      setSelectedDates([]);
    }
    setMultiStartDate(event.startDate);
    setMultiEndDate(event.endDate);
    
    // Calculate popup position ensuring it stays on screen
    const popupWidth = 320;
    const popupHeight = 500;
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - 20;
    }
    if (y + popupHeight > window.innerHeight) {
      y = window.innerHeight - popupHeight - 20;
    }
    if (x < 20) x = 20;
    if (y < 20) y = 20;
    
    setPopupPosition({ x, y });
    setShowPopup(true);
  }, []);

  // Add event
  const handleAddEvent = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventTitle.trim()) return;
    
    // Determine start and end dates based on event type
    let startDate: string;
    let endDate: string;
    
    if (eventType === 'multi') {
      if (!multiStartDate || !multiEndDate) return;
      // Ensure start is before end
      startDate = multiStartDate <= multiEndDate ? multiStartDate : multiEndDate;
      endDate = multiStartDate <= multiEndDate ? multiEndDate : multiStartDate;
    } else {
      if (selectedDates.length === 0) return;
      startDate = selectedDates[0];
      endDate = selectedDates[0];
    }
    
    // Determine the final color (custom or preset)
    const finalColor = customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor) 
      ? customColor 
      : eventColor;
    
    // Add color to recent colors if it's custom
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      const newRecentColors = [customColor, ...recentColors.filter(c => c !== customColor)].slice(0, 8);
      setRecentColors(newRecentColors);
      saveRecentColors(newRecentColors);
    }
    
    if (editingEventId) {
      // Update existing event
      setEvents(prev => prev.map(e => 
        e.id === editingEventId 
          ? {
              ...e,
              title: eventTitle.trim(),
              startDate,
              endDate,
              time: eventTime,
              description: eventDescription.trim(),
              color: finalColor,
            }
          : e
      ));
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: eventTitle.trim(),
        startDate,
        endDate,
        time: eventTime,
        description: eventDescription.trim(),
        color: finalColor,
      };
      setEvents(prev => [...prev, newEvent]);
    }
    
    setShowPopup(false);
    resetForm();
  }, [eventTitle, eventTime, eventDescription, eventColor, customColor, eventType, selectedDates, multiStartDate, multiEndDate, recentColors, resetForm, editingEventId]);

  // Delete event
  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  // Close popup
  const closePopup = useCallback(() => {
    setShowPopup(false);
    resetForm();
  }, [resetForm]);

  // Get events that appear on a specific day
  const getEventsForDay = useCallback((dateKey: string) => {
    return events.filter(event => {
      const eventDays = getDaysBetween(event.startDate, event.endDate);
      return eventDays.includes(dateKey);
    });
  }, [events]);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header - Notion page style */}
      <div className="px-10 pt-10 pb-4 max-w-225">
        <div className="mb-2">

        </div>
        <div className="flex items-center gap-4 mb-1">
          <h1
            className="text-[32px] font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {monthYear}
          </h1>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-120"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-md transition-colors duration-120"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-md transition-colors duration-120"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 px-10 pb-6">
        <div className="h-full flex flex-col">
          {/* Days of week header */}
          <div className="grid grid-cols-7">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-medium py-2 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-divider)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days grid */}
          <div className="grid grid-cols-7 flex-1 relative">
            {calendarDays.map((dayInfo, index) => {
              const dayEvents = getEventsForDay(dayInfo.dateKey);
              const isSelected = selectedDates.includes(dayInfo.dateKey);
              
              return (
                <div
                  key={index}
                  onClick={(e) => handleDayClick(dayInfo.dateKey, e)}
                  className="relative p-1.5 min-h-25 transition-colors duration-120 cursor-pointer select-none overflow-visible"
                  style={{
                    borderRight: '1px solid var(--border-divider)',
                    borderBottom: '1px solid var(--border-divider)',
                    backgroundColor: isSelected ? 'var(--accent-blue-light)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Day number */}
                  <div className="flex justify-end mb-1">
                    {isToday(dayInfo.date) ? (
                      <div
                        className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}
                      >
                        {dayInfo.day}
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 flex items-center justify-center text-xs"
                        style={{
                          color: dayInfo.isCurrentMonth
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                          fontWeight: dayInfo.isCurrentMonth ? 500 : 400,
                        }}
                      >
                        {dayInfo.day}
                      </div>
                    )}
                  </div>
                  
                  {/* Event bars - render segment on each day */}
                  <div className="space-y-0.5">
                    {dayEvents.map((event) => {
                      const isStart = dayInfo.dateKey === event.startDate;
                      const isEnd = dayInfo.dateKey === event.endDate;
                      const isSingleDay = event.startDate === event.endDate;
                      const row = eventsByRow.positions.get(event.id) || 0;
                      const dayOfWeek = index % 7;
                      const isFirstOfWeek = dayOfWeek === 0;
                      const isLastOfWeek = dayOfWeek === 6;
                      
                      // Determine rounded corners
                      let borderRadius = '0';
                      if (isSingleDay) {
                        borderRadius = '4px';
                      } else if (isStart) {
                        borderRadius = '4px 0 0 4px';
                      } else if (isEnd) {
                        borderRadius = '0 4px 4px 0';
                      } else if (isFirstOfWeek) {
                        borderRadius = '4px 0 0 4px';
                      } else if (isLastOfWeek) {
                        borderRadius = '0 4px 4px 0';
                      }
                      
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0 right-0 group cursor-pointer"
                          style={{
                            top: `${28 + row * 22}px`,
                            left: (isStart || isFirstOfWeek) ? '4px' : '0px',
                            right: (isEnd || isLastOfWeek) ? '4px' : '0px',
                            zIndex: 10 + row,
                          }}
                          onClick={(e) => handleEditEvent(event, e)}
                        >
                          <div
                            className="h-5 px-1.5 flex items-center text-[11px] font-medium text-white truncate transition-all"
                            style={{
                              backgroundColor: event.color,
                              borderRadius,
                            }}
                            title={`${event.title}${event.time !== 'all-day' ? ` (${event.time})` : ''}\n${event.description}`}
                          >
                            {(isStart || isFirstOfWeek) && (
                              <span className="truncate">{event.title}</span>
                            )}
                          </div>
                          {/* Delete button on hover - only show on start day */}
                          {isStart && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={closePopup}
            />
            
            {/* Popup */}
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag
              dragMomentum={false}
              dragConstraints={{
                left: 0,
                right: window.innerWidth - 320,
                top: 0,
                bottom: window.innerHeight - 100,
              }}
              className="fixed z-50 w-80 rounded-lg overflow-hidden"
              style={{
                left: popupPosition.x,
                top: popupPosition.y,
                backgroundColor: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-overlay)',
                border: '1px solid var(--border-default)',
                cursor: 'grab',
              }}
              whileDrag={{ cursor: 'grabbing' }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddEvent}>
                {/* Header with Tabs - Drag Handle */}
                <div 
                  className="px-4 py-3 border-b" 
                  style={{ borderColor: 'var(--border-divider)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {editingEventId ? 'Edit Event' : 'Add Event'}
                    </h3>
                    <div 
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      drag
                    </div>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-1 p-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <button
                      type="button"
                      onClick={() => setEventType('single')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{
                        backgroundColor: eventType === 'single' ? 'var(--bg-primary)' : 'transparent',
                        color: eventType === 'single' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: eventType === 'single' ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType('multi')}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{
                        backgroundColor: eventType === 'multi' ? 'var(--bg-primary)' : 'transparent',
                        color: eventType === 'multi' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: eventType === 'multi' ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      Multi-Day
                    </button>
                  </div>
                  {/* Date display */}
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {eventType === 'single' 
                      ? selectedDates[0] && new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : multiStartDate && multiEndDate 
                        ? `${new Date(multiStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(multiEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Select dates below'
                    }
                  </p>
                </div>
                
                {/* Form Fields */}
                <div className="p-4 space-y-3">
                  {/* Multi-day date pickers */}
                  {eventType === 'multi' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={multiStartDate}
                          onChange={(e) => setMultiStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md outline-none"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={multiEndDate}
                          onChange={(e) => setMultiEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md outline-none"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Event Name */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event name..."
                      className="w-full px-3 py-2 text-sm rounded-md outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                      autoFocus
                    />
                  </div>
                  
                  {/* Time */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Time
                    </label>
                    <select
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md outline-none cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="all-day">All Day</option>
                      <option value="06:00">6:00 AM</option>
                      <option value="07:00">7:00 AM</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                    </select>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Add details..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-md outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  
                  {/* Color Selection */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {EVENT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => { setEventColor(color.value); setCustomColor(''); }}
                          className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color.value,
                            boxShadow: eventColor === color.value && !customColor ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${color.value}` : 'none',
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    
                    {/* Recent Colors */}
                    {recentColors.length > 0 && (
                      <div className="mb-2">
                        <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Recent
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {recentColors.map((color, idx) => (
                            <button
                              key={`recent-${idx}`}
                              type="button"
                              onClick={() => { setCustomColor(color); setEventColor(color); }}
                              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                              style={{
                                backgroundColor: color,
                                boxShadow: customColor === color ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${color}` : 'none',
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Custom:
                      </label>
                      <input
                        type="color"
                        value={customColor || eventColor}
                        onChange={(e) => { setCustomColor(e.target.value); }}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                        style={{ backgroundColor: 'transparent' }}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="#hex"
                        className="flex-1 px-2 py-1 text-xs rounded outline-none"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="px-4 py-3 flex justify-between gap-2 border-t" style={{ borderColor: 'var(--border-divider)' }}>
                  {editingEventId ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteEvent(editingEventId);
                        closePopup();
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                      style={{
                        color: 'var(--accent-red)',
                        border: '1px solid var(--accent-red)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-red)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--accent-red)';
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={closePopup}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                      style={{
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} 
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!eventTitle.trim() || (eventType === 'multi' && (!multiStartDate || !multiEndDate))}
                      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                      style={{
                        backgroundColor: (eventTitle.trim() && (eventType === 'single' || (multiStartDate && multiEndDate))) ? 'var(--accent-blue)' : 'var(--bg-hover)',
                        color: (eventTitle.trim() && (eventType === 'single' || (multiStartDate && multiEndDate))) ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {editingEventId ? 'Save' : 'Add Event'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
