import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { Event, nip17, nip19 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Recipient, ReplyTo } from "@/constants/types";
import { generateUniqueDTag } from "@/lib/generateUniqueDTag";
import { wrapManyEvents } from "@/lib/nip17";
// import { unwrapEvent, wrapEvent } from "@/lib/nip17";

let outgoingSub: NDKSubscription;
let incomingSub: NDKSubscription;

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
    try {
      if (raw) {
        setMessagesByUser((prev) => [...prev, event]);
        return;
      }

      const unwrappedEvent = nip17.unwrapEvent(event as Event, privateKey);
      setMessagesByUser((prev) => [...prev, unwrappedEvent]);
    } catch (error) {
      console.error(error);
    }
  };

  const getConversationMessages = async (
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

      let pubKeys: string[] = [];

      if (Array.isArray(recipients)) {
        pubKeys = recipients.map((r) => {
          const { data: publicKey } = nip19.decode(r);
          return publicKey as string;
        });
      } else {
        const { data: publicKey } = nip19.decode(recipients);
        pubKeys = [publicKey as string];
      }

      const dTag = generateUniqueDTag(
        pubKeys.map((r) => r).concat(currentUser.pubkey)
      );

      // Filter to get the conversation messages
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const events = await getNDK().getInstance().fetchEvents(filter);

      events.forEach((event: NDKEvent) => {
        addMessageToConversation(event, privateKey!);
      });

      return events;
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    } finally {
      setLoading(false);
    }
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

      let pubKeys: string[] = [];

      if (Array.isArray(recipients)) {
        pubKeys = recipients.map((r) => {
          const { data: publicKey } = nip19.decode(r);
          return publicKey as string;
        });
      } else {
        const { data: publicKey } = nip19.decode(recipients);
        pubKeys = [publicKey as string];
      }

      const dTag = generateUniqueDTag(
        pubKeys.map((r) => r).concat(currentUser.pubkey)
      );

      // We need two filters to get the complete conversation:
      // 1. Messages sent BY current user TO recipients
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        // "#p": recipients,
        "#d": [dTag],
      };

      // 2. Messages sent TO current user FROM recipients
      // const incomingFilter: NDKFilter = {
      //   kinds: [NDKKind.GiftWrap],
      //   "#p": [currentUser.pubkey],
      //   "#d": [dTag],
      // };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      outgoingSub = getNDK().getInstance().subscribe(outgoingFilter, options);
      // incomingSub = getNDK()
      //   .getInstance()
      //   .subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // console.log("Outgoing message received:", event);
        // For outgoing messages, the p tag contains the recipient
        // const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        debugger;

        // if (recipientPubkey) {
        // addMessageToConversation(event, recipientPubkey, privateKey!);
        addMessageToConversation(event, privateKey!);
        // }
      });

      // incomingSub.on("event", (event: NDKEvent) => {
      //   // console.log("Incoming message received:", event);
      //   // For incoming messages, the author is the sender
      //   const senderPubkey = event.pubkey;

      //   if (senderPubkey) {
      //     // addMessageToConversation(event, senderPubkey, privateKey);
      //     addMessageToConversation(event, privateKey);
      //   }
      // });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        console.log("Outgoing messages EOSE received", event);
        setLoading(false);
      });

      // incomingSub.on("eose", (event: any) => {
      //   console.log("Incoming messages EOSE received", event);
      //   setLoading(false);
      // });
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

      // THIS IS NEEDED!!! Do not remove it.
      // You can only send events if you use the REAL public key.
      if (_recipient.publicKey.startsWith("npub")) {
        const { data: publicKey } = nip19.decode(_recipient.publicKey);
        recipient = [{ publicKey: publicKey as string }];
      } else {
        recipient = [_recipient];
      }
      const _dTag = recipient
        .map((r) => r.publicKey)
        .concat(currentUser.pubkey);
      const dTag = generateUniqueDTag(_dTag);

      const events = wrapManyEvents(
        privateKey,
        recipient,
        message,
        // [["d", randomDTag]],
        [["d", dTag]],
        conversationTitle,
        replyTo
      ).map((event) =>
        Object.assign(new NDKEvent(getNDK().getInstance()), event)
      );

      await Promise.allSettled(
        events.map(async (event, index) => {
          console.log(`publishing event ${index + 1} of ${events.length}...`);
          await event.publish();
          console.log(`event ${index + 1} of ${events.length} published!`);
        })
      );
    } catch (error) {
      console.error("Error sending direct message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up subscriptions when the hook unmounts
      outgoingSub?.stop?.();
      // incomingSub?.stop?.();
    };
  }, []);

  return {
    isLoading,
    messages: sortedMessagesByUser,
    sendMessage,
    getConversationMessages,
    getConversationMessagesWebhook,
    chat: null,
  };
}
