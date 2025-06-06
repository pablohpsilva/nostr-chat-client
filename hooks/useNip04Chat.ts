import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
  useNDKCurrentUser,
} from "@nostr-dev-kit/ndk-hooks";
import { nip04 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { useChatStore } from "@/store/chat";
import useTag from "./useTag";

let outgoingSub: NDKSubscription;
let incomingSub: NDKSubscription;

export default function useNip04Chat(_recipients: string | string[]) {
  const currentUser = useNDKCurrentUser();
  const [isLoading, setLoading] = useState(false);
  const { createMessageTag } = useTag();
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

    return events.map((e) => {
      const content = nip04.decrypt(privateKey, e.pubkey, e.content);
      return Object.assign(e, { content });
    });
  };

  const addMessageToConversation = (
    event: NDKEvent | NDKEvent[],
    privateKey: Uint8Array<ArrayBuffer>,
    raw?: boolean
  ) => {
    const events = Array.isArray(event) ? event : [event];

    const decryptedEvents = decryptMessages(events, privateKey);

    addMessages(chatKey, decryptedEvents);
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
      };

      // 2. Messages sent FROM recipients TO current user
      const incomingFilter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [currentUser.pubkey],
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
        // // console.log("outgoingSub", event);
        // // For outgoing messages, the p tag contains the recipient
        // const recipientPubkey = event.tags.find((tag) => tag[0] === "p")?.[1];
        // // console.log("recipientPubkey", recipientPubkey);

        // if (recipientPubkey) {
        //   // addMessageToConversation(event, recipientPubkey, privateKey!);
        //   addMessageToConversation(event, privateKey!);
        // }
        addMessageToConversation(event, privateKey!);
      });

      incomingSub.on("event", (event: NDKEvent) => {
        // // console.log("incomingSub", event);
        // // For incoming messages, the author is the sender
        // const senderPubkey = event.pubkey;
        // // console.log("senderPubkey", senderPubkey);

        // if (senderPubkey) {
        //   // addMessageToConversation(event, senderPubkey, privateKey);
        //   addMessageToConversation(event, privateKey);
        // }
        addMessageToConversation(event, privateKey);
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
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;

      const events = recipients.map((recipient) => {
        // Create a new DM event
        const event = new NDKEvent(getNDK().getInstance());
        event.kind = NDKKind.EncryptedDirectMessage;
        // event.content = content;
        event.content = nip04.encrypt(
          privateKey!,
          recipient.publicKey,
          message
        );
        event.tags = [["p", recipient.publicKey]];

        return event;
      });

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
    isLoading,
    messages: getMessages(chatKey),
    sendMessage,
    getConversationMessagesWebhook,
    chat: null,
  };
}
