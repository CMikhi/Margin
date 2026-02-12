'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '@/lib/types';
import { 
  loadEvents, 
  saveEvents, 
  formatDateKey, 
  getEventsForDay,
  EVENT_COLORS,
  loadRecentColors,
  saveRecentColors
} from '@/lib/utils/calendarStorage';

interface DailyEventsWidgetProps {
  id: string;
  onDelete: (id: string) => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } },
};

export function DailyEventsWidget({ id, onDelete }: DailyEventsWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('all-day');
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0].value);
  const [customColor, setCustomColor] = useState('');

  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayEvents = getEventsForDay(events, todayKey);

  // Format today's date nicely
  const todayFormatted = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
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

  const resetForm = useCallback(() => {
    setEventTitle('');
    setEventTime('all-day');
    setEventDescription('');
    setEventColor(EVENT_COLORS[0].value);
    setCustomColor('');
  }, []);

  const handleAddEvent = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const finalColor = customColor || eventColor;

    // Add color to recent colors if it's custom
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      const newRecentColors = [customColor, ...recentColors.filter(c => c !== customColor)].slice(0, 8);
      setRecentColors(newRecentColors);
      saveRecentColors(newRecentColors);
    }

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventTitle.trim(),
      startDate: todayKey,
      endDate: todayKey,
      time: eventTime,
      description: eventDescription.trim(),
      color: finalColor,
    };

    setEvents(prev => [...prev, newEvent]);
    setShowAddForm(false);
    resetForm();
  }, [eventTitle, eventTime, eventDescription, eventColor, customColor, todayKey, recentColors, resetForm]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const formatTime = (time: string) => {
    if (time === 'all-day') return 'All Day';
    const hour = parseInt(time.split(':')[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <motion.div 
      variants={fadeIn} 
      initial="hidden" 
      animate="visible" 
      className="h-full w-full flex flex-col p-4 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {todayFormatted}
        </h2>
        <div className="flex items-center justify-between">
          <p 
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {todayEvents.length} {todayEvents.length === 1 ? 'event' : 'events'} today
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs px-2 py-1 rounded-md transition-colors"
            style={{
              color: 'var(--accent-blue)',
              border: '1px solid var(--accent-blue)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--accent-blue)';
            }}
          >
            + Add Event
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {todayEvents.length === 0 ? (
          <p 
            className="text-sm text-center mt-8"
            style={{ color: 'var(--text-muted)' }}
          >
            No events for today
          </p>
        ) : (
          todayEvents.map(event => (
            <div
              key={event.id}
              className="p-3 rounded-lg border transition-colors group"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--bg-secondary)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = event.color}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <h3 
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {event.title}
                    </h3>
                  </div>
                  <p 
                    className="text-xs mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {formatTime(event.time)}
                  </p>
                  {event.description && (
                    <p 
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {event.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Delete event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Form Popup */}
      <AnimatePresence>
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              onClick={() => { setShowAddForm(false); resetForm(); }}
            />
            
            {/* Form Popup */}
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddEvent}>
                {/* Form Header */}
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-divider)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Add Event
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {todayFormatted}
                  </p>
                </div>

                {/* Form Body */}
                <div className="px-4 py-4 space-y-3 max-h-96 overflow-y-auto">
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

                {/* Form Actions */}
                <div className="px-4 py-3 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--border-divider)' }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); resetForm(); }}
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
                    disabled={!eventTitle.trim()}
                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                    style={{
                      backgroundColor: eventTitle.trim() ? 'var(--accent-blue)' : 'var(--bg-hover)',
                      color: eventTitle.trim() ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
