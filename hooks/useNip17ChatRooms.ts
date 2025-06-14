import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
} from "@nostr-dev-kit/ndk";
import cloneDeep from "lodash.clonedeep";
import { Event, nip17, nip19 } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { useNDK } from "@/components/Context";
import { ChatRoom, Recipient } from "@/constants/types";
import { wrapEvent } from "@/interal-lib/nip17";
import { useChatListStore } from "@/store/chatlist";
import { captureException } from "@sentry/react-native";
import useNip17Profiles from "./useNip17Profiles";
import { useTag } from "./useTag";

let sub: NDKSubscription | null = null;

export default function useNip17ChatRooms(recipientPrivateKey?: Uint8Array) {
  const {
    loadAndUpdateProfiles,
    isLoading: isLoadingProfiles,
    getChatRoomList,
  } = useNip17Profiles();
  const [isLoading, setLoading] = useState(false);
  const {
    chatRooms: chatRoomMap,
    setChatRooms,
    isLoading: isChatListLoading,
    isSaving: isChatListSaving,
    error: chatListError,
    loadChatRooms: loadStoredChatRooms,
    saveChatRooms: saveStoredChatRooms,
    removeChatRoom,
    clearChatRoom,
    wipeCleanChatRooms,
    clearError: clearChatListError,
  } = useChatListStore();
  const { createChatTag, normalizeRecipients, normalizeRecipientsNPub } =
    useTag();
  const { ndk, fetchEvents, signPublishEvent } = useNDK();
  const chatRooms = useMemo(
    () => Array.from(chatRoomMap.values()),
    [chatRoomMap.values()]
  );

  const storeChatRoom = async (
    _chatRoomMap: Map<string, ChatRoom>,
    possibleRecipients:
      | string
      | string[]
      | nip19.NPub
      | nip19.NPub[]
      | Recipient
      | Recipient[],
    _currentUserPublicKey?: string
  ) => {
    // @ts-expect-error
    const privateKey = ndk?.signer?._privateKey;
    const currentUserPublicKey =
      ndk?.activeUser?.pubkey ?? _currentUserPublicKey;

    if (!privateKey) {
      console.log(new Error("No private key found"));
      return [];
    }

    if (!currentUserPublicKey) {
      console.log(new Error("No current user public key found"));
      return [];
    }

    const _recipients = normalizeRecipients(possibleRecipients);

    if (_recipients.length === 0) {
      console.log(new Error("No recipients found"));
      return [];
    }

    const recipients = _recipients.map((r) => r.publicKey);
    const recipientsNPubkeys = normalizeRecipientsNPub(possibleRecipients);
    const chatRoomMapKey = recipients.join(",");

    if (chatRoomMap.has(chatRoomMapKey) || _chatRoomMap.has(chatRoomMapKey)) {
      console.log("chat room already exists: ", chatRoomMapKey);
      return;
    }

    const chatRoom: ChatRoom = {
      recipients,
      recipientsNPubkeys,
    };
    const message = JSON.stringify(chatRoom);

    const events = _recipients
      .map((r) => {
        const { tag: dTag } = createChatTag(r.publicKey);
        const event = wrapEvent(privateKey, r, message, [["d", dTag]]);
        return event;
      })
      .map((event) => {
        const _event = new NDKEvent(ndk, event);
        return _event;
      })
      .filter((event) => event.validate());

    await Promise.all(
      events.map(async (event, index) => {
        console.log(`storing chat room ${index + 1} of ${events.length}...`);
        await signPublishEvent(event as NDKEvent, {
          sign: false,
          repost: false,
          publish: true,
        });
        console.log(`chat room ${index + 1} of ${events.length} stored!`);
      })
    );

    setChatRooms(new Map([[chatRoomMapKey, chatRoom]]));
  };

  const handleChatRoomEventAndProfile = async (
    chatRoomPromise: [string, ChatRoom][]
  ) => {
    const cloneChatRoomMap = cloneDeep(chatRoomMap);

    chatRoomPromise.forEach(([chatRoomMapKey, chatRoom]) => {
      cloneChatRoomMap.set(chatRoomMapKey, chatRoom);
    });

    setChatRooms(cloneChatRoomMap);

    const profilePromises = chatRoomPromise
      .map(([, chatRoom]) => {
        return chatRoom.recipients;
      })
      .flat();

    await loadAndUpdateProfiles(profilePromises);

    return cloneChatRoomMap;
  };

  const loadChatRooms = async (_options: NDKSubscriptionOptions = {}) => {
    try {
      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey ?? recipientPrivateKey;
      if (!privateKey) {
        throw new Error("No private key found");
      }

      setLoading(true);

      const currentUserPublicKey = ndk?.activeUser?.pubkey;
      if (!currentUserPublicKey) {
        throw new Error("No current user public key found");
      }

      const { tag: dTag } = createChatTag(currentUserPublicKey);
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const events = await fetchEvents(filter);

      const chatRoomPromise = (
        await Promise.all(
          Array.from(events).map(async (event) => {
            try {
              const unwrappedGifts = nip17.unwrapEvent(
                event as Event,
                privateKey
              );
              const chatRoom = JSON.parse(unwrappedGifts.content) as ChatRoom;

              const chatRoomMapKey = chatRoom.recipients.join(",");
              // cloneChatRoomMap.set(chatRoomMapKey, chatRoom);

              return [chatRoomMapKey, chatRoom];
              // await loadProfile(chatRoom.recipients);
            } catch (error) {
              captureException(error);
              console.error("Error unwrapping gifts", error);
              return null;
            }
          })
        )
      ).filter(Boolean) as [string, ChatRoom][];

      return handleChatRoomEventAndProfile(chatRoomPromise);
    } catch (error) {
      captureException(error);
      console.error("Error loading chat rooms", error);
      return new Map();
    } finally {
      setLoading(false);
    }
  };

  const asyncLoadChatRooms = async (_options: NDKSubscriptionOptions = {}) => {
    try {
      console.log(`
        
        useNip17ChatRooms: ALIVE
        
        
        ---`);
      // @ts-expect-error
      const privateKey = ndk?.signer?._privateKey ?? recipientPrivateKey;

      if (!privateKey) {
        throw new Error("No private key found");
      }

      const currentUserPublicKey = ndk?.activeUser?.pubkey;

      if (!currentUserPublicKey) {
        throw new Error("No current user public key found");
      }

      const { tag: dTag } = createChatTag(currentUserPublicKey);
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      sub = ndk?.subscribe(filter, options)!;

      sub.on("event", async (event: NDKEvent) => {
        try {
          setLoading(true);
          const unwrappedGifts = nip17.unwrapEvent(event as Event, privateKey);
          const chatRoom = JSON.parse(unwrappedGifts.content) as ChatRoom;
          const chatRoomMapKey = chatRoom.recipients.join(",");

          handleChatRoomEventAndProfile([[chatRoomMapKey, chatRoom]]);
        } catch (error) {
          captureException(error);
          console.error("Error unwrapping gifts", error);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      captureException(error);
      console.error("Error loading chat rooms", error);
    } finally {
    }
  };

  useEffect(() => {
    return () => {
      console.log(`
        
        useNip17ChatRooms: DEAD
        
        
        ---`);
      // Clean up subscriptions when the hook unmounts
      sub?.stop?.();
    };
  }, []);

  return {
    profiles: getChatRoomList().nip17,
    isLoading,
    isLoadingProfiles,
    chatRooms,
    loadChatRooms,
    asyncLoadChatRooms,
    storeChatRoom,
    // Chatlist store functionality
    isChatListLoading,
    isChatListSaving,
    chatListError,
    loadStoredChatRooms,
    saveStoredChatRooms,
    removeChatRoom,
    clearChatRoom,
    wipeCleanChatRooms,
    clearChatListError,
  };
}
