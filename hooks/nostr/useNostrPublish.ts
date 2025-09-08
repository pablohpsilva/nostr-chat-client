import { nostrTools } from "@/internal-lib/ndk";
import { errorHandler } from "@/utils/errorHandling";
import { useCallback, useState } from "react";

/**
 * Hook for publishing Nostr events
 * Handles text notes, direct messages, and profile updates
 */
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
      const error = errorHandler.publishError(
        err instanceof Error ? err.message : "Failed to publish event"
      );
      errorHandler.handle(error, "useNostrPublish.publishEvent");
      setError(error.message);
      throw error;
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
        const error = errorHandler.publishError(
          err instanceof Error ? err.message : "Failed to send note"
        );
        errorHandler.handle(error, "useNostrPublish.sendTextNote");
        setError(error.message);
        throw error;
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
        const error = errorHandler.publishError(
          err instanceof Error ? err.message : "Failed to send direct message"
        );
        errorHandler.handle(error, "useNostrPublish.sendDirectMessage");
        setError(error.message);
        throw error;
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
        const error = errorHandler.publishError(
          err instanceof Error ? err.message : "Failed to send private message"
        );
        errorHandler.handle(error, "useNostrPublish.sendPrivateDirectMessage");
        setError(error.message);
        throw error;
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
        const error = errorHandler.publishError(
          err instanceof Error ? err.message : "Failed to update profile"
        );
        errorHandler.handle(error, "useNostrPublish.updateProfile");
        setError(error.message);
        throw error;
      } finally {
        setIsPublishing(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    isPublishing,
    error,
    publishEvent,
    sendTextNote,
    sendDirectMessage,
    sendPrivateDirectMessage,
    updateProfile,
    clearError,
  };
}
