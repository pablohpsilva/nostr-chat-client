import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { nip04, nip19 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Recipient } from "@/constants/types";

let outgoingSub: NDKSubscription;
let incomingSub: NDKSubscription;

export default function useNip04Chat() {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const [messagesByUser, setMessagesByUser] = useState<NDKEvent[]>([]);
  const sortedMessagesByUser = useMemo(
    () => messagesByUser.sort((a, b) => a.created_at - b.created_at),
    [messagesByUser]
  );

  const addMessageToConversation = (
    event: NDKEvent,
    privateKey: Uint8Array<ArrayBuffer>,
    raw?: boolean
  ) => {
    if (raw) {
      setMessagesByUser((prev) => [...prev, event]);
      return;
    }

    const content = nip04.decrypt(privateKey, event.pubkey, event.content);
    const unwrappedEvent: NDKEvent = Object.assign(event, { content });
    setMessagesByUser((prev) => [...prev, unwrappedEvent]);
  };

  const getConversationMessagesWebhook = async (
    _recipients: string | string[],
    _options: NDKSubscriptionOptions = {}
  ) => {
    setLoading(true);

    if (!currentUser || !_recipients) {
      return [];
    }

    setMessagesByUser([]);

    try {
      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;
      let recipients: string[] = [];

      if (Array.isArray(_recipients)) {
        recipients = _recipients.map((r) => {
          const { data: publicKey } = nip19.decode(r);
          return publicKey as string;
        });
      } else {
        const { data: publicKey } = nip19.decode(_recipients);
        recipients = [publicKey as string];
      }

      // We need two filters to get the complete conversation:
      // 1. Messages sent BY current user TO recipients
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": recipients,
      };

      // 2. Messages sent TO current user FROM recipients
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [currentUser.pubkey],
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        relayUrls: [
          "wss://relay.damus.io",
          "wss://relay.snort.social",
          "wss://nos.lol",
        ],
        ..._options,
      };

      outgoingSub = getNDK().getInstance().subscribe(outgoingFilter, options);
      incomingSub = getNDK().getInstance().subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // For outgoing messages, the p tag contains the recipient
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        console.log("recipientPubkey", recipientPubkey);

        if (recipientPubkey) {
          // addMessageToConversation(event, recipientPubkey, privateKey!);
          addMessageToConversation(event, privateKey!);
        }
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // For incoming messages, the author is the sender
        const senderPubkey = event.pubkey;
        console.log("senderPubkey", senderPubkey);

        if (senderPubkey) {
          // addMessageToConversation(event, senderPubkey, privateKey);
          addMessageToConversation(event, privateKey);
        }
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        console.log("Outgoing messages EOSE received", event);
        setLoading(false);
      });

      incomingSub.on("eose", (event: any) => {
        console.log("Incoming messages EOSE received", event);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (_recipient: Recipient, message: string) => {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      let recipient: Recipient;
      // THIS IS NEEDED!!! Do not remove it.
      // You can only send events if you use the REAL public key.
      if (_recipient.publicKey.startsWith("npub")) {
        const { data: publicKey } = nip19.decode(_recipient.publicKey);
        recipient = { publicKey: publicKey as string };
        // recipient = { publicKey: publicKey as string };
      } else {
        recipient = _recipient;
        // recipient = _recipient;
      }

      // Create a new DM event
      const event = new NDKEvent(getNDK().getInstance());
      event.kind = NDKKind.EncryptedDirectMessage;
      // event.content = content;
      event.content = nip04.encrypt(privateKey!, recipient.publicKey, message);
      event.tags = [["p", recipient.publicKey]];

      // Publish the event
      console.log("Sending event...");
      await event.publish();
      console.log("Event sent");
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      outgoingSub?.stop?.();
      incomingSub?.stop?.();
    };
  }, []);

  return {
    isLoading,
    messages: sortedMessagesByUser,
    sendMessage,
    getConversationMessagesWebhook,
    chat: null,
  };
}
