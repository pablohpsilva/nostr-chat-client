import { useState, useEffect } from "react";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { NDKEvent, NDKUser, NDKKind } from "@nostr-dev-kit/ndk";
import { nip04 } from "nostr-tools";

import { getNDK } from "@/components/NDKHeadless";
import { getKeys } from "@/libs/local-storage";
import { useEncryptedDirectMessage } from "./useEncryptedDirectMessage";
const ndk = getNDK().getInstance();

/**
 * Hook to fetch and manage direct messages for the current user
 *
 * @returns Object containing direct messages state and helper functions
 */
export function useDirectMessages() {
  const currentUser = useNDKCurrentUser();
  const [masterPrivateKeyHex, setMasterPrivateKeyHex] = useState<string | null>(
    null
  );
  const {
    loadDirectMessages,
    decryptMessage,
    loading,
    error,
    directMessages,
    decryptedMessages,
    decryptedIdsRef,
    decryptSingleMessage,
  } = useEncryptedDirectMessage({ masterPrivateKeyHex });

  /**
   * Send a direct message to a user
   *
   * @param recipient The recipient's NDKUser object or pubkey string
   * @param content The message content to send
   * @returns The sent NDKEvent or null if sending failed
   */
  const sendDirectMessage = async (
    recipient: NDKUser | string,
    content: string
  ): Promise<NDKEvent | null> => {
    if (!currentUser?.pubkey) return null;

    try {
      const recipientUser =
        typeof recipient === "string"
          ? ndk.getUser({ pubkey: recipient })
          : recipient;

      // Create a new DM event
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.EncryptedDirectMessage;
      // event.content = content;
      event.content = nip04.encrypt(
        masterPrivateKeyHex!,
        recipientUser.pubkey,
        content
      );
      event.tags = [["p", recipientUser.pubkey]];

      console.log("event", event);

      // Encrypt and sign the event
      // await event.encrypt(recipientUser);

      // Publish the event
      await event.publish();

      return event;
    } catch (err) {
      console.error("Error sending direct message:", err);
      return null;
    }
  };

  /**
   * Get all messages for a conversation with a specific user
   *
   * @param pubkey The public key of the user to get messages for
   * @returns Array of NDKEvent objects for the conversation
   */
  const getConversation = (pubkey: string): NDKEvent[] => {
    return directMessages[pubkey] || [];
  };

  // Load direct messages when the current user changes
  useEffect(() => {
    if (currentUser?.pubkey) {
      getKeys().then(({ privateKey }) => {
        setMasterPrivateKeyHex(privateKey);
        loadDirectMessages();
      });
    }
  }, [currentUser?.pubkey]);

  return {
    directMessages,
    loading,
    error,
    sendDirectMessage,
    decryptMessage,
    getConversation,
    loadDirectMessages,
    decryptedMessages,
    decryptedIdsRef,
    decryptSingleMessage,
  };
}
