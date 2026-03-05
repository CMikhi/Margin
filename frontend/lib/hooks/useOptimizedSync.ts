/**
 * Optimized sync utility for widgets with change detection and debouncing
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface SyncState {
  lastSynced: number;
  isDirty: boolean;
  isOnline: boolean;
  pendingChanges: any;
}

interface OptimizedSyncOptions {
  debounceMs?: number;
  syncIntervalMs?: number;
  maxRetries?: number;
  enableHashComparison?: boolean;
}

const DEFAULT_OPTIONS: Required<OptimizedSyncOptions> = {
  debounceMs: 2000,        // Wait 2 seconds after last change
  syncIntervalMs: 300000,  // Background sync every 5 minutes if dirty
  maxRetries: 3,
  enableHashComparison: true,
};

/**
 * Generate a hash of the data for change detection
 */
function generateDataHash(data: any): string {
  return btoa(JSON.stringify(data))
    .replace(/[+/=]/g, '')
    .substring(0, 16);
}

/**
 * Hook for optimized data synchronization
 */
export function useOptimizedSync<T>(
  data: T,
  syncFunction: (data: T) => Promise<void>,
  options: OptimizedSyncOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [syncState, setSyncState] = useState<SyncState>({
    lastSynced: Date.now(),
    isDirty: false,
    isOnline: navigator?.onLine ?? true,
    pendingChanges: null,
  });

  const lastDataHashRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      if (syncState.isDirty) {
        performSync();
      }
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncState.isDirty]);

  // Detect changes in data
  useEffect(() => {
    if (!opts.enableHashComparison) return;

    const currentHash = generateDataHash(data);

    if (lastDataHashRef.current === '') {
      lastDataHashRef.current = currentHash;
      return;
    }

    if (currentHash !== lastDataHashRef.current) {
      lastDataHashRef.current = currentHash;
      setSyncState(prev => ({
        ...prev,
        isDirty: true,
        pendingChanges: data,
      }));

      // Debounced sync
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (syncState.isOnline) {
          performSync();
        }
      }, opts.debounceMs);
    }
  }, [data, opts.debounceMs, opts.enableHashComparison]);

  // Background periodic sync for dirty data
  useEffect(() => {
    if (!syncState.isDirty) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (syncState.isDirty && syncState.isOnline) {
        performSync();
      }
    }, opts.syncIntervalMs);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncState.isDirty, syncState.isOnline, opts.syncIntervalMs]);

  const performSync = useCallback(async () => {
    if (!syncState.isDirty || !syncState.isOnline) return;

    try {
      await syncFunction(data);

      setSyncState(prev => ({
        ...prev,
        isDirty: false,
        lastSynced: Date.now(),
        pendingChanges: null,
      }));

      retryCountRef.current = 0;

    } catch (error) {
      console.error('Sync failed:', error);

      retryCountRef.current++;

      if (retryCountRef.current < opts.maxRetries) {
        setTimeout(() => {
          performSync();
        }, Math.pow(2, retryCountRef.current) * 1000); // Exponential backoff
      } else {
        retryCountRef.current = 0;
      }
    }
  }, [data, syncFunction, syncState.isDirty, syncState.isOnline, opts.maxRetries]);

  // Force sync method
  const forceSync = useCallback(async () => {
    setSyncState(prev => ({ ...prev, isDirty: true }));
    await performSync();
  }, [performSync]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncState,
    forceSync,
    lastSyncedAgo: Date.now() - syncState.lastSynced,
  };
}