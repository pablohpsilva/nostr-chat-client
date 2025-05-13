import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscriptionOptions,
  NDKUserProfile,
} from "@nostr-dev-kit/ndk";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useMemo, useState } from "react";
import { nip04 } from "nostr-tools";

import { getNDK } from "@/components/NDKHeadless";

export default function useEncryptedMessage() {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [directMessages, setDirectMessages] = useState<
    Record<string, NDKEvent[]>
  >({});
  const messages = useMemo(() => {
    return Object.values(directMessages)
      .flat()
      .sort((a, b) => a.created_at! - b.created_at!);
  }, [directMessages]);

  /**
   * Fetches all chats for the current user without loading all messages
   * Just gets the list of users the current user has exchanged messages with
   */
  const getUserChats = async (): Promise<Record<string, NDKUserProfile>> => {
    if (!currentUser?.pubkey) {
      return {};
    }

    const chatUsers: Record<string, NDKUserProfile> = {};

    try {
      setLoading(true);
      setError(null);

      // Filter for encrypted DMs (kind 4) sent from the current user
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        authors: [currentUser.pubkey],
        // limit: 100,
      };

      // Filter for encrypted DMs (kind 4) sent to the current user
      //   const incomingFilter: NDKFilter = {
      //     kinds: [NDKKind.EncryptedDirectMessage],
      //     "#p": [currentUser.pubkey],
      //     // limit: 100,
      //   };

      // Get outgoing messages to find recipients
      const outgoingEvents = await getNDK()
        .getInstance()
        .fetchEvents(outgoingFilter);
      for (const event of outgoingEvents) {
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        if (recipientPubkey && !chatUsers[recipientPubkey]) {
          const profile = await getNDK()
            .getInstance()
            .getUser({ pubkey: recipientPubkey })
            .fetchProfile();

          if (profile) {
            chatUsers[recipientPubkey] = profile;
          }
        }
      }

      // Get incoming messages to find senders
      //   const incomingEvents = await getNDK().getInstance().fetchEvents(incomingFilter);
      //   for (const event of incomingEvents) {
      //     const senderPubkey = event.pubkey;
      //     if (senderPubkey && !chatUsers[senderPubkey]) {
      //       const profile = await ndk
      //         .getUser({ pubkey: senderPubkey })
      //         .fetchProfile();

      //       if (profile) {
      //         chatUsers[senderPubkey] = profile;
      //       }
      //     }
      //   }

      return chatUsers;
    } catch (err) {
      console.error("Error loading chats:", err);
      setError(err instanceof Error ? err : new Error("Failed to load chats"));
      return chatUsers;
    } finally {
      setLoading(false);
    }
  };

  const sendDirectMessage = async (
    destinationPubkey: string,
    content: string
  ): Promise<NDKEvent | null> => {
    if (!currentUser?.pubkey) {
      return null;
    }

    // @ts-expect-error
    const privateKey = getNDK().getInstance().signer?._privateKey;

    try {
      const recipientUser = getNDK()
        .getInstance()
        .getUser({ pubkey: destinationPubkey });

      // Create a new DM event
      const event = new NDKEvent(getNDK().getInstance());
      event.kind = NDKKind.EncryptedDirectMessage;
      // event.content = content;
      event.content = nip04.encrypt(privateKey!, recipientUser.pubkey, content);
      event.tags = [["p", recipientUser.pubkey]];

      // Encrypt and sign the event
      //   await event.encrypt(recipientUser);

      // Publish the event
      await event.publish();

      return event;
    } catch (err) {
      console.error("Error sending direct message:", err);
      return null;
    }
  };

  /**
   * Fetches and decrypts all messages for a specific chat
   * @param pubkey The public key of the chat partner
   * @returns Array of NDKEvent objects for the conversation
   */
  const getConversationMessages = async (
    pubkey: string
  ): Promise<NDKEvent[]> => {
    if (!currentUser?.pubkey) {
      return [];
    }

    // @ts-expect-error
    const privateKey = getNDK().getInstance().signer?._privateKey;

    try {
      setLoading(true);
      setError(null);

      // Filter for messages between the current user and the specified pubkey
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        // authors: [currentUser.pubkey],
        "#p": [pubkey],
      };

      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        // authors: [pubkey],
        "#p": [currentUser.pubkey],
      };

      // Fetch all messages for this conversation
      const outgoingEvents = await getNDK()
        .getInstance()
        .fetchEvents(outgoingFilter);
      const incomingEvents = await getNDK()
        .getInstance()
        .fetchEvents(incomingFilter);

      // Combine and sort all messages by timestamp
      const allEvents = [...outgoingEvents, ...incomingEvents];
      allEvents.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));

      return allEvents.map((event) => {
        return {
          ...event,
          content: nip04.decrypt(privateKey, pubkey, event.content),
        } as NDKEvent;
      });
    } catch (err) {
      console.error("Error loading messages:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load messages")
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches and decrypts all messages for a specific chat
   * @param pubkey The public key of the chat partner
   * @returns Array of NDKEvent objects for the conversation
   */
  const getConversationMessagesWebhook = async (pubkey: string) => {
    if (!currentUser?.pubkey) {
      return;
    }

    try {
      setLoading(true);

      // Filter for encrypted DMs sent from the current user to the specified pubkey
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        // authors: [currentUser.pubkey],
        "#p": [pubkey],
      };

      // Filter for encrypted DMs sent from the specified pubkey to the current user
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        // authors: [pubkey],
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

        // @ts-expect-error
        const privateKey = getNDK().getInstance().signer?._privateKey;

        // Add message if it doesn't already exist
        if (!messagesByUser[partnerPubkey].some((msg) => msg.id === event.id)) {
          const content = nip04.decrypt(
            privateKey,
            partnerPubkey,
            event.content
          );

          const _event = {
            ...event,
            content,
          } as NDKEvent;

          messagesByUser[partnerPubkey] = [
            ...messagesByUser[partnerPubkey],
            _event,
          ];

          // Sort messages by timestamp
          messagesByUser[partnerPubkey].sort(
            (a, b) => a.created_at! - b.created_at!
          );

          // Update state
          setDirectMessages({ ...messagesByUser });
        }
      };

      // Subscribe to outgoing messages (from the current user to specific pubkey)
      const outgoingSub = getNDK()
        .getInstance()
        .subscribe(outgoingFilter, options);
      // Subscribe to incoming messages (from specific pubkey to the current user)
      const incomingSub = getNDK()
        .getInstance()
        .subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // For outgoing messages, the p tag contains the recipient
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];

        if (recipientPubkey && recipientPubkey === pubkey) {
          addMessageToConversation(event, recipientPubkey);
        }
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // For incoming messages, the author is the sender
        const senderPubkey = event.pubkey;

        if (senderPubkey && senderPubkey === pubkey) {
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

  return {
    isLoading,
    error,
    directMessages,
    messages,
    sendDirectMessage,
    getUserChats,
    getConversationMessages,
    getConversationMessagesWebhook,
  };
}
