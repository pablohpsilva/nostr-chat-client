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
import useTag from "./useTag";

let outgoingSub: NDKSubscription;

export default function useNip17Chat() {
  const currentUser = useNDKCurrentUser();
  const { createMessageTag } = useTag();
  const [isLoading, setLoading] = useState(true);
  const [isLoadingMessages, setLoadingMessages] = useState(false);
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
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      setMessagesByUser([]);
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

      const { tag: dTag } = createMessageTag(pubKeys);

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
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      setMessagesByUser([]);
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

      const { tag: dTag } = createMessageTag(pubKeys);

      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
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
      setLoadingMessages(true);

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      const { tag: dTag, recipients } = createMessageTag([_recipient]);

      const events = wrapManyEvents(
        privateKey,
        recipients,
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
      setLoadingMessages(false);
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
    isLoadingMessages,
    messages: sortedMessagesByUser,
    sendMessage,
    getConversationMessages,
    getConversationMessagesWebhook,
    chat: null,
  };
}
