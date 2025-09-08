import { NOSTR_LIMITS } from "@/constants/nostr";
import { NostrEvent, nostrTools } from "@/internal-lib/ndk";
import { useEffect, useState } from "react";

/**
 * Hook for global Nostr event listening
 * Provides access to all events flowing through the connection
 */
export function useNostrGlobalEvents(
  onEvent?: (event: NostrEvent) => void,
  enabled: boolean = true
) {
  const [events, setEvents] = useState<NostrEvent[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = nostrTools.onEvent((event: NostrEvent) => {
      setEvents((prev) => {
        // Keep only the configured limit of events to prevent memory issues
        const newEvents = [event, ...prev].slice(
          0,
          NOSTR_LIMITS.MAX_EVENTS_IN_MEMORY
        );
        return newEvents;
      });
      onEvent?.(event);
    });

    return unsubscribe;
  }, [enabled, onEvent]);

  const clearEvents = () => setEvents([]);

  return {
    events,
    clearEvents,
  };
}
