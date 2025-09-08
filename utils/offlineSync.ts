/**
 * Offline Support & Sync Mechanisms
 * Provides offline-first functionality with intelligent sync
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { analytics } from "./analytics";
import { errorHandler } from "./errorHandling";

// =============================================================================
// TYPES
// =============================================================================

interface OfflineConfig {
  enabled: boolean;
  maxOfflineStorage: number;
  syncRetryAttempts: number;
  syncRetryDelay: number;
  conflictResolution: "local" | "remote" | "merge";
  enableOptimisticUpdates: boolean;
  maxCacheAge: number;
}

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "synced" | "failed";
  priority: "low" | "normal" | "high";
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime: number;
  syncErrors: number;
  conflictsResolved: number;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  priority: "low" | "normal" | "high";
}

interface ConflictResolution {
  actionId: string;
  localData: any;
  remoteData: any;
  resolution: "local" | "remote" | "merge";
  mergedData?: any;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  OFFLINE_CONFIG: "@offline/config",
  OFFLINE_ACTIONS: "@offline/actions",
  OFFLINE_CACHE: "@offline/cache",
  SYNC_STATUS: "@offline/sync_status",
  LAST_SYNC: "@offline/last_sync",
} as const;

const DEFAULT_CONFIG: OfflineConfig = {
  enabled: true,
  maxOfflineStorage: 10000, // Max actions to store
  syncRetryAttempts: 3,
  syncRetryDelay: 5000, // 5 seconds
  conflictResolution: "merge",
  enableOptimisticUpdates: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
};

// =============================================================================
// OFFLINE SYNC MANAGER
// =============================================================================

class OfflineSyncManager {
  private config: OfflineConfig = DEFAULT_CONFIG;
  private offlineActions: OfflineAction[] = [];
  private cache = new Map<string, CacheEntry>();
  private syncStatus: SyncStatus = {
    isOnline: true,
    isSyncing: false,
    pendingActions: 0,
    lastSyncTime: 0,
    syncErrors: 0,
    conflictsResolved: 0,
  };
  private networkListener: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize offline sync manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfig();
      await this.loadOfflineActions();
      await this.loadCache();
      await this.loadSyncStatus();

      this.setupNetworkListener();
      this.setupPeriodicSync();

      this.isInitialized = true;

      analytics.track("offline_sync_initialized", {
        config: this.config,
        pendingActions: this.offlineActions.length,
        cacheSize: this.cache.size,
      });
    } catch (error) {
      errorHandler.handle(error, "OfflineSyncManager.initialize");
      throw error;
    }
  }

  /**
   * Queue an action for offline execution
   */
  async queueAction(
    type: string,
    data: any,
    priority: OfflineAction["priority"] = "normal"
  ): Promise<string> {
    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
      priority,
    };

    this.offlineActions.push(action);
    this.syncStatus.pendingActions = this.offlineActions.length;

    await this.saveOfflineActions();
    await this.saveSyncStatus();

    // Try immediate sync if online
    if (this.syncStatus.isOnline) {
      this.attemptSync();
    }

    analytics.track("action_queued", {
      type,
      priority,
      isOnline: this.syncStatus.isOnline,
    });

    return action.id;
  }

  /**
   * Cache data for offline access
   */
  async cacheData<T>(
    key: string,
    data: T,
    ttl: number = this.config.maxCacheAge,
    priority: CacheEntry["priority"] = "normal"
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      priority,
    };

    this.cache.set(key, entry);
    await this.saveCache();

    // Clean expired entries
    this.cleanExpiredCache();
  }

  /**
   * Retrieve cached data
   */
  getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.saveCache(); // Don't await
      return null;
    }

    return entry.data as T;
  }

  /**
   * Force sync all pending actions
   */
  async forcSync(): Promise<{ success: number; failed: number }> {
    if (this.syncStatus.isSyncing) {
      throw new Error("Sync already in progress");
    }

    this.syncStatus.isSyncing = true;
    await this.saveSyncStatus();

    let success = 0;
    let failed = 0;

    try {
      const pendingActions = this.offlineActions.filter(
        (action) => action.status === "pending" || action.status === "failed"
      );

      // Sort by priority and timestamp
      pendingActions.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
          success++;
        } catch (error) {
          failed++;
          action.retryCount++;

          if (action.retryCount >= this.config.syncRetryAttempts) {
            action.status = "failed";
          }

          errorHandler.handle(error, `OfflineSync.syncAction.${action.type}`);
        }
      }

      // Remove synced actions
      this.offlineActions = this.offlineActions.filter(
        (action) => action.status !== "synced"
      );

      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.pendingActions = this.offlineActions.length;

      if (failed > 0) {
        this.syncStatus.syncErrors++;
      }

      await this.saveOfflineActions();
      await this.saveSyncStatus();

      analytics.track("sync_completed", {
        success,
        failed,
        pendingActions: this.syncStatus.pendingActions,
        duration: Date.now() - this.syncStatus.lastSyncTime,
      });

      return { success, failed };
    } finally {
      this.syncStatus.isSyncing = false;
      await this.saveSyncStatus();
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get pending actions
   */
  getPendingActions(): OfflineAction[] {
    return this.offlineActions.filter(
      (action) => action.status === "pending" || action.status === "failed"
    );
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    this.offlineActions = [];
    this.cache.clear();

    await Promise.all([
      this.saveOfflineActions(),
      this.saveCache(),
      AsyncStorage.removeItem(STORAGE_KEYS.SYNC_STATUS),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);

    this.syncStatus.pendingActions = 0;
    await this.saveSyncStatus();

    analytics.track("offline_data_cleared");
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    actionId: string,
    resolution: ConflictResolution["resolution"],
    mergedData?: any
  ): Promise<void> {
    const action = this.offlineActions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    switch (resolution) {
      case "local":
        // Keep local data, retry sync
        action.status = "pending";
        action.retryCount = 0;
        break;

      case "remote":
        // Accept remote data, mark as synced
        action.status = "synced";
        break;

      case "merge":
        if (!mergedData) {
          throw new Error("Merged data required for merge resolution");
        }
        action.data = mergedData;
        action.status = "pending";
        action.retryCount = 0;
        break;
    }

    this.syncStatus.conflictsResolved++;

    await this.saveOfflineActions();
    await this.saveSyncStatus();

    analytics.track("conflict_resolved", {
      actionId,
      resolution,
      actionType: action.type,
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
    expired: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let expired = 0;
    let memoryUsage = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired++;
      }
      memoryUsage += JSON.stringify(entry).length;
    }

    return {
      size: this.cache.size,
      entries: this.cache.size,
      expired,
      memoryUsage,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load offline config:", error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_CONFIG,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn("Failed to save offline config:", error);
    }
  }

  private async loadOfflineActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ACTIONS);
      if (stored) {
        this.offlineActions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load offline actions:", error);
    }
  }

  private async saveOfflineActions(): Promise<void> {
    try {
      // Limit storage size
      if (this.offlineActions.length > this.config.maxOfflineStorage) {
        this.offlineActions = this.offlineActions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.config.maxOfflineStorage);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_ACTIONS,
        JSON.stringify(this.offlineActions)
      );
    } catch (error) {
      console.warn("Failed to save offline actions:", error);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CACHE);
      if (stored) {
        const entries = JSON.parse(stored);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.warn("Failed to load cache:", error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const entries = Array.from(this.cache.entries());
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_CACHE,
        JSON.stringify(entries)
      );
    } catch (error) {
      console.warn("Failed to save cache:", error);
    }
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (stored) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(stored) };
      }
      this.syncStatus.pendingActions = this.offlineActions.filter(
        (action) => action.status === "pending" || action.status === "failed"
      ).length;
    } catch (error) {
      console.warn("Failed to load sync status:", error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SYNC_STATUS,
        JSON.stringify(this.syncStatus)
      );
    } catch (error) {
      console.warn("Failed to save sync status:", error);
    }
  }

  private setupNetworkListener(): void {
    this.networkListener = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected ?? false;

      analytics.track("network_status_changed", {
        isConnected: this.syncStatus.isOnline,
        connectionType: state.type,
        wasOnline,
      });

      // If we just came online, attempt sync
      if (!wasOnline && this.syncStatus.isOnline) {
        this.attemptSync();
      }

      this.saveSyncStatus();
    });
  }

  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.attemptSync();
      }
    }, 5 * 60 * 1000);
  }

  private async attemptSync(): Promise<void> {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return;
    }

    try {
      await this.forcSync();
    } catch (error) {
      errorHandler.handle(error, "OfflineSync.attemptSync");
    }
  }

  private async syncAction(action: OfflineAction): Promise<void> {
    const startTime = Date.now();

    try {
      action.status = "syncing";

      // Simulate API call based on action type
      switch (action.type) {
        case "publish_event":
          await this.syncPublishEvent(action.data);
          break;
        case "update_profile":
          await this.syncUpdateProfile(action.data);
          break;
        case "add_relay":
          await this.syncAddRelay(action.data);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      action.status = "synced";

      analytics.track("action_synced", {
        type: action.type,
        duration: Date.now() - startTime,
        retryCount: action.retryCount,
      });
    } catch (error) {
      action.status = "failed";
      throw error;
    }
  }

  private async syncPublishEvent(data: any): Promise<void> {
    // Implement actual Nostr event publishing
    console.log("Syncing publish event:", data);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check for conflicts (example)
    // if (data.conflictsWith) {
    //   throw new ConflictError("Event conflicts with existing data");
    // }
  }

  private async syncUpdateProfile(data: any): Promise<void> {
    // Implement actual profile update
    console.log("Syncing profile update:", data);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async syncAddRelay(data: any): Promise<void> {
    // Implement actual relay addition
    console.log("Syncing add relay:", data);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));

    if (toDelete.length > 0) {
      this.saveCache(); // Don't await
    }
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup on app termination
   */
  async cleanup(): Promise<void> {
    if (this.networkListener) {
      this.networkListener();
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Final save
    await Promise.all([
      this.saveOfflineActions(),
      this.saveCache(),
      this.saveSyncStatus(),
    ]);
  }
}

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useCallback, useEffect, useState } from "react";

/**
 * Hook for offline sync status
 */
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    offlineSync.getSyncStatus()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(offlineSync.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const queueAction = useCallback(
    (type: string, data: any, priority?: OfflineAction["priority"]) => {
      return offlineSync.queueAction(type, data, priority);
    },
    []
  );

  const forceSync = useCallback(() => {
    return offlineSync.forcSync();
  }, []);

  return {
    syncStatus,
    queueAction,
    forceSync,
    isOnline: syncStatus.isOnline,
    isSyncing: syncStatus.isSyncing,
    pendingActions: syncStatus.pendingActions,
  };
}

/**
 * Hook for offline caching
 */
export function useOfflineCache<T>() {
  const cache = useCallback(
    (key: string, data: T, ttl?: number, priority?: CacheEntry["priority"]) => {
      return offlineSync.cacheData(key, data, ttl, priority);
    },
    []
  );

  const retrieve = useCallback((key: string) => {
    return offlineSync.getCachedData<T>(key);
  }, []);

  return { cache, retrieve };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const performOptimisticUpdate = useCallback(
    async (
      data: T,
      actionType: string,
      actionData: any,
      priority?: OfflineAction["priority"]
    ) => {
      // Apply optimistic update immediately
      setOptimisticData(data);
      setIsOptimistic(true);

      try {
        // Queue the actual action
        await offlineSync.queueAction(actionType, actionData, priority);

        // Reset optimistic state after a delay
        setTimeout(() => {
          setIsOptimistic(false);
          setOptimisticData(null);
        }, 2000);
      } catch (error) {
        // Revert optimistic update on error
        setIsOptimistic(false);
        setOptimisticData(null);
        throw error;
      }
    },
    []
  );

  return {
    optimisticData,
    isOptimistic,
    performOptimisticUpdate,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const offlineSync = new OfflineSyncManager();

export type {
  CacheEntry,
  ConflictResolution,
  OfflineAction,
  OfflineConfig,
  SyncStatus,
};

export { useOfflineCache, useOfflineSync, useOptimisticUpdate };
