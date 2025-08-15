// @ts-nocheck
import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolvedData?: Record<string, unknown>;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: Array<{
    item: SyncQueueItem;
    serverData: Record<string, unknown>;
    resolution?: ConflictResolution;
  }>;
}

class OfflineSyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private readonly STORAGE_KEY = 'ghsm_offline_sync_queue';
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds
  private syncListeners: Array<(result: SyncResult) => void> = [];

  constructor() {
    this.loadQueueFromStorage();
    this.setupOnlineListener();
    
    // Auto-sync when coming back online
    if (this.isOnline && this.syncQueue.length > 0) {
      this.sync();
    }
  }

  /**
   * Set up online/offline event listeners
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      // Auto-sync when coming back online
      if (this.syncQueue.length > 0) {
        this.sync();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Load sync queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue from storage:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue to storage:', error);
    }
  }

  /**
   * Add an operation to the sync queue
   */
  queueOperation(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    maxRetries = 3
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const item: SyncQueueItem = {
      id,
      table,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.syncQueue.push(item);
    this.saveQueueToStorage();

    // Try to sync immediately if online
    if (this.isOnline && isSupabaseConfigured()) {
      this.sync();
    }

    return id;
  }

  /**
   * Remove an item from the sync queue
   */
  private removeFromQueue(id: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.saveQueueToStorage();
  }

  /**
   * Update retry count for a queue item
   */
  private updateRetryCount(id: string): void {
    const item = this.syncQueue.find(i => i.id === id);
    if (item) {
      item.retryCount++;
      this.saveQueueToStorage();
    }
  }

  /**
   * Execute a single sync operation
   */
  private async executeSyncOperation(item: SyncQueueItem): Promise<{ 
    success: boolean; 
    conflict?: { serverData: Record<string, unknown> };
    error?: string;
  }> {
    const client = getSupabaseClient();

    try {
      switch (item.operation) {
        case 'create': {
          const { error } = await client
            .from(item.table)
            .insert(item.data)
            .select()
            .single();

          if (error) {
            // Check if it's a conflict (record already exists)
            if (error.code === '23505') { // Unique constraint violation
              const { data: serverData } = await client
                .from(item.table)
                .select()
                .eq('id', item.data.id)
                .single();

              return {
                success: false,
                conflict: { serverData: serverData || {} }
              };
            }
            throw error;
          }

          return { success: true };
        }

        case 'update': {
          // First check if record exists and get current version
          const { data: current, error: fetchError } = await client
            .from(item.table)
            .select()
            .eq('id', item.data.id)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') { // Record not found
              // Record was deleted on server, treat as conflict
              return {
                success: false,
                conflict: { serverData: {} }
              };
            }
            throw fetchError;
          }

          // Check for conflicts based on updated_at timestamp
          const serverUpdatedAt = new Date(current.updated_at || Date.now()).getTime();
          const clientUpdatedAt = new Date((item.data.updated_at as string | number) || Date.now()).getTime();

          if (serverUpdatedAt > clientUpdatedAt) {
            return {
              success: false,
              conflict: { serverData: current }
            };
          }

          const { error } = await client
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id);

          if (error) throw error;

          return { success: true };
        }

        case 'delete': {
          const { error } = await client
            .from(item.table)
            .delete()
            .eq('id', item.data.id);

          if (error) {
            if (error.code === 'PGRST116') { // Record not found
              // Already deleted, consider it successful
              return { success: true };
            }
            throw error;
          }

          return { success: true };
        }

        default:
          throw new Error(`Unsupported operation: ${item.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  private resolveConflict(
    item: SyncQueueItem,
    serverData: Record<string, unknown>,
    strategy: ConflictResolution['strategy'] = 'server-wins'
  ): ConflictResolution {
    switch (strategy) {
      case 'client-wins':
        return {
          strategy,
          resolvedData: item.data
        };

      case 'server-wins':
        return {
          strategy,
          resolvedData: serverData
        };

      case 'merge':
        // Simple merge strategy - combine non-conflicting fields
        return {
          strategy,
          resolvedData: {
            ...serverData,
            ...item.data,
            // Keep server's updated_at for proper versioning
            updated_at: serverData.updated_at
          }
        };

      case 'manual':
        return {
          strategy,
          // No automatic resolution, requires manual intervention
        };

      default:
        return {
          strategy: 'server-wins',
          resolvedData: serverData
        };
    }
  }

  /**
   * Sync all pending operations
   */
  async sync(conflictStrategy: ConflictResolution['strategy'] = 'server-wins'): Promise<SyncResult> {
    if (this.isSyncing) {
      console.warn('Sync already in progress');
      return { success: false, synced: 0, failed: 0, conflicts: [] };
    }

    if (!this.isOnline || !isSupabaseConfigured()) {
      console.warn('Cannot sync: offline or Supabase not configured');
      return { success: false, synced: 0, failed: 0, conflicts: [] };
    }

    this.isSyncing = true;

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: []
    };

    // Process items in order (FIFO)
    const itemsToProcess = [...this.syncQueue];

    for (const item of itemsToProcess) {
      try {
        const syncResult = await this.executeSyncOperation(item);

        if (syncResult.success) {
          this.removeFromQueue(item.id);
          result.synced++;
        } else if (syncResult.conflict) {
          const resolution = this.resolveConflict(item, syncResult.conflict.serverData, conflictStrategy);
          
          result.conflicts.push({
            item,
            serverData: syncResult.conflict.serverData,
            resolution
          });

          // If we have a resolution, apply it
          if (resolution.resolvedData && resolution.strategy !== 'manual') {
            const resolvedItem = { ...item, data: resolution.resolvedData };
            const retryResult = await this.executeSyncOperation(resolvedItem);
            
            if (retryResult.success) {
              this.removeFromQueue(item.id);
              result.synced++;
            } else {
              this.updateRetryCount(item.id);
              result.failed++;
            }
          } else {
            // Manual resolution required or failed
            this.updateRetryCount(item.id);
            result.failed++;
          }
        } else {
          // Regular error - retry if under limit
          if (item.retryCount < item.maxRetries) {
            this.updateRetryCount(item.id);
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, item.retryCount), this.MAX_RETRY_DELAY);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`Max retries exceeded for sync item ${item.id}:`, syncResult.error);
            this.removeFromQueue(item.id);
            result.failed++;
          }
        }
      } catch (error) {
        console.error(`Unexpected error syncing item ${item.id}:`, error);
        this.updateRetryCount(item.id);
        result.failed++;
      }
    }

    this.isSyncing = false;

    // Notify listeners
    this.syncListeners.forEach(listener => listener(result));

    return result;
  }

  /**
   * Add a sync completion listener
   */
  addSyncListener(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current sync queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    failed: number;
    isOnline: boolean;
    isSyncing: boolean;
  } {
    const failed = this.syncQueue.filter(item => item.retryCount >= item.maxRetries).length;
    
    return {
      total: this.syncQueue.length,
      pending: this.syncQueue.length - failed,
      failed,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }

  /**
   * Clear all items from sync queue (use with caution)
   */
  clearQueue(): void {
    this.syncQueue = [];
    this.saveQueueToStorage();
  }

  /**
   * Get all queued items for manual review
   */
  getQueuedItems(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  /**
   * Manually retry a specific item
   */
  async retryItem(itemId: string): Promise<boolean> {
    const item = this.syncQueue.find(i => i.id === itemId);
    if (!item) return false;

    const result = await this.executeSyncOperation(item);
    if (result.success) {
      this.removeFromQueue(itemId);
      return true;
    } else {
      this.updateRetryCount(itemId);
      return false;
    }
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();

// Hook for React components
export function useOfflineSync() {
  return {
    queueOperation: (table: string, operation: 'create' | 'update' | 'delete', data: Record<string, unknown>) =>
      offlineSyncService.queueOperation(table, operation, data),
    sync: () => offlineSyncService.sync(),
    getStatus: () => offlineSyncService.getQueueStatus(),
    addSyncListener: (listener: (result: SyncResult) => void) => offlineSyncService.addSyncListener(listener),
    clearQueue: () => offlineSyncService.clearQueue(),
    retryItem: (itemId: string) => offlineSyncService.retryItem(itemId)
  };
}
