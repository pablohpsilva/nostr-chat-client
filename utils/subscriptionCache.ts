import { NOSTR_LIMITS, NOSTR_TIMEOUTS } from "@/constants/nostr";
import { NostrEvent, NostrFilter } from "@/internal-lib/ndk";

/**
 * Smart subscription caching system
 * Reduces redundant subscriptions and improves performance
 */

interface CachedSubscription {
  id: string;
  filters: NostrFilter[];
  events: NostrEvent[];
  lastUpdated: number;
  subscribers: Set<string>;
  isActive: boolean;
}

interface SubscriptionCacheOptions {
  maxCacheSize?: number;
  maxCacheAge?: number;
  deduplicationWindow?: number;
}

class SubscriptionCache {
  private cache = new Map<string, CachedSubscription>();
  private options: Required<SubscriptionCacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: SubscriptionCacheOptions = {}) {
    this.options = {
      maxCacheSize: options.maxCacheSize || NOSTR_LIMITS.MAX_EVENTS_IN_MEMORY,
      maxCacheAge: options.maxCacheAge || NOSTR_TIMEOUTS.SUBSCRIPTION_TIMEOUT,
      deduplicationWindow: options.deduplicationWindow || 5000, // 5 seconds
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Generate a cache key from filters
   */
  private generateCacheKey(filters: NostrFilter[]): string {
    return JSON.stringify(
      filters.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    );
  }

  /**
   * Check if filters are similar enough to reuse cache
   */
  private areFiltersSimilar(
    filters1: NostrFilter[],
    filters2: NostrFilter[]
  ): boolean {
    if (filters1.length !== filters2.length) return false;

    // Simple similarity check - could be made more sophisticated
    const key1 = this.generateCacheKey(filters1);
    const key2 = this.generateCacheKey(filters2);

    return key1 === key2;
  }

  /**
   * Get cached events for filters if available
   */
  getCachedEvents(
    filters: NostrFilter[],
    subscriberId: string
  ): NostrEvent[] | null {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.lastUpdated;

    // Check if cache is still valid
    if (age > this.options.maxCacheAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Add subscriber to track usage
    cached.subscribers.add(subscriberId);

    return [...cached.events]; // Return copy to prevent mutations
  }

  /**
   * Update cache with new events
   */
  updateCache(
    filters: NostrFilter[],
    newEvents: NostrEvent[],
    subscriberId: string
  ): void {
    const cacheKey = this.generateCacheKey(filters);
    const existing = this.cache.get(cacheKey);

    if (existing) {
      // Merge new events with existing ones
      const mergedEvents = this.deduplicateEvents([
        ...existing.events,
        ...newEvents,
      ]);

      // Limit cache size
      const limitedEvents = mergedEvents
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, this.options.maxCacheSize);

      existing.events = limitedEvents;
      existing.lastUpdated = Date.now();
      existing.subscribers.add(subscriberId);
    } else {
      // Create new cache entry
      const limitedEvents = newEvents
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, this.options.maxCacheSize);

      this.cache.set(cacheKey, {
        id: cacheKey,
        filters,
        events: limitedEvents,
        lastUpdated: Date.now(),
        subscribers: new Set([subscriberId]),
        isActive: true,
      });
    }

    // Cleanup old entries if cache is getting too large
    if (this.cache.size > 50) {
      this.cleanupOldEntries();
    }
  }

  /**
   * Remove subscriber from cache
   */
  removeSubscriber(filters: NostrFilter[], subscriberId: string): void {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      cached.subscribers.delete(subscriberId);

      // Remove cache entry if no subscribers left
      if (cached.subscribers.size === 0) {
        cached.isActive = false;

        // Delayed removal to allow brief reconnections
        setTimeout(() => {
          const stillCached = this.cache.get(cacheKey);
          if (stillCached && stillCached.subscribers.size === 0) {
            this.cache.delete(cacheKey);
          }
        }, this.options.deduplicationWindow);
      }
    }
  }

  /**
   * Deduplicate events by ID
   */
  private deduplicateEvents(events: NostrEvent[]): NostrEvent[] {
    const seen = new Set<string>();
    return events.filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
  }

  /**
   * Clean up old cache entries
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.lastUpdated;

      if (age > this.options.maxCacheAge || !cached.isActive) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldEntries();
    }, 30000) as unknown as NodeJS.Timeout; // Clean up every 30 seconds
  }

  /**
   * Stop cleanup and clear cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalEvents = Array.from(this.cache.values()).reduce(
      (sum, cached) => sum + cached.events.length,
      0
    );

    return {
      cacheEntries: this.cache.size,
      totalEvents,
      activeSubscriptions: Array.from(this.cache.values()).filter(
        (cached) => cached.isActive
      ).length,
    };
  }
}

// Global cache instance
const subscriptionCache = new SubscriptionCache();

export { subscriptionCache, SubscriptionCache };
export type { SubscriptionCacheOptions };
