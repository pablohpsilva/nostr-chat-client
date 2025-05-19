import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { Event, nip17, nip19 } from "nostr-tools";
import { useMemo, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Recipient, ReplyTo } from "@/constants/types";

export default function useNip17Chat() {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const [messagesByUser, setMessagesByUser] = useState<
    ReturnType<typeof nip17.unwrapEvent>[]
  >([]);
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

    const unwrappedEvent = nip17.unwrapEvent(event as Event, privateKey);
    setMessagesByUser((prev) => [...prev, unwrappedEvent]);
  };

  const getConversationMessagesWebhook = async (
    _recipients: string | string[],
    _options: NDKSubscriptionOptions = {}
  ) => {
    if (!currentUser || !_recipients) {
      return [];
    }

    setLoading(true);
    setMessagesByUser([]);

    try {
      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;
      const recipients = (
        Array.isArray(_recipients) ? _recipients : [_recipients]
      ).map((recipient) => {
        if (recipient.startsWith("npub")) {
          const { data: publicKey } = nip19.decode(recipient);
          return publicKey as string;
        } else {
          return recipient;
        }
      });

      // We need two filters to get the complete conversation:
      // 1. Messages sent BY current user TO recipients
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#p": recipients,
      };

      // 2. Messages sent TO current user FROM recipients
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#p": [currentUser.pubkey],
      };

      console.log("outgoingFilter", outgoingFilter);
      console.log("incomingFilter", incomingFilter);

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      const outgoingSub = getNDK()
        .getInstance()
        .subscribe(outgoingFilter, options);
      const incomingSub = getNDK()
        .getInstance()
        .subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // For outgoing messages, the p tag contains the recipient
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];

        if (recipientPubkey) {
          // addMessageToConversation(event, recipientPubkey, privateKey!);
          addMessageToConversation(event, privateKey!);
        }
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // For incoming messages, the author is the sender
        const senderPubkey = event.pubkey;

        if (senderPubkey) {
          // addMessageToConversation(event, senderPubkey, privateKey);
          addMessageToConversation(event, privateKey);
        }
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        setLoading(false);
      });

      incomingSub.on("eose", (event: any) => {
        setLoading(false);
      });

      return () => {
        // Clean up subscriptions when the hook unmounts
        outgoingSub.stop();
        incomingSub.stop();
      };
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    _recipient: Recipient,
    message: string,
    conversationTitle?: string,
    replyTo?: ReplyTo
  ) => {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      let recipient: Recipient[];
      // let recipient: Recipient;

      // THIS IS NEEDED!!! Do not remove it.
      // You can only send events if you use the REAL public key.
      if (_recipient.publicKey.startsWith("npub")) {
        const { data: publicKey } = nip19.decode(_recipient.publicKey);
        recipient = [{ publicKey: publicKey as string }];
        // recipient = { publicKey: publicKey as string };
      } else {
        recipient = [_recipient];
        // recipient = _recipient;
      }

      const events = nip17
        .wrapManyEvents(
          privateKey,
          recipient,
          message,
          conversationTitle,
          replyTo
        )
        .map((event) => {
          return Object.assign(new NDKEvent(getNDK().getInstance()), event);
        });

      await Promise.all(
        events.map(async (event) => {
          await event.publish();
        })
      );
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoading,
    messages: sortedMessagesByUser,
    sendMessage,
    getConversationMessagesWebhook,
    chat: null,
  };
}
