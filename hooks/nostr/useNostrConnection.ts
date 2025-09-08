import { NOSTR_ERROR_CODES } from "@/constants/nostr";
import { nostrTools, NostrUser, RelayInfo } from "@/internal-lib/ndk";
import { errorHandler } from "@/utils/errorHandling";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook for managing Nostr connection and authentication
 * Handles initialization, login, logout, and connection state
 */
export function useNostrConnection() {
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
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.CONNECTION_FAILED,
        err instanceof Error
          ? err.message
          : "Failed to initialize nostr connection"
      );
      errorHandler.handle(error, "useNostrConnection.initialize");
      setError(error.message);
      throw error;
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
      const error = errorHandler.authenticationError(
        err instanceof Error ? err.message : "Login failed"
      );
      errorHandler.handle(error, "useNostrConnection.login");
      setError(error.message);
      throw error;
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
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.AUTHENTICATION_FAILED,
        err instanceof Error ? err.message : "Failed to generate account"
      );
      errorHandler.handle(error, "useNostrConnection.generateAccount");
      setError(error.message);
      throw error;
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
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.AUTHENTICATION_FAILED,
        err instanceof Error ? err.message : "Logout failed"
      );
      errorHandler.handle(error, "useNostrConnection.logout");
      setError(error.message);
      throw error;
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
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.RELAY_ERROR,
        err instanceof Error ? err.message : "Failed to add relay"
      );
      errorHandler.handle(error, "useNostrConnection.addRelay");
      setError(error.message);
      throw error;
    }
  }, []);

  // Remove relay
  const removeRelay = useCallback(async (relayUrl: string) => {
    try {
      setError(null);
      await nostrTools.removeRelay(relayUrl);
      setRelays(nostrTools.getRelayInfo());
    } catch (err) {
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.RELAY_ERROR,
        err instanceof Error ? err.message : "Failed to remove relay"
      );
      errorHandler.handle(error, "useNostrConnection.removeRelay");
      setError(error.message);
      throw error;
    }
  }, []);

  // Force reconnect to relays
  const reconnectToRelays = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await nostrTools.reconnectToRelays();
    } catch (err) {
      const error = errorHandler.connectionError();
      errorHandler.handle(error, "useNostrConnection.reconnectToRelays");
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
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

  const clearError = useCallback(() => setError(null), []);

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
    clearError,
  };
}
