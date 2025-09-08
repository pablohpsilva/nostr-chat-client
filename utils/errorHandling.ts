import { NOSTR_ERROR_CODES, NostrErrorCode } from "@/constants/nostr";
import { Alert, Platform } from "react-native";

/**
 * Custom error class for Nostr-related errors
 */
export class NostrError extends Error {
  constructor(
    message: string,
    public code: NostrErrorCode,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "NostrError";
  }
}

/**
 * Error handling utilities for consistent error management
 */
export const errorHandler = {
  /**
   * Handle and log errors consistently
   */
  handle: (error: Error | NostrError, context?: string) => {
    const errorMessage =
      error instanceof NostrError
        ? `[${error.code}] ${error.message}`
        : error.message;

    const logContext = context ? `[${context}]` : "[NostrError]";
    console.error(logContext, errorMessage);

    if (error instanceof NostrError && error.context) {
      console.error("Error context:", error.context);
    }

    // TODO: Add crash analytics logging here
    // crashlytics().recordError(error);
  },

  /**
   * Show user-friendly error messages
   */
  showUserError: (message: string, title = "Error") => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  },

  /**
   * Show user confirmation dialogs
   */
  showConfirmation: (
    message: string,
    onConfirm: () => void,
    title = "Confirm"
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === "web") {
        const result = window.confirm(`${title}: ${message}`);
        if (result) onConfirm();
        resolve(result);
      } else {
        Alert.alert(title, message, [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Confirm",
            style: "destructive",
            onPress: () => {
              onConfirm();
              resolve(true);
            },
          },
        ]);
      }
    });
  },

  /**
   * Create NostrError instances with proper typing
   */
  createError: (
    code: NostrErrorCode,
    message: string,
    context?: Record<string, any>
  ): NostrError => {
    return new NostrError(message, code, context);
  },

  /**
   * Common error creators for frequent scenarios
   */
  connectionError: (relayUrl?: string): NostrError => {
    return new NostrError(
      `Failed to connect to relay${relayUrl ? `: ${relayUrl}` : ""}`,
      NOSTR_ERROR_CODES.CONNECTION_FAILED,
      { relayUrl }
    );
  },

  publishError: (reason?: string): NostrError => {
    return new NostrError(
      `Failed to publish event${reason ? `: ${reason}` : ""}`,
      NOSTR_ERROR_CODES.PUBLISH_FAILED,
      { reason }
    );
  },

  authenticationError: (reason?: string): NostrError => {
    return new NostrError(
      `Authentication failed${reason ? `: ${reason}` : ""}`,
      NOSTR_ERROR_CODES.AUTHENTICATION_FAILED,
      { reason }
    );
  },

  encryptionError: (reason?: string): NostrError => {
    return new NostrError(
      `Encryption failed${reason ? `: ${reason}` : ""}`,
      NOSTR_ERROR_CODES.ENCRYPTION_FAILED,
      { reason }
    );
  },

  decryptionError: (reason?: string): NostrError => {
    return new NostrError(
      `Decryption failed${reason ? `: ${reason}` : ""}`,
      NOSTR_ERROR_CODES.DECRYPTION_FAILED,
      { reason }
    );
  },

  timeoutError: (operation?: string): NostrError => {
    return new NostrError(
      `Operation timed out${operation ? `: ${operation}` : ""}`,
      NOSTR_ERROR_CODES.TIMEOUT,
      { operation }
    );
  },
};

/**
 * Utility to wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handle(error as Error, context);
      throw error;
    }
  };
}

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
