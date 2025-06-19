import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
} from "@nostr-dev-kit/ndk-mobile";
import { Event, nip17 } from "nostr-tools";
import { useEffect, useMemo, useRef, useState } from "react";

import { ReplyTo } from "@/constants/types";
import { wrapManyEvents } from "@/interal-lib/nip17";
import { useChatStore } from "@/store/chat";
import { alertUser } from "@/utils/alert";
import useNDKWrapper from "./useNDKWrapper";
import { useTag } from "./useTag";

let outgoingSub: NDKSubscription;

export default function useNip17Chat(_recipients: string | string[]) {
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const debouncedMessageCache = useRef<any[]>([]);
  const debounceTimer = useRef<number>(0);
  const { createMessageTag } = useTag();
  const {
    getMessages,
    addMessages,
    getTimeRange,
    getMissingRanges,
    markFetched,
    updateTimeRange,
  } = useChatStore();
  const { ndk, fetchEvents, signPublishEvent } = useNDKWrapper();
  const currentUser = ndk?.activeUser;
  const { dTag, recipients } = useMemo(() => {
    const recipients = Array.isArray(_recipients) ? _recipients : [_recipients];

    const {
      tag: dTag,
      recipients: dRecipients,
      recipientsPublicKeys: pubKeys,
    } = createMessageTag(recipients);

    return {
      dTag,
      pubKeys,
      recipients: dRecipients,
    };
  }, [_recipients]);

  const unwrapMessages = (
    event: NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>
  ): ReturnType<typeof nip17.unwrapEvent>[] => {
    const events = Array.isArray(event) ? event : [event];

    return events
      .map((e) => {
        try {
          return nip17.unwrapEvent(e as Event, privateKey);
        } catch (error) {
          return undefined;
        }
      })
      .filter(
        (item): item is ReturnType<typeof nip17.unwrapEvent> =>
          item !== undefined
      );
  };

  const addMessageToConversation = (
    event: NDKEvent | NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>
  ) => {
    try {
      const events = Array.isArray(event) ? event : [event];

      const unwrappedEvent = unwrapMessages(events, privateKey);
      addMessages(dTag, unwrappedEvent);
    } catch (error) {
      console.error(error);
    }
  };

  const debouncedAddMessages =
    (privateKey: Uint8Array<ArrayBuffer>) => (event: any) => {
      debouncedMessageCache.current.push(event);
      console.count("HIT");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (debouncedMessageCache.current.length > 0) {
          addMessageToConversation(debouncedMessageCache.current, privateKey);
          debouncedMessageCache.current = [];
        }
      }, 200);
    };

  const getConversationMessages = async (
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey;

      // Filter to get the conversation messages
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const events = await fetchEvents(filter);

      addMessageToConversation(Array.from(events), privateKey!);

      return events;
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    } finally {
    }
  };

  const getConversationMessagesWebhook = async (
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey;
      const since = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;

      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
        since,
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      outgoingSub = ndk?.subscribe(outgoingFilter, options)!;

      outgoingSub.on("event", (event: NDKEvent) => {
        console.log("FOUND EVENT", event?.id);
        // addMessageToConversation(event, privateKey!);
        debouncedAddMessages(privateKey!)(event);
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        console.log("Outgoing messages EOSE received", event);
      });
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    }
  };

  const getHistoricalMessages = async (
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey;

      // Get missing time ranges we need to fetch
      const missingRanges = getMissingRanges(dTag);

      for (const { since, until } of missingRanges) {
        const filter: NDKFilter = {
          kinds: [NDKKind.GiftWrap],
          "#d": [dTag],
          since,
          until,
        };

        const events = await fetchEvents(filter);

        if (events.length > 0) {
          addMessageToConversation(Array.from(events), privateKey!);
        }
      }
      const { since, until } = missingRanges.reduce(
        (acc, curr) => {
          if (curr.since < acc.since) {
            acc.since = curr.since;
          }
          if (curr.until > acc.until) {
            acc.until = curr.until;
          }
          return acc;
        },
        { since: Infinity, until: -Infinity }
      );

      updateTimeRange(dTag, since, until);

      // Mark this chat as fetched
      markFetched(dTag);

      return true;
    } catch (error) {
      console.error("Error fetching historical messages:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
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
      const privateKey = ndk?.signer?._privateKey;

      const events = wrapManyEvents(
        privateKey,
        recipients,
        message,
        [["d", dTag]],
        conversationTitle,
        replyTo
      )
        .map((event) => {
          const _event = new NDKEvent(ndk, event);
          return _event;
        })
        .filter((event) => event.validate());

      // Create events and ensure they're properly bound to the NDK instance
      // const events = await Promise.all(
      //   _events.map(async (event) => {
      //     const ndkEvent = new NDKEvent(ndk, event);
      //     // Ensure the event is properly initialized with the NDK instance
      //     await ndkEvent.sign();
      //     return ndkEvent;
      //   })
      // );

      await Promise.allSettled(
        events.map(async (event, index) => {
          try {
            console.log(`Publishing event ${index + 1} of ${events.length}`);
            await signPublishEvent(event as NDKEvent, {
              sign: false,
              repost: false,
              publish: true,
            });
            console.log(`Published event ${index + 1} of ${events.length}`);
          } catch (error) {
            console.error("Error publishing event:", error);
            alertUser(
              `Error publishing event ${index + 1} of ${events.length}`
            );
            alertUser(`${error}`);
          }
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
    chat: null,
    getConversationMessages,
    getConversationMessagesWebhook,
    getHistoricalMessages,
    isLoading,
    isSendingMessage,
    messages: getMessages(dTag),
    sendMessage,
    timeRange: getTimeRange(dTag),
  };
}
