import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";

export interface CacheOptions {
  expireInSeconds?: number;
}

export interface CacheItem<T> {
  value: T;
  timestamp: number;
  expireAt?: number;
}

export type CacheValue<T> = T | null;

export interface UseCacheReturn {
  saveToCache: <T>(
    key: string,
    value: T,
    options?: CacheOptions
  ) => Promise<void>;
  getFromCache: <T>(key: string) => Promise<CacheValue<T>>;
  removeFromCache: (key: string) => Promise<void>;
  clearCache: () => Promise<void>;
  getMultiFromCache: <T>(
    keys: string[]
  ) => Promise<Record<string, CacheValue<T>>>;
}

/**
 * A hook that provides a unified caching interface for both web and mobile platforms.
 *
 * @example
 * ```
 * const { saveToCache, getFromCache } = useCache();
 *
 * // Save data with 1 hour expiration
 * await saveToCache('user-preferences', { theme: 'dark' }, { expireInSeconds: 3600 });
 *
 * // Retrieve data
 * const preferences = await getFromCache('user-preferences');
 * ```
 */
export function useCache(): UseCacheReturn {
  /**
   * Save data to cache with optional expiration
   */
  const saveToCache = useCallback(
    async <T>(key: string, value: T, options?: CacheOptions): Promise<void> => {
      try {
        const timestamp = Date.now();
        const cacheItem: CacheItem<T> = {
          value,
          timestamp,
          expireAt: options?.expireInSeconds
            ? timestamp + options.expireInSeconds * 1000
            : undefined,
        };

        const jsonValue = JSON.stringify(cacheItem);
        await AsyncStorage.setItem(key, jsonValue);
      } catch (error) {
        console.error("Error saving to cache:", error);
      }
    },
    []
  );

  /**
   * Get data from cache, returns null if not found or expired
   */
  const getFromCache = useCallback(
    async <T>(key: string): Promise<CacheValue<T>> => {
      try {
        const jsonValue = await AsyncStorage.getItem(key);

        if (!jsonValue) return null;

        const cacheItem: CacheItem<T> = JSON.parse(jsonValue);

        // Check if item is expired
        if (cacheItem.expireAt && Date.now() > cacheItem.expireAt) {
          await AsyncStorage.removeItem(key);
          return null;
        }

        return cacheItem.value;
      } catch (error) {
        console.error("Error retrieving from cache:", error);
        return null;
      }
    },
    []
  );

  /**
   * Remove an item from cache
   */
  const removeFromCache = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from cache:", error);
    }
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  /**
   * Get multiple cached items by their keys
   */
  const getMultiFromCache = useCallback(
    async <T>(keys: string[]): Promise<Record<string, CacheValue<T>>> => {
      try {
        const results: Record<string, CacheValue<T>> = {};
        await Promise.all(
          keys.map(async (key) => {
            results[key] = await getFromCache<T>(key);
          })
        );
        return results;
      } catch (error) {
        console.error("Error retrieving multiple items from cache:", error);
        return {};
      }
    },
    [getFromCache]
  );

  return {
    saveToCache,
    getFromCache,
    removeFromCache,
    clearCache,
    getMultiFromCache,
  };
}
