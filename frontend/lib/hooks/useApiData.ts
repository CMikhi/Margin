'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { useAuth } from './useAuth'

export function useWidgets() {
  const { isAuthenticated } = useAuth()
  const [widgets, setWidgets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWidgets = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getWidgets() as any[]
      setWidgets(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load widgets')
      console.error('Failed to fetch widgets:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const updateWidgets = async (newWidgets: any[]) => {
    try {
      await apiClient.updateWidgets(newWidgets)
      setWidgets(newWidgets)
    } catch (err: any) {
      setError(err.message || 'Failed to update widgets')
      console.error('Failed to update widgets:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchWidgets()
  }, [fetchWidgets])

  return {
    widgets,
    loading,
    error,
    refetch: fetchWidgets,
    updateWidgets,
  }
}

export function useNotes() {
  const { isAuthenticated } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getNotes() as any[]
      setNotes(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load notes')
      console.error('Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const createNote = async (noteData: any) => {
    try {
      const newNote = await apiClient.createNote(noteData)
      setNotes(prev => [newNote, ...prev])
      return newNote
    } catch (err: any) {
      setError(err.message || 'Failed to create note')
      console.error('Failed to create note:', err)
      throw err
    }
  }

  const updateNote = async (id: string, noteData: any) => {
    try {
      const updatedNote = await apiClient.updateNote(id, noteData)
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      return updatedNote
    } catch (err: any) {
      setError(err.message || 'Failed to update note')
      console.error('Failed to update note:', err)
      throw err
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await apiClient.deleteNote(id)
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete note')
      console.error('Failed to delete note:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  }
}

export function useCalendarEvents() {
  const { isAuthenticated } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      // Default to current month if no dates provided
      const now = new Date()
      const startDate = start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endDate = end || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      const data = await apiClient.getCalendarEvents(startDate, endDate) as any[]
      setEvents(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events')
      console.error('Failed to fetch calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const createEvent = async (eventData: any) => {
    try {
      const newEvent = await apiClient.createCalendarEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      return newEvent
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
      console.error('Failed to create event:', err)
      throw err
    }
  }

  const updateEvent = async (id: string, eventData: any) => {
    try {
      const updatedEvent = await apiClient.updateCalendarEvent(id, eventData)
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event))
      return updatedEvent
    } catch (err: any) {
      setError(err.message || 'Failed to update event')
      console.error('Failed to update event:', err)
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      await apiClient.deleteCalendarEvent(id)
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete event')
      console.error('Failed to delete event:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}