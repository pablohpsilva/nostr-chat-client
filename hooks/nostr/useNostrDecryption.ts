import { NostrEvent, nostrTools } from "@/internal-lib/ndk";
import { errorHandler } from "@/utils/errorHandling";
import { useCallback, useState } from "react";

/**
 * Hook for Nostr message decryption
 * Handles both NIP-04 and NIP-44 decryption standards
 */
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
      const error = errorHandler.decryptionError(
        err instanceof Error ? err.message : "Failed to decrypt message"
      );
      errorHandler.handle(error, "useNostrDecryption.decryptDirectMessage");
      setError(error.message);
      throw error;
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
      const error = errorHandler.decryptionError(
        err instanceof Error ? err.message : "Failed to decrypt private message"
      );
      errorHandler.handle(
        error,
        "useNostrDecryption.decryptPrivateDirectMessage"
      );
      setError(error.message);
      throw error;
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isDecrypting,
    error,
    decryptDirectMessage,
    decryptPrivateDirectMessage,
    clearError,
  };
}
