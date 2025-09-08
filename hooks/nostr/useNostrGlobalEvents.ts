import { NOSTR_LIMITS } from "@/constants/nostr";
import { NostrEvent, nostrTools } from "@/internal-lib/ndk";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for global Nostr event listening
 * Provides access to all events flowing through the connection
 */
export function useNostrGlobalEvents(
  onEvent?: (event: NostrEvent) => void,
  enabled: boolean = true
) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const onEventRef = useRef(onEvent);

  // Keep the ref updated but don't trigger re-subscriptions
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Memoized event handler to prevent unnecessary re-subscriptions
  const handleEvent = useCallback((event: NostrEvent) => {
    setEvents((prev) => {
      // Keep only the configured limit of events to prevent memory issues
      const newEvents = [event, ...prev].slice(
        0,
        NOSTR_LIMITS.MAX_EVENTS_IN_MEMORY
      );
      return newEvents;
    });
    onEventRef.current?.(event);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = nostrTools.onEvent(handleEvent);
    return unsubscribe;
  }, [enabled, handleEvent]);

  const clearEvents = () => setEvents([]);

  return {
    events,
    clearEvents,
  };
}
