import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '../services/supabaseService';
import { queryKeys } from './useSupabase';
import { useErrorHandler } from '../utils/errorHandling';
import { useOfflineSync } from '../utils/offlineSync';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  channel: RealtimeChannel;
  isActive: boolean;
  lastActivity: Date;
  errorCount: number;
}

interface RealtimeStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalEvents: number;
  errorRate: number;
  lastEventTime?: Date;
}

/**
 * Simplified real-time integration hook that manages subscriptions
 * and automatically updates React Query cache
 */
export const useRealtimeIntegration = (options: {
  tables?: string[];
  autoReconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
} = {}) => {
  const {
    tables = ['students', 'instructors', 'lessons', 'billings', 'payments', 'attendance', 'session_summaries'],
    autoReconnect = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableLogging = false
  } = options;

  const queryClient = useQueryClient();
  const { reportError } = useErrorHandler();
  const { getStatus: getSyncStatus } = useOfflineSync();
  
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());
  const statsRef = useRef<RealtimeStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalEvents: 0,
    errorRate: 0
  });
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Handle real-time events and update React Query cache
  const handleRealtimeEvent = useCallback((table: string) => {
    try {
      statsRef.current.totalEvents++;
      statsRef.current.lastEventTime = new Date();

      if (enableLogging) {
        console.warn(`[Realtime] ${table} data changed`);
      }

      // Update subscription activity
      const subscription = subscriptionsRef.current.get(table);
      if (subscription) {
        subscription.lastActivity = new Date();
      }

      // Invalidate related queries
      switch (table) {
        case 'students':
          queryClient.invalidateQueries({ queryKey: queryKeys.students });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
          break;

        case 'instructors':
          queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
          break;

        case 'lessons':
          queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
          break;

        case 'billings':
          queryClient.invalidateQueries({ queryKey: queryKeys.billings });
          break;

        case 'payments':
          queryClient.invalidateQueries({ queryKey: queryKeys.payments });
          break;

        case 'attendance':
          queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
          break;

        case 'session_summaries':
          queryClient.invalidateQueries({ queryKey: queryKeys.sessionSummaries });
          break;

        default:
          queryClient.invalidateQueries({ queryKey: [table] });
      }
    } catch (error) {
      reportError(error as Error, {
        category: 'sync',
        context: { table }
      });

      // Increment error count for this subscription
      const subscription = subscriptionsRef.current.get(table);
      if (subscription) {
        subscription.errorCount++;
      }
    }
  }, [enableLogging, reportError, queryClient]);

  // Subscribe to a table
  const subscribeToTable = useCallback(async (table: string) => {
    try {
      // Check if already subscribed
      if (subscriptionsRef.current.has(table)) {
        console.warn(`[Realtime] Already subscribed to ${table}`);
        return;
      }

      let channel: RealtimeChannel | undefined;

      // Use specific subscription methods based on table
      switch (table) {
        case 'students':
          channel = realtimeService.subscribeToStudents(() => handleRealtimeEvent(table));
          break;
        case 'instructors':
          channel = realtimeService.subscribeToInstructors(() => handleRealtimeEvent(table));
          break;
        case 'lessons':
          channel = realtimeService.subscribeToLessons(() => handleRealtimeEvent(table));
          break;
        case 'session_summaries':
          channel = realtimeService.subscribeToSessionSummaries(() => handleRealtimeEvent(table));
          break;
        default:
          console.warn(`[Realtime] No specific subscription method for ${table}`);
          return;
      }

      if (channel) {
        const subscription: RealtimeSubscription = {
          table,
          channel,
          isActive: true,
          lastActivity: new Date(),
          errorCount: 0
        };

        subscriptionsRef.current.set(table, subscription);
        statsRef.current.totalSubscriptions++;
        statsRef.current.activeSubscriptions++;

        if (enableLogging) {
          console.warn(`[Realtime] Subscribed to ${table}`);
        }
      }
    } catch (error) {
      reportError(error as Error, {
        category: 'sync',
        context: { action: 'subscribeToTable', table }
      });
    }
  }, [handleRealtimeEvent, reportError, enableLogging]);

  // Unsubscribe from a table
  const unsubscribeFromTable = useCallback((table: string) => {
    const subscription = subscriptionsRef.current.get(table);
    if (subscription) {
      try {
        realtimeService.unsubscribe(subscription.channel);
        subscriptionsRef.current.delete(table);
        statsRef.current.activeSubscriptions--;

        if (enableLogging) {
          console.warn(`[Realtime] Unsubscribed from ${table}`);
        }
      } catch (error) {
        reportError(error as Error, {
          category: 'sync',
          context: { action: 'unsubscribeFromTable', table }
        });
      }
    }
  }, [reportError, enableLogging]);

  // Reconnect to a table with retry logic
  const reconnectToTable = useCallback(async (table: string) => {
    const retryCount = retryCountRef.current.get(table) || 0;
    
    if (retryCount >= maxRetries) {
      console.warn(`[Realtime] Max retries exceeded for ${table}`);
      return;
    }

    try {
      // Unsubscribe first
      unsubscribeFromTable(table);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));

      // Resubscribe
      await subscribeToTable(table);
      
      // Reset retry count on success
      retryCountRef.current.set(table, 0);

      if (enableLogging) {
        console.warn(`[Realtime] Reconnected to ${table} after ${retryCount + 1} attempts`);
      }
    } catch (error) {
      retryCountRef.current.set(table, retryCount + 1);
      reportError(error as Error, {
        category: 'sync',
        context: { action: 'reconnectToTable', table, retryCount: retryCount + 1 }
      });

      // Schedule another retry if auto-reconnect is enabled
      if (autoReconnect && retryCount + 1 < maxRetries) {
        setTimeout(() => reconnectToTable(table), retryDelay * (retryCount + 2));
      }
    }
  }, [maxRetries, retryDelay, unsubscribeFromTable, subscribeToTable, autoReconnect, reportError, enableLogging]);

  // Initialize subscriptions
  useEffect(() => {
    tables.forEach(table => {
      subscribeToTable(table);
    });

    return () => {
      // Cleanup all subscriptions
      tables.forEach(table => {
        unsubscribeFromTable(table);
      });
    };
  }, [tables, subscribeToTable, unsubscribeFromTable]);

  // Monitor connection health and auto-reconnect
  useEffect(() => {
    if (!autoReconnect) return;

    const healthCheckInterval = setInterval(() => {
      subscriptionsRef.current.forEach((subscription, table) => {
        const timeSinceLastActivity = Date.now() - subscription.lastActivity.getTime();
        const isStale = timeSinceLastActivity > 60000; // 1 minute

        if (isStale || subscription.errorCount > 3) {
          if (enableLogging) {
            console.warn(`[Realtime] Health check failed for ${table}, reconnecting...`);
          }
          reconnectToTable(table);
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [autoReconnect, reconnectToTable, enableLogging]);

  // Monitor offline/online status and sync
  useEffect(() => {
    const syncStatus = getSyncStatus();
    
    // If we just came back online, refresh all queries to ensure consistency
    if (syncStatus.isOnline && syncStatus.pending > 0) {
      if (enableLogging) {
        console.warn('[Realtime] Back online, refreshing queries for consistency');
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructors });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons });
      queryClient.invalidateQueries({ queryKey: queryKeys.billings });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    }
  }, [getSyncStatus, queryClient, enableLogging]);

  // Get current statistics
  const getStats = useCallback((): RealtimeStats => {
    const current = statsRef.current;
    const errorCount = Array.from(subscriptionsRef.current.values())
      .reduce((sum, sub) => sum + sub.errorCount, 0);
    
    return {
      ...current,
      errorRate: current.totalEvents > 0 ? errorCount / current.totalEvents : 0,
      activeSubscriptions: subscriptionsRef.current.size
    };
  }, []);

  // Get subscription details
  const getSubscriptions = useCallback(() => {
    return Array.from(subscriptionsRef.current.entries()).map(([table, subscription]) => ({
      table,
      isActive: subscription.isActive,
      lastActivity: subscription.lastActivity,
      errorCount: subscription.errorCount
    }));
  }, []);

  // Manual refresh all queries
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    subscribeToTable,
    unsubscribeFromTable,
    reconnectToTable,
    getStats,
    getSubscriptions,
    refreshAll,
    isConnected: useMemo(() => {
      const syncStatus = getSyncStatus();
      return syncStatus.isOnline && subscriptionsRef.current.size > 0;
    }, [getSyncStatus])
  };
};

/**
 * Simplified hook for basic real-time functionality
 */
export const useRealtime = (tables?: string[]) => {
  const { isConnected, getStats } = useRealtimeIntegration({ 
    tables,
    enableLogging: true 
  });
  
  return {
    isConnected,
    stats: getStats()
  };
};

/**
 * Hook for monitoring real-time health
 */
export const useRealtimeHealth = () => {
  const { getStats, getSubscriptions, isConnected } = useRealtimeIntegration();
  
  return {
    isHealthy: isConnected,
    stats: getStats(),
    subscriptions: getSubscriptions()
  };
};
