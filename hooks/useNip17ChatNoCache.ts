import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
} from "@nostr-dev-kit/ndk-mobile";
import { nip17, NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useRef, useState } from "react";

import { ReplyTo } from "@/constants/types";
import { unwrapManyEvents, wrapManyEvents } from "@/interal-lib/nip17";
import { alertUser } from "@/utils/alert";
import useNDKWrapper from "./useNDKWrapper";
import { useTag } from "./useTag";

let outgoingSub: NDKSubscription;

interface TimeRange {
  since: number;
  until: number;
}

interface MissingRange {
  since: number;
  until: number;
}

export default function useNip17Chat(_recipients: string | string[]) {
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    ReturnType<typeof nip17.unwrapEvent>[]
  >([]);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const debouncedMessageCache = useRef<any[]>([]);
  const debounceTimer = useRef<number>(0);
  const { createMessageTag } = useTag();
  const { ndk, fetchEvents, signPublishEvent } = useNDKWrapper();
  const currentUser = ndk?.activeUser;

  const { dTag, recipients } = useMemo(() => {
    const recipients = Array.isArray(_recipients) ? _recipients : [_recipients];

    try {
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
    } catch (error) {
      console.error("Error creating message tag:", error);
      return {
        dTag: "",
        pubKeys: [],
        recipients: [],
      };
    }
  }, [_recipients, ndk?.activeUser?.pubkey]);

  // Helper function to add messages to local state
  const addMessagesToState = (
    newMessages: ReturnType<typeof nip17.unwrapEvent>[]
  ) => {
    // setMessages((prevMessages) => {
    //   // Create a Set of existing message IDs to avoid duplicates
    //   const existingIds = new Set(prevMessages.map((msg) => msg.id));
    //   const uniqueNewMessages = newMessages.filter(
    //     (msg) => !existingIds.has(msg.id)
    //   );

    //   // Combine and sort by created_at
    //   const combined = [...prevMessages, ...uniqueNewMessages];
    //   return combined.sort((a, b) => a.created_at - b.created_at);
    // });
    alertUser(`ADD MESSAGES TO STATE: ${newMessages.length}`);
  };

  // Helper function to get missing time ranges
  const getMissingRanges = (): MissingRange[] => {
    const now = Math.floor(Date.now() / 1000);
    const oldestTime = now - 30 * 24 * 60 * 60; // 30 days ago

    if (!timeRange) {
      // No data fetched yet, return full range
      return [{ since: oldestTime, until: now }];
    }

    const ranges: MissingRange[] = [];

    // Add range before our earliest data if needed
    if (timeRange.since > oldestTime) {
      ranges.push({ since: oldestTime, until: timeRange.since });
    }

    // Add range after our latest data if needed
    if (timeRange.until < now - 300) {
      // 5 minutes buffer
      ranges.push({ since: timeRange.until, until: now });
    }

    return ranges;
  };

  // Helper function to update time range
  const updateTimeRangeState = (since: number, until: number) => {
    setTimeRange((prev) => {
      if (!prev) {
        return { since, until };
      }
      return {
        since: Math.min(prev.since, since),
        until: Math.max(prev.until, until),
      };
    });
  };

  const unwrapMessages = (
    event: NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>
  ): ReturnType<typeof nip17.unwrapEvent>[] => {
    const events = Array.isArray(event) ? event : [event];
    try {
      return unwrapManyEvents(events as NostrEvent[], privateKey).filter(
        (item): item is ReturnType<typeof nip17.unwrapEvent> =>
          item !== undefined
      );
      // return events
      //   .map((e) => {
      //     try {
      //       return unwrapEvent(e as Event, privateKey);
      //     } catch (error) {
      //       return undefined;
      //     }
      //   })
      //   .filter(
      //     (item): item is ReturnType<typeof nip17.unwrapEvent> =>
      //       item !== undefined
      //   );
    } catch (error) {
      alertUser(`UNWRAP MESSAGES ERROR: ${error}`);
      return [] as ReturnType<typeof nip17.unwrapEvent>[];
    }
  };

  const addMessageToConversation = (
    event: NDKEvent | NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>
  ) => {
    try {
      const events = Array.isArray(event) ? event : [event];
      const unwrappedEvent = unwrapMessages(events, privateKey);

      addMessagesToState(unwrappedEvent);
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

  const debouncedAddMessages2 =
    (privateKey: Uint8Array<ArrayBuffer>) => (event: any) => {
      debouncedMessageCache.current.push(event);
      console.count("HIT");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (debouncedMessageCache.current.length > 0) {
          // addMessageToConversation(debouncedMessageCache.current, privateKey);
          // const events = Array.isArray(debouncedMessageCache.current)
          //   ? debouncedMessageCache.current
          //   : [debouncedMessageCache.current];
          const unwrappedEvent = unwrapMessages(
            debouncedMessageCache.current,
            privateKey
          );

          alertUser(`ADD MESSAGES TO STATE: ${unwrappedEvent.length}`);
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
        // console.log("FOUND EVENT", event?.id);
        // addMessageToConversation(event, privateKey!);
        // debouncedAddMessages(privateKey!)(event);
        // alertUser(`FOUND EVENT: ${event?.id}`);
        debouncedAddMessages2(privateKey!)(event);
      });

      // Handle EOSE (End of Stored Events)
      outgoingSub.on("eose", (event: any) => {
        // console.log("Outgoing messages EOSE received", event);
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
        console.log("Missing currentUser or _recipients:", {
          currentUser: !!currentUser,
          _recipients,
        });
        return [];
      }

      // Debug: Check if dTag is valid
      console.log("dTag value:", dTag);
      console.log("recipients:", recipients);

      if (!dTag) {
        console.error("dTag is empty or undefined");
        return [];
      }

      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey;

      // Get missing time ranges we need to fetch
      const missingRanges = getMissingRanges();
      console.log("Missing ranges:", missingRanges);

      for (const { since, until } of missingRanges) {
        const filter: NDKFilter = {
          kinds: [NDKKind.GiftWrap],
          "#d": [dTag],
          since,
          until,
        };

        console.log("Filter being used:", filter);

        // Validate filter before calling fetchEvents
        if (!filter.kinds || filter.kinds.length === 0) {
          console.error("Invalid filter: missing kinds");
          continue;
        }

        if (!filter["#d"] || filter["#d"].length === 0 || !filter["#d"][0]) {
          console.error("Invalid filter: missing or empty #d tag");
          continue;
        }

        const events = await fetchEvents(filter);

        if (events.length > 0) {
          addMessageToConversation(Array.from(events), privateKey!);
        }
      }

      if (missingRanges.length > 0) {
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

        updateTimeRangeState(since, until);
      }

      // Mark this chat as fetched
      setIsFetched(true);

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
            alertUser("PUBLISHED EVENT");
          } catch (error) {
            console.error("Error publishing event:", error);
          }
        })
      );
    } catch (error) {
      alertUser("MESSAGE ERROR");
      alertUser(error?.toString() || "Error sending direct message");
      console.error("Error sending direct message:", error);
      // throw error;
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
    messages,
    sendMessage,
    timeRange,
  };
}
