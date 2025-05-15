import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { Event, nip17, nip19 } from "nostr-tools";
import { useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Recipient, ReplyTo } from "@/constants/types";
// import { unwrapEvent, wrapEvent } from "@/lib/nip17";

export default function useNip17Chat() {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const [messagesByUser, setMessagesByUser] = useState<
    ReturnType<typeof nip17.unwrapEvent>[]
  >([]);

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
    console.log("unwrappedEvent", unwrappedEvent);
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
      const recipients = Array.isArray(_recipients)
        ? _recipients
        : [_recipients];

      console.log("recipients", recipients);

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
        // console.log("Outgoing message received:", event);
        // For outgoing messages, the p tag contains the recipient
        const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];

        if (recipientPubkey) {
          // addMessageToConversation(event, recipientPubkey, privateKey!);
          addMessageToConversation(event, privateKey!);
        }
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // console.log("Incoming message received:", event);
        // For incoming messages, the author is the sender
        const senderPubkey = event.pubkey;

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

      // let recipient: Recipient[];
      let recipient: Recipient;

      // THIS IS NEEDED!!! Do not remove it.
      // You can only send events if you use the REAL public key.
      if (_recipient.publicKey.startsWith("npub")) {
        const { data: publicKey } = nip19.decode(_recipient.publicKey);
        // recipient = [{ publicKey: publicKey as string }];
        recipient = { publicKey: publicKey as string };
      } else {
        // recipient = [_recipient];
        recipient = _recipient;
      }

      const event = nip17.wrapEvent(
        privateKey,
        recipient,
        message,
        conversationTitle,
        replyTo
      );

      const publishedEvent = Object.assign(
        new NDKEvent(getNDK().getInstance()),
        event
      );
      console.log("publishedEvent", publishedEvent);
      await publishedEvent.publish();
      console.log("publishedEvent", publishedEvent);

      // const events = nip17.wrapManyEvents(
      //   privateKey,
      //   recipient,
      //   message,
      //   conversationTitle,
      //   replyTo
      // );

      // await Promise.all(
      //   events.map(async (event) => {
      //     const publishedEvent = Object.assign(
      //       new NDKEvent(getNDK().getInstance()),
      //       event
      //     );
      //     console.log("publishedEvent", publishedEvent);
      //     await publishedEvent.publish();
      //     console.log("publishedEvent", publishedEvent);
      //   })
      // );
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoading,
    messages: messagesByUser,
    sendMessage,
    getConversationMessagesWebhook,
    chat: null,
  };
}
