import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { nip04 } from "nostr-tools";
import { useEffect, useMemo, useRef, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { useChatStore } from "@/store/chat";
import { createMessageTag } from "./useTag";

let outgoingSub: NDKSubscription;
let incomingSub: NDKSubscription;

export default function useNip04Chat(_recipients: string | string[]) {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const debouncedMessageCache = useRef<any[]>([]);
  const debounceTimer = useRef<number>(0);
  const { recipients, chatKey, pubKeys } = useMemo(() => {
    const recipients = Array.isArray(_recipients) ? _recipients : [_recipients];

    const { recipients: dRecipients, recipientsPublicKeys: pubKeys } =
      createMessageTag(recipients);

    return {
      pubKeys: pubKeys.filter((key) => key !== currentUser?.pubkey),
      chatKey: pubKeys.join(","),
      recipients: dRecipients,
    };
  }, [_recipients]);
  const {
    getMessages,
    addMessages,
    getTimeRange,
    getMissingRanges,
    markFetched,
    updateTimeRange,
  } = useChatStore();

  const decryptMessages = (
    event: NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>
  ) => {
    const events = Array.isArray(event) ? event : [event];

    return events
      .map((e) => {
        try {
          const content = nip04.decrypt(privateKey, e.pubkey, e.content);
          return { ...e, content };
        } catch (error) {
          console.log("error", error);
          return undefined;
        }
      })
      .filter((e) => e !== undefined);
  };

  const addMessageToConversation = (
    event: NDKEvent | NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>,
    raw?: boolean
  ) => {
    const events = Array.isArray(event) ? event : [event];
    if (raw) {
      addMessages(chatKey, events);
      return;
    }

    console.log("events", events);

    const decryptedEvents = decryptMessages(events, privateKey);

    addMessages(chatKey, decryptedEvents);
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

  const getHistoricalMessages = async (
    _options: NDKSubscriptionOptions = {}
  ) => {
    try {
      setLoading(true);

      if (!currentUser || !_recipients) {
        return [];
      }

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      // Get missing time ranges we need to fetch
      const missingRanges = getMissingRanges(chatKey);

      for (const { since, until } of missingRanges) {
        const outgoingFilter: NDKFilter = {
          kinds: [NDKKind.EncryptedDirectMessage],
          "#p": pubKeys,
          since,
          until,
        };
        const incomingFilter: NDKFilter = {
          kinds: [NDKKind.EncryptedDirectMessage],
          "#p": [currentUser.pubkey],
          since,
          until,
        };

        const [outgoingEvents, incomingEvents] = await Promise.all([
          getNDK().getInstance().fetchEvents(outgoingFilter),
          getNDK().getInstance().fetchEvents(incomingFilter),
        ]);

        const events = new Set([...outgoingEvents, ...incomingEvents]);

        if (events.size > 0) {
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

      updateTimeRange(chatKey, since, until);

      // Mark this chat as fetched
      markFetched(chatKey);

      return true;
    } catch (error) {
      console.error("Error fetching historical messages:", error);
      return false;
    } finally {
      setLoading(false);
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
      const privateKey = getNDK().getInstance().signer?._privateKey;

      // We need two filters to get the complete conversation:
      // 1. Messages sent FROM current user TO recipients
      const outgoingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": pubKeys,
        since: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
      };

      // 2. Messages sent FROM recipients TO current user
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [currentUser.pubkey],
        since: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        // relayUrls: [
        //   "wss://relay.damus.io",
        //   "wss://relay.snort.social",
        //   "wss://nos.lol",
        // ],
        ..._options,
      };

      outgoingSub = getNDK().getInstance().subscribe(outgoingFilter, options);
      incomingSub = getNDK().getInstance().subscribe(incomingFilter, options);

      outgoingSub.on("event", (event: NDKEvent) => {
        // // For outgoing messages, the p tag contains the recipient
        // const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        // // console.log("recipientPubkey", recipientPubkey);

        // if (recipientPubkey) {
        //   // addMessageToConversation(event, recipientPubkey, privateKey!);
        //   addMessageToConversation(event, privateKey!);
        // }
        debouncedAddMessages(privateKey!)(event);
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // // For incoming messages, the author is the sender
        // const senderPubkey = event.pubkey;
        // // console.log("senderPubkey", senderPubkey);

        // if (senderPubkey) {
        //   // addMessageToConversation(event, senderPubkey, privateKey);
        //   addMessageToConversation(event, privateKey);
        // }
        debouncedAddMessages(privateKey!)(event);
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

  const sendMessage = async (message: string) => {
    try {
      if (!currentUser) {
        return;
      }

      setLoading(true);
      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      const events = recipients
        .map((recipient) => {
          const event = {
            pubkey: currentUser.pubkey,
            kind: NDKKind.EncryptedDirectMessage,
            content: nip04.encrypt(privateKey!, currentUser.pubkey, message),
            tags: [["p", recipient.publicKey]],
            created_at: Math.floor(Date.now() / 1000),
          };
          return event;
        })
        .map((event) =>
          Object.assign(new NDKEvent(getNDK().getInstance()), event)
        );

      await Promise.allSettled(
        events.map(async (event, index) => {
          console.log(`Publishing event ${index + 1} of ${events.length}`);
          await event.publish();
          console.log(`Published event ${index + 1} of ${events.length}`);
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
      outgoingSub?.stop?.();
      incomingSub?.stop?.();
    };
  }, []);

  return {
    chat: null,
    getConversationMessagesWebhook,
    getHistoricalMessages,
    isLoading,
    messages: getMessages(chatKey),
    sendMessage,
    timeRange: getTimeRange(chatKey),
  };
}
