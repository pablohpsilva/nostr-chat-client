import { NOSTR_TIMEOUTS } from "@/constants/nostr";
import { NDKSubscription } from "@nostr-dev-kit/ndk-hooks";
import { useCallback, useEffect, useRef } from "react";
import { errorHandler } from "./errorHandling";

/**
 * Subscription manager to handle NDK subscriptions with proper cleanup
 * Fixes memory leaks from global subscription variables
 */
export class SubscriptionManager {
  private subscriptions = new Map<string, NDKSubscription>();
  private isDestroyed = false;

  /**
   * Create a new subscription with automatic cleanup
   */
  subscribe(
    id: string,
    subscription: NDKSubscription,
    timeoutMs: number = NOSTR_TIMEOUTS.SUBSCRIPTION_TIMEOUT
  ): string {
    if (this.isDestroyed) {
      throw new Error("SubscriptionManager has been destroyed");
    }

    // Clean up existing subscription with same ID
    this.unsubscribe(id);

    // Store the subscription
    this.subscriptions.set(id, subscription);

    // Set up automatic timeout cleanup
    const timeoutId = setTimeout(() => {
      console.warn(`Subscription ${id} timed out after ${timeoutMs}ms`);
      this.unsubscribe(id);
    }, timeoutMs);

    // Clean up timeout when subscription ends
    const originalStop = subscription.stop?.bind(subscription);
    subscription.stop = () => {
      clearTimeout(timeoutId);
      originalStop?.();
    };

    return id;
  }

  /**
   * Unsubscribe and clean up a specific subscription
   */
  unsubscribe(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      try {
        subscription.stop?.();
      } catch (error) {
        errorHandler.handle(
          error as Error,
          `SubscriptionManager.unsubscribe(${id})`
        );
      }
      this.subscriptions.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get active subscription count
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if a subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    const subscriptionIds = Array.from(this.subscriptions.keys());

    subscriptionIds.forEach((id) => {
      this.unsubscribe(id);
    });

    this.subscriptions.clear();
    this.isDestroyed = true;
  }
}

/**
 * React hook for managing subscriptions with automatic cleanup
 */
export function useSubscriptionManager() {
  const managerRef = useRef<SubscriptionManager | null>(null);

  // Initialize manager on first use
  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager();
  }

  const subscribe = useCallback(
    (id: string, subscription: NDKSubscription, timeoutMs?: number) => {
      return managerRef.current?.subscribe(id, subscription, timeoutMs) || "";
    },
    []
  );

  const unsubscribe = useCallback((id: string) => {
    return managerRef.current?.unsubscribe(id) || false;
  }, []);

  const getActiveCount = useCallback(() => {
    return managerRef.current?.getActiveCount() || 0;
  }, []);

  const hasSubscription = useCallback((id: string) => {
    return managerRef.current?.hasSubscription(id) || false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.cleanup();
      managerRef.current = null;
    };
  }, []);

  return {
    subscribe,
    unsubscribe,
    getActiveCount,
    hasSubscription,
  };
}

/**
 * Utility to generate unique subscription IDs
 */
export function generateSubscriptionId(prefix = "sub"): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

/**
 * Debounced subscription utility to prevent rapid subscription changes
 */
export class DebouncedSubscriptionManager extends SubscriptionManager {
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  subscribe(
    id: string,
    subscription: NDKSubscription,
    timeoutMs = NOSTR_TIMEOUTS.SUBSCRIPTION_TIMEOUT,
    debounceMs = NOSTR_TIMEOUTS.MESSAGE_DEBOUNCE
  ): string {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce the subscription
    const timer = setTimeout(() => {
      super.subscribe(id, subscription, timeoutMs);
      this.debounceTimers.delete(id);
    }, debounceMs) as unknown as NodeJS.Timeout;

    this.debounceTimers.set(id, timer);
    return id;
  }

  cleanup(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    super.cleanup();
  }
}
