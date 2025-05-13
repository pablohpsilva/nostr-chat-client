import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscriptionOptions,
} from "@nostr-dev-kit/ndk";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { nip04 } from "nostr-tools";
import { useRef, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";

const ndk = getNDK().getInstance();

export function useEncryptedDirectMessage({
  masterPrivateKeyHex,
}: {
  masterPrivateKeyHex: string | null;
}) {
  const currentUser = useNDKCurrentUser();
  const [directMessages, setDirectMessages] = useState<
    Record<string, NDKEvent[]>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const decryptedIdsRef = useRef<Set<string>>(new Set());
  const [decryptedMessages, setDecryptedMessages] = useState<
    Record<string, string>
  >({});
  /**
   * Load all direct messages for the current user
   */
  const loadDirectMessages = async () => {
    if (!currentUser?.pubkey) {
      return;
    }

    try {
      setLoading(true);

      // Filter for encrypted DMs (kind 4) sent from the current user
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        authors: [currentUser.pubkey],
      };

      // Filter for encrypted DMs (kind 4) sent to the current user
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [currentUser.pubkey],
      };

      // console.log("DM Filters:", { outgoingFilter, incomingFilter });

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
      };

      // Create a map to organize messages by conversation partner
      const messagesByUser: Record<string, NDKEvent[]> = {};

      // Function to add a message to the conversation map
      const addMessageToConversation = (
        event: NDKEvent,
        partnerPubkey: string
      ) => {
        if (!messagesByUser[partnerPubkey]) {
          messagesByUser[partnerPubkey] = [];
        }

        // Add message if it doesn't already exist
        if (!messagesByUser[partnerPubkey].some((msg) => msg.id === event.id)) {
          messagesByUser[partnerPubkey] = [
            ...messagesByUser[partnerPubkey],
            event,
          ];

          // Sort messages by timestamp
          messagesByUser[partnerPubkey].sort(
            (a, b) => a.created_at! - b.created_at!
          );

          // Update state
          setDirectMessages({ ...messagesByUser });
        }
      };

      // Subscribe to outgoing messages (from the current user)
      const outgoingSub = ndk.subscribe(outgoingFilter, options);
      // Subscribe to incoming messages (to the current user)
      const incomingSub = ndk.subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // console.log("Outgoing message received:", event);
        // For outgoing messages, the p tag contains the recipient
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];

        if (recipientPubkey) {
          addMessageToConversation(event, recipientPubkey);
        }
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // console.log("Incoming message received:", event);
        // For incoming messages, the author is the sender
        const senderPubkey = event.pubkey;

        if (senderPubkey) {
          addMessageToConversation(event, senderPubkey);
        }
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", () => {
        console.log("Outgoing messages EOSE received");
        setLoading(false);
      });

      incomingSub.on("eose", () => {
        console.log("Incoming messages EOSE received");
        setLoading(false);
      });

      return () => {
        // Clean up subscriptions when the hook unmounts
        outgoingSub.stop();
        incomingSub.stop();
      };
    } catch (err) {
      console.error("Error loading direct messages:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load direct messages")
      );
      setLoading(false);
    }
  };

  /**
   * Decrypt the content of a direct message
   *
   * @param event The encrypted event to decrypt
   * @returns The decrypted content or null if decryption fails
   */
  const decryptMessage = async (event: NDKEvent): Promise<string | null> => {
    if (!currentUser?.pubkey) return null;

    try {
      // For messages sent by the current user
      if (event.pubkey === currentUser.pubkey) {
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        if (recipientPubkey) {
          const recipient = ndk.getUser({ pubkey: recipientPubkey });

          // return await event.decrypt(recipient);
          return nip04.decrypt(
            masterPrivateKeyHex!,
            recipient.pubkey,
            event.content
          );
        }
      }
      // For messages received by the current user
      else {
        const sender = ndk.getUser({ pubkey: event.pubkey });
        // return await event.decrypt(sender);
        return nip04.decrypt(
          masterPrivateKeyHex!,
          sender.pubkey,
          event.content
        );
      }

      return null;
    } catch (err) {
      console.error("Error decrypting message:", err);
      return null;
    }
  };

  // Memoized function to decrypt a single message
  const decryptSingleMessage = async (message: NDKEvent): Promise<void> => {
    // Skip if already decrypted
    if (decryptedIdsRef.current.has(message.id)) return;

    try {
      const content = await decryptMessage(message);

      // Update state with new decrypted message without causing re-render of all
      setDecryptedMessages((prev) => {
        if (content) {
          return { ...prev, [message.id]: content };
        } else {
          return { ...prev, [message.id]: "Unable to decrypt message" };
        }
      });

      // Mark as decrypted
      decryptedIdsRef.current.add(message.id);
    } catch (error) {
      console.error("Error decrypting message:", error);
      setDecryptedMessages((prev) => ({
        ...prev,
        [message.id]: "Error decrypting message",
      }));
      // Still mark as attempted so we don't retry indefinitely
      decryptedIdsRef.current.add(message.id);
    }
  };

  return {
    directMessages,
    decryptedMessages,
    loading,
    error,
    decryptedIdsRef,
    loadDirectMessages,
    decryptMessage,
    decryptSingleMessage,
  };
}
