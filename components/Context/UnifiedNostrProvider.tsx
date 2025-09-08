import NDK, {
  NDKEvent,
  NDKFilter,
  NDKNip07Signer,
  NDKNip46Signer,
  NDKPrivateKeySigner,
  NDKUser,
  NDKUserProfile,
} from "@nostr-dev-kit/ndk";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { NOSTR_ERROR_CODES, NOSTR_TIMEOUTS } from "@/constants/nostr";
import { errorHandler } from "@/utils/errorHandling";
import { useSubscriptionManager } from "@/utils/subscriptionManager";
import { _loginWithNip07, _loginWithNip46, _loginWithSecret } from "./signers";
import { Users } from "./Users";

/**
 * Unified Nostr Context Interface
 * Consolidates the best features from both NDK and nostr-tools implementations
 */
interface UnifiedNostrContext {
  // Core NDK instance and state
  ndk: NDK | undefined;
  signer: NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer | undefined;
  currentUser: NDKUser | undefined;
  isInitialized: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  loginWithSecret: (skOrNsec: string) => Promise<
    | {
        npub: string;
        sk: string;
        signer: NDKPrivateKeySigner;
      }
    | undefined
  >;
  loginWithNip46: (
    npub: string,
    sk?: string
  ) => Promise<
    | {
        npub: string;
        sk: string | undefined;
        token: string;
        remoteSigner: NDKNip46Signer;
        localSigner: NDKPrivateKeySigner;
      }
    | undefined
  >;
  loginWithNip07: () => Promise<
    | {
        npub: string;
        signer: NDKNip07Signer;
      }
    | undefined
  >;
  logout: () => Promise<void>;

  // Event operations
  fetchEvents: (filter: NDKFilter) => Promise<NDKEvent[]>;
  signPublishEvent: (
    event: NDKEvent,
    params?: {
      repost?: boolean;
      publish?: boolean;
      sign?: boolean;
    }
  ) => Promise<NDKEvent | undefined>;

  // Subscription management (improved)
  subscribe: (
    filters: NDKFilter[],
    onEvent: (event: NDKEvent) => void,
    onEose?: () => void,
    options?: {
      relayUrls?: string[];
      timeoutMs?: number;
      id?: string;
    }
  ) => string;
  unsubscribe: (subscriptionId: string) => boolean;
  getActiveSubscriptionCount: () => number;

  // User management
  getUser: (pubkey: string) => NDKUser;
  getProfile: (pubkey: string) => NDKUserProfile;

  // Relay management
  relays: string[];
  addRelay: (relayUrl: string) => Promise<void>;
  removeRelay: (relayUrl: string) => Promise<void>;
  reconnectToRelays: () => Promise<void>;

  // Error handling
  clearError: () => void;
}

const UnifiedNostrContext = createContext<UnifiedNostrContext | undefined>(
  undefined
);

interface UnifiedNostrProviderProps {
  relayUrls?: string[];
  autoConnect?: boolean;
}

/**
 * Unified Nostr Provider
 * Consolidates NDK functionality with improved subscription management and error handling
 */
export function UnifiedNostrProvider({
  children,
  relayUrls = [],
  autoConnect = true,
}: PropsWithChildren<UnifiedNostrProviderProps>) {
  // Core state
  const [ndk, setNdk] = useState<NDK | undefined>(undefined);
  const [signer, setSigner] = useState<
    NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer | undefined
  >(undefined);
  const [currentUser, setCurrentUser] = useState<NDKUser | undefined>(
    undefined
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relays, setRelays] = useState<string[]>(relayUrls);

  // Subscription management
  const subscriptionManager = useSubscriptionManager();

  // User management
  const { getUser, getProfile } = Users(ndk);

  // Initialize NDK
  const initializeNdk = useCallback(
    async (
      explicitRelayUrls: string[],
      newSigner?: NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const ndkInstance = new NDK({
          explicitRelayUrls,
          signer: newSigner,
        });

        await ndkInstance.connect();

        setNdk(ndkInstance);
        setRelays(explicitRelayUrls);
        setIsConnected(true);
        setIsInitialized(true);

        if (newSigner) {
          setSigner(newSigner);
          const user = await newSigner.user();
          setCurrentUser(user);
        }

        console.log(
          `✅ NDK initialized with ${explicitRelayUrls.length} relays`
        );
      } catch (err) {
        const error = errorHandler.createError(
          NOSTR_ERROR_CODES.CONNECTION_FAILED,
          "Failed to initialize NDK",
          { relayUrls: explicitRelayUrls }
        );
        errorHandler.handle(error, "UnifiedNostrProvider.initializeNdk");
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Authentication methods
  const loginWithSecret = useCallback(
    async (skOrNsec: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await _loginWithSecret(skOrNsec);
        if (result) {
          await initializeNdk(relays, result.signer);
          return result;
        }
      } catch (err) {
        const error = errorHandler.authenticationError((err as Error).message);
        errorHandler.handle(error, "UnifiedNostrProvider.loginWithSecret");
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [relays, initializeNdk]
  );

  const loginWithNip46 = useCallback(
    async (npub: string, sk?: string) => {
      if (!ndk) {
        throw errorHandler.createError(
          NOSTR_ERROR_CODES.CONNECTION_FAILED,
          "NDK not initialized"
        );
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await _loginWithNip46(ndk, npub, sk);
        if (result) {
          setSigner(result.remoteSigner);
          setCurrentUser(await result.remoteSigner.user());
          return result;
        }
      } catch (err) {
        const error = errorHandler.authenticationError((err as Error).message);
        errorHandler.handle(error, "UnifiedNostrProvider.loginWithNip46");
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [ndk]
  );

  const loginWithNip07 = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await _loginWithNip07();
      if (result) {
        await initializeNdk(relays, result.signer);
        return result;
      }
    } catch (err) {
      const error = errorHandler.authenticationError((err as Error).message);
      errorHandler.handle(error, "UnifiedNostrProvider.loginWithNip07");
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [relays, initializeNdk]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clean up all subscriptions
      subscriptionManager.getActiveIds().forEach((id) => {
        subscriptionManager.unsubscribe(id);
      });

      // Reset state
      setSigner(undefined);
      setCurrentUser(undefined);

      // Reinitialize NDK without signer
      if (relays.length > 0) {
        await initializeNdk(relays);
      }
    } catch (err) {
      errorHandler.handle(err as Error, "UnifiedNostrProvider.logout");
    } finally {
      setIsLoading(false);
    }
  }, [relays, initializeNdk, subscriptionManager]);

  // Event operations
  const fetchEvents = useCallback(
    async (filter: NDKFilter): Promise<NDKEvent[]> => {
      if (!ndk) {
        throw errorHandler.createError(
          NOSTR_ERROR_CODES.CONNECTION_FAILED,
          "NDK not initialized"
        );
      }

      return new Promise((resolve, reject) => {
        const events: Map<string, NDKEvent> = new Map();
        const timeoutId = setTimeout(() => {
          reject(errorHandler.timeoutError("fetchEvents"));
        }, NOSTR_TIMEOUTS.SUBSCRIPTION_TIMEOUT);

        try {
          const subscription = ndk.subscribe(filter, {
            closeOnEose: true,
          });

          subscription.on("event", (event: NDKEvent) => {
            event.ndk = ndk;
            events.set(event.tagId(), event);
          });

          subscription.on("eose", () => {
            clearTimeout(timeoutId);
            resolve(Array.from(events.values()));
          });
        } catch (err) {
          clearTimeout(timeoutId);
          reject(err);
        }
      });
    },
    [ndk]
  );

  const signPublishEvent = useCallback(
    async (
      event: NDKEvent,
      params: { repost?: boolean; publish?: boolean; sign?: boolean } = {
        repost: false,
        sign: true,
        publish: true,
      }
    ) => {
      if (!ndk) {
        throw errorHandler.createError(
          NOSTR_ERROR_CODES.CONNECTION_FAILED,
          "NDK not initialized"
        );
      }

      try {
        event.ndk = ndk;

        if (params.repost) {
          await event.repost();
        }
        if (params.sign) {
          await event.sign();
        }
        if (params.publish) {
          await event.publish();
        }

        return event;
      } catch (err) {
        const error = errorHandler.publishError((err as Error).message);
        errorHandler.handle(error, "UnifiedNostrProvider.signPublishEvent");
        throw error;
      }
    },
    [ndk]
  );

  // Improved subscription management
  const subscribe = useCallback(
    (
      filters: NDKFilter[],
      onEvent: (event: NDKEvent) => void,
      onEose?: () => void,
      options: {
        relayUrls?: string[];
        timeoutMs?: number;
        id?: string;
      } = {}
    ): string => {
      if (!ndk) {
        throw errorHandler.createError(
          NOSTR_ERROR_CODES.CONNECTION_FAILED,
          "NDK not initialized"
        );
      }

      const subscriptionId =
        options.id ||
        `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      try {
        const subscription = ndk.subscribe(filters, {
          closeOnEose: false,
          ...options,
        });

        subscription.on("event", onEvent);
        if (onEose) {
          subscription.on("eose", onEose);
        }

        subscriptionManager.subscribe(
          subscriptionId,
          subscription,
          options.timeoutMs
        );

        return subscriptionId;
      } catch (err) {
        const error = errorHandler.createError(
          NOSTR_ERROR_CODES.SUBSCRIPTION_FAILED,
          `Failed to create subscription: ${(err as Error).message}`,
          { filters, subscriptionId }
        );
        errorHandler.handle(error, "UnifiedNostrProvider.subscribe");
        throw error;
      }
    },
    [ndk, subscriptionManager]
  );

  const unsubscribe = useCallback(
    (subscriptionId: string): boolean => {
      return subscriptionManager.unsubscribe(subscriptionId);
    },
    [subscriptionManager]
  );

  const getActiveSubscriptionCount = useCallback(() => {
    return subscriptionManager.getActiveCount();
  }, [subscriptionManager]);

  // Relay management
  const addRelay = useCallback(
    async (relayUrl: string) => {
      if (!relays.includes(relayUrl)) {
        const newRelays = [...relays, relayUrl];
        setRelays(newRelays);

        if (ndk) {
          // Reinitialize with new relays
          await initializeNdk(newRelays, signer);
        }
      }
    },
    [relays, ndk, signer, initializeNdk]
  );

  const removeRelay = useCallback(
    async (relayUrl: string) => {
      const newRelays = relays.filter((url) => url !== relayUrl);
      setRelays(newRelays);

      if (ndk && newRelays.length > 0) {
        // Reinitialize with remaining relays
        await initializeNdk(newRelays, signer);
      }
    },
    [relays, ndk, signer, initializeNdk]
  );

  const reconnectToRelays = useCallback(async () => {
    if (relays.length > 0) {
      await initializeNdk(relays, signer);
    }
  }, [relays, signer, initializeNdk]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoConnect && relays.length > 0 && !isInitialized) {
      initializeNdk(relays).catch(console.error);
    }
  }, [autoConnect, relays, isInitialized, initializeNdk]);

  const contextValue: UnifiedNostrContext = {
    // Core state
    ndk,
    signer,
    currentUser,
    isInitialized,
    isConnected,
    isLoading,
    error,

    // Authentication
    loginWithSecret,
    loginWithNip46,
    loginWithNip07,
    logout,

    // Event operations
    fetchEvents,
    signPublishEvent,

    // Subscription management
    subscribe,
    unsubscribe,
    getActiveSubscriptionCount,

    // User management
    getUser,
    getProfile,

    // Relay management
    relays,
    addRelay,
    removeRelay,
    reconnectToRelays,

    // Error handling
    clearError,
  };

  return (
    <UnifiedNostrContext.Provider value={contextValue}>
      {children}
    </UnifiedNostrContext.Provider>
  );
}

/**
 * Hook to use the unified Nostr context
 */
export function useUnifiedNostr(): UnifiedNostrContext {
  const context = useContext(UnifiedNostrContext);
  if (context === undefined) {
    throw new Error(
      "useUnifiedNostr must be used within a UnifiedNostrProvider"
    );
  }
  return context;
}

// Export for backward compatibility
export { useUnifiedNostr as useNostr };
