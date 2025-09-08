import { NOSTR_ERROR_CODES } from "@/constants/nostr";
import { NostrEvent, NostrFilter, nostrTools } from "@/internal-lib/ndk";
import { errorHandler } from "@/utils/errorHandling";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for subscribing to Nostr events
 * Provides real-time event streaming with proper cleanup
 */
export function useNostrSubscription(
  filters: NostrFilter[],
  options: {
    enabled?: boolean;
    relayUrls?: string[];
    onEvent?: (event: NostrEvent) => void;
    onEose?: () => void;
  } = {}
) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  const { enabled = true, relayUrls, onEvent, onEose } = options;

  useEffect(() => {
    if (!enabled || !filters.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionId = nostrTools.subscribe(
        filters,
        (event: NostrEvent) => {
          setEvents((prev) => {
            // Prevent duplicates
            const exists = prev.some((e) => e.id === event.id);
            if (exists) return prev;

            // Add new event and sort by created_at
            const newEvents = [...prev, event].sort(
              (a, b) => b.created_at - a.created_at
            );
            return newEvents;
          });
          onEvent?.(event);
        },
        () => {
          setIsLoading(false);
          onEose?.();
        },
        relayUrls
      );

      subscriptionRef.current = subscriptionId;
    } catch (err) {
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.SUBSCRIPTION_FAILED,
        err instanceof Error ? err.message : "Subscription failed"
      );
      errorHandler.handle(error, "useNostrSubscription");
      setError(error.message);
      setIsLoading(false);
    }

    return () => {
      if (subscriptionRef.current) {
        nostrTools.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled, JSON.stringify(filters), JSON.stringify(relayUrls)]);

  const refetch = useCallback(() => {
    setEvents([]);
    setIsLoading(true);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    events,
    isLoading,
    error,
    refetch,
    clearError,
  };
}

/**
 * Hook for one-time event fetching
 * Gets events once and returns them without maintaining a subscription
 */
export function useNostrEvents() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEvents = useCallback(
    async (filters: NostrFilter[], relayUrls?: string[]) => {
      try {
        setIsLoading(true);
        setError(null);
        const events = await nostrTools.getEvents(filters, relayUrls);
        return events;
      } catch (err) {
        const error = errorHandler.createError(
          NOSTR_ERROR_CODES.SUBSCRIPTION_FAILED,
          err instanceof Error ? err.message : "Failed to fetch events"
        );
        errorHandler.handle(error, "useNostrEvents.getEvents");
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getUserProfile = useCallback(async (pubkey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await nostrTools.getUserProfile(pubkey);
      return profile;
    } catch (err) {
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.SUBSCRIPTION_FAILED,
        err instanceof Error ? err.message : "Failed to fetch user profile"
      );
      errorHandler.handle(error, "useNostrEvents.getUserProfile");
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isLoading,
    error,
    getEvents,
    getUserProfile,
    clearError,
  };
}
