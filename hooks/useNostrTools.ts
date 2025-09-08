import { ReplyTo } from "@/constants/types";
import {
  NostrEvent,
  NostrFilter,
  nostrTools,
  NostrUser,
  RelayInfo,
} from "@/interal-lib/ndk";
import { useCallback, useEffect, useRef, useState } from "react";

// Hook for main nostr connection and authentication
export function useNostrTools() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<NostrUser | null>(null);
  const [relays, setRelays] = useState<RelayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize nostr connection
  const initialize = useCallback(async (relayUrls?: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await nostrTools.initialize(relayUrls);
      setIsInitialized(true);
      setCurrentUser(nostrTools.getCurrentUser());
      setRelays(nostrTools.getRelayInfo());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initialize nostr connection"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login with private key
  const login = useCallback(async (privateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await nostrTools.login(privateKey);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new account
  const generateAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await nostrTools.generateAccount();
      setCurrentUser(user);
      return user;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate account";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await nostrTools.logout();
      setCurrentUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add relay
  const addRelay = useCallback(async (relayUrl: string) => {
    try {
      setError(null);
      await nostrTools.addRelay(relayUrl);
      setRelays(nostrTools.getRelayInfo());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add relay";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Remove relay
  const removeRelay = useCallback(async (relayUrl: string) => {
    try {
      setError(null);
      await nostrTools.removeRelay(relayUrl);
      setRelays(nostrTools.getRelayInfo());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove relay";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Set up connection status listener
  useEffect(() => {
    const unsubscribe = nostrTools.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        setRelays(nostrTools.getRelayInfo());
      }
    });

    return unsubscribe;
  }, []);

  // Force reconnect to relays
  const reconnectToRelays = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await nostrTools.reconnectToRelays();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reconnect to relays";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isInitialized,
    isConnected,
    currentUser,
    relays,
    isLoading,
    error,
    isLoggedIn: nostrTools.isLoggedIn(),

    // Actions
    initialize,
    login,
    generateAccount,
    logout,
    addRelay,
    removeRelay,
    reconnectToRelays,
    clearError: () => setError(null),
  };
}

// Hook for subscribing to events
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
      setError(err instanceof Error ? err.message : "Subscription failed");
      setIsLoading(false);
    }

    return () => {
      if (subscriptionRef.current) {
        nostrTools.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled, JSON.stringify(filters), JSON.stringify(relayUrls)]);

  return {
    events,
    isLoading,
    error,
    refetch: () => {
      setEvents([]);
      setIsLoading(true);
    },
  };
}

// Hook for publishing events
export function useNostrPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishEvent = useCallback(async (event: any, relayUrls?: string[]) => {
    try {
      setIsPublishing(true);
      setError(null);
      const publishedEvent = await nostrTools.publishEvent(event, relayUrls);
      return publishedEvent;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to publish event";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  }, []);

  const sendTextNote = useCallback(
    async (content: string, tags: string[][] = []) => {
      try {
        setIsPublishing(true);
        setError(null);
        const event = await nostrTools.sendTextNote(content, tags);
        return event;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send note";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  const sendDirectMessage = useCallback(
    async (recipientPubkey: string, message: string) => {
      try {
        setIsPublishing(true);
        setError(null);
        const event = await nostrTools.sendDirectMessage(
          recipientPubkey,
          message
        );
        return event;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send direct message";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  const sendPrivateDirectMessage = useCallback(
    async (recipientPubkey: string, message: string) => {
      try {
        setIsPublishing(true);
        setError(null);
        const event = await nostrTools.sendPrivateDirectMessage(
          recipientPubkey,
          message
        );
        return event;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send private message";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (profile: {
      name?: string;
      about?: string;
      picture?: string;
      nip05?: string;
      banner?: string;
      website?: string;
      lud16?: string;
    }) => {
      try {
        setIsPublishing(true);
        setError(null);
        const event = await nostrTools.updateProfile(profile);
        return event;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  return {
    isPublishing,
    error,
    publishEvent,
    sendTextNote,
    sendDirectMessage,
    sendPrivateDirectMessage,
    updateProfile,
    clearError: () => setError(null),
  };
}

// Hook for publishing events
export function useNostrPublishNip17() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      conversationTitle?: string,
      replyTo?: ReplyTo,
      relayUrls?: string[]
    ) => {
      try {
        setIsPublishing(true);
        setError(null);
        const publishedEvent = await nostrTools.sendNip17DirectMessage(
          // recipientPubkey,
          "000ce6323f7789c48099bbd7da7248634d3310b170992ab15dbdd677c91ed287",
          message,
          conversationTitle,
          replyTo,
          relayUrls
        );
        return publishedEvent;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to publish event";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  return {
    isPublishing,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
}

// Hook for fetching events
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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch events";
        setError(errorMessage);
        throw new Error(errorMessage);
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
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user profile";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getEvents,
    getUserProfile,
    clearError: () => setError(null),
  };
}

// Hook for direct message decryption
export function useNostrDecryption() {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decryptDirectMessage = useCallback(async (event: NostrEvent) => {
    try {
      setIsDecrypting(true);
      setError(null);
      const decryptedMessage = await nostrTools.decryptDirectMessage(event);
      return decryptedMessage;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decrypt message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  const decryptPrivateDirectMessage = useCallback(async (event: NostrEvent) => {
    try {
      setIsDecrypting(true);
      setError(null);
      const decryptedMessage = await nostrTools.decryptPrivateDirectMessage(
        event
      );
      return decryptedMessage;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to decrypt private message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  return {
    isDecrypting,
    error,
    decryptDirectMessage,
    decryptPrivateDirectMessage,
    clearError: () => setError(null),
  };
}

// Hook for global event listening
export function useNostrGlobalEvents(
  onEvent?: (event: NostrEvent) => void,
  enabled: boolean = true
) {
  const [events, setEvents] = useState<NostrEvent[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = nostrTools.onEvent((event: NostrEvent) => {
      setEvents((prev) => {
        // Keep only the last 100 events to prevent memory issues
        const newEvents = [event, ...prev].slice(0, 100);
        return newEvents;
      });
      onEvent?.(event);
    });

    return unsubscribe;
  }, [enabled, onEvent]);

  return {
    events,
    clearEvents: () => setEvents([]),
  };
}
