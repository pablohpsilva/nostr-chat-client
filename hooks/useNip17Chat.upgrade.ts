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
import { wrapManyEvents } from "@/lib/nip17";
import { useChatStore } from "@/store/chat";
import useTag from "./useTag";

let outgoingSub: NDKSubscription;

export default function useNip17Chat(_recipients: string | string[]) {
  const currentUser = useNDKCurrentUser();
  const { createMessageTag } = useTag();
  const [isLoading, setLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const recipients = useMemo(
    () => (Array.isArray(_recipients) ? _recipients : [_recipients]),
    [_recipients]
  );
  const chatPubkeys = useMemo(() => {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => {
        const { data: publicKey } = nip19.decode(r);
        return publicKey as string;
      });
    } else {
      const { data: publicKey } = nip19.decode(recipients);
      return [publicKey as string];
    }
  }, [recipients]);
  const { tag: dTag, recipients: chatRecipients } = useMemo(() => {
    return createMessageTag(chatPubkeys);
  }, [chatPubkeys]);
  const { addChat, getChat } = useChatStore();
  const {
    chat: messagesByUser,
    filterSince,
    filterUntil,
  } = useMemo(() => {
    return getChat(dTag);
  }, [dTag]);
  // const [messagesByUser, setMessagesByUser] = useState<
  //   ReturnType<typeof nip17.unwrapEvent>[]
  // >([]);
  // const sortedMessagesByUser = useMemo(
  //   () => messagesByUser.sort((a, b) => a.created_at - b.created_at),
  //   [messagesByUser]
  // );

  const addMessageToConversation = (
    event: NDKEvent,
    privateKey: Uint8Array<ArrayBuffer>,
    raw?: boolean
  ) => {
    try {
      if (raw) {
        addChat(dTag, event);
        return;
      }

      const unwrappedEvent = nip17.unwrapEvent(event as Event, privateKey);
      addChat(dTag, unwrappedEvent);
    } catch (error) {
      console.error(error);
    }
  };

  const getConversationMessages = async (
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      // Filter to get the conversation messages
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
        // since: filterSince,
        // until: filterUntil,
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
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
        // since: filterSince,
        // until: filterUntil,
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      outgoingSub = getNDK().getInstance().subscribe(outgoingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        addMessageToConversation(event, privateKey!);
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        console.log("Outgoing messages EOSE received", event);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
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
      setIsSendingMessage(true);

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      const events = wrapManyEvents(
        privateKey,
        chatRecipients,
        message,
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
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up subscriptions when the hook unmounts
      outgoingSub?.stop?.();
    };
  }, []);

  return {
    isLoading,
    isSendingMessage,
    messages: messagesByUser,
    sendMessage,
    getConversationMessages,
    getConversationMessagesWebhook,
    chat: null,
  };
}
