import { NOSTR_DEFAULTS } from "@/constants/nostr";
import { ReplyTo } from "@/constants/types";
import { nostrTools } from "@/internal-lib/ndk";
import { errorHandler } from "@/utils/errorHandling";
import { useCallback, useState } from "react";

/**
 * Hook for publishing NIP-17 private direct messages
 * Handles gift-wrapped encrypted messages with enhanced privacy
 */
export function useNostrPublishNip17() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      message: string,
      conversationTitle?: string,
      replyTo?: ReplyTo,
      relayUrls?: string[],
      recipientPubkey?: string
    ) => {
      try {
        setIsPublishing(true);
        setError(null);

        // Use provided recipient or fall back to default
        const recipient =
          recipientPubkey || NOSTR_DEFAULTS.DEFAULT_CHAT_RECIPIENT;

        const publishedEvent = await nostrTools.sendNip17DirectMessage(
          recipient,
          message,
          conversationTitle,
          replyTo,
          relayUrls
        );
        return publishedEvent;
      } catch (err) {
        const error = errorHandler.publishError(
          err instanceof Error
            ? err.message
            : "Failed to publish NIP-17 message"
        );
        errorHandler.handle(error, "useNostrPublishNip17.sendMessage");
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
    sendMessage,
    clearError,
  };
}
