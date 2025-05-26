import {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKSubscription,
  NDKSubscriptionOptions,
  NDKUserProfile,
} from "@nostr-dev-kit/ndk";
import cloneDeep from "lodash.clonedeep";
import { Event, nip17, nip19 } from "nostr-tools";
import { useEffect, useMemo, useRef, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Recipient } from "@/constants/types";
import { generateUniqueDTag } from "@/lib/generateUniqueDTag";
import { wrapEvent } from "@/lib/nip17";

export interface ChatRoom {
  recipients: string[];
  recipientsNPubkeys: string[];
}
export type NIP17UserProfile = NDKUserProfile & {
  pubkey: string;
  npub: string;
};

let sub: NDKSubscription | null = null;

export default function useNip17ChatRooms(recipientPrivateKey?: Uint8Array) {
  const [isLoading, setLoading] = useState(false);
  const [chatRoomMap, setChatRoomMap] = useState<Map<string, ChatRoom>>(
    new Map()
  );
  const [profilesMap, setProfilesMap] = useState<Map<string, NIP17UserProfile>>(
    new Map()
  );
  const chatRooms = useMemo(
    () => Array.from(chatRoomMap.values()),
    [chatRoomMap.values()]
  );
  const profiles = useMemo(
    () => Array.from(profilesMap.values()),
    [profilesMap.values()]
  );
  const ref = useRef<"loading" | "loaded" | null>(null);

  const storeChatRoom = async (
    _recipient: Recipient | Recipient[],
    _currentUserPublicKey?: string
  ) => {
    const ndk = getNDK().getInstance();

    // @ts-expect-error
    const privateKey = getNDK().getInstance().signer?._privateKey;
    const currentUserPublicKey =
      ndk.activeUser?.pubkey ?? _currentUserPublicKey;

    if (!privateKey) {
      console.log(new Error("No private key found"));
      return [];
    }

    if (!currentUserPublicKey) {
      console.log(new Error("No current user public key found"));
      return [];
    }

    const _recipients = (
      Array.isArray(_recipient) ? _recipient : [_recipient]
    ).concat({ publicKey: currentUserPublicKey });
    const recipients = _recipients.map((r) => r.publicKey);
    const recipientsNPubkeys = recipients.map((r) => nip19.npubEncode(r));

    if (chatRoomMap.has(recipients.join(","))) {
      console.log("chat room already exists: ", recipients.join(","));
      return;
    }

    const chatRoom: ChatRoom = {
      recipients,
      recipientsNPubkeys,
    };
    const message = JSON.stringify(chatRoom);

    const events = await Promise.all(
      _recipients.map(async (r) => {
        const dTag = generateUniqueDTag([r.publicKey]);
        const event = wrapEvent(privateKey, r, message, [["d", dTag]]);
        return Object.assign(new NDKEvent(getNDK().getInstance()), event);
      })
    );

    await Promise.all(
      events.map(async (event, index) => {
        console.log(`storing chat room ${index + 1} of ${events.length}...`);
        await event.publish();
        console.log(`chat room ${index + 1} of ${events.length} stored!`);
      })
    );

    setChatRoomMap((prev) => {
      prev.set(recipients.join(","), chatRoom);
      return prev;
    });
  };

  const loadProfile = async (pubkeys: string[]) => {
    const ndk = getNDK().getInstance();
    const profiles = (
      await Promise.all(
        pubkeys
          .filter((pubkey) => !profilesMap.has(pubkey))
          .filter((pubkey) => pubkey !== ndk.activeUser?.pubkey)
          .map(async (pubkey) => {
            const profile = await ndk.getUser({ pubkey }).fetchProfile();
            const defaultProfileValues = {
              pubkey,
              npub: nip19.npubEncode(pubkey),
            };

            if (profile) {
              return { ...profile, ...defaultProfileValues };
            }

            return defaultProfileValues;
          })
      )
    ).filter(Boolean) as NIP17UserProfile[];

    const cloneProfileMap = cloneDeep(profilesMap);

    profiles.forEach((profile) => cloneProfileMap.set(profile.pubkey, profile));

    setProfilesMap(cloneProfileMap);
  };

  /**
   * Get all the chat rooms for the current user, unless a recipient private key is provided
   * @returns Rumor[]
   */
  const loadChatRooms = async (_options: NDKSubscriptionOptions = {}) => {
    try {
      const ndk = getNDK().getInstance();
      // @ts-expect-error
      const privateKey = ndk.signer?._privateKey ?? recipientPrivateKey;

      if (!privateKey) {
        console.log(new Error("No private key found"));
        return [];
      }

      setLoading(true);
      if (!ref.current) {
        ref.current = "loading";
      }
      const currentUserPublicKey = ndk.activeUser?.pubkey;

      if (!currentUserPublicKey) {
        console.log(new Error("No current user public key found"));
        return [];
      }

      const dTag = generateUniqueDTag([currentUserPublicKey]);
      console.log("dTag", dTag);

      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const events = await ndk.fetchEvents(filter);

      const cloneChatRoomMap = cloneDeep(chatRoomMap);

      for (const event of events) {
        try {
          const unwrappedGifts = nip17.unwrapEvent(event as Event, privateKey);
          const chatRoom = JSON.parse(unwrappedGifts.content) as ChatRoom;

          cloneChatRoomMap.set(dTag, chatRoom);

          // chatRoom.recipients.forEach((recipient) => {
          //   cloneChatRoomMap.set(recipient, chatRoom);
          // });

          await loadProfile(chatRoom.recipients);
        } catch (err) {
          console.error("Error unwrapping gifts", err);
        }
      }

      setChatRoomMap(cloneChatRoomMap);

      return chatRoomMap;
    } catch (error) {
      console.error("Error loading chat rooms", error);
      return () => {};
    } finally {
      setLoading(false);
      ref.current = "loaded";
    }
  };

  /**
   * Get all the chat rooms for the current user, unless a recipient private key is provided
   * @returns Rumor[]
   */
  const asyncLoadChatRooms = async (_options: NDKSubscriptionOptions = {}) => {
    try {
      console.log(`
        
        ALIVE
        
        
        ---`);
      const ndk = getNDK().getInstance();
      // @ts-expect-error
      const privateKey = ndk.signer?._privateKey ?? recipientPrivateKey;

      if (!privateKey) {
        console.log(new Error("No private key found"));
        return [];
      }

      setLoading(true);
      if (!ref.current) {
        ref.current = "loading";
      }

      const currentUserPublicKey = ndk.activeUser?.pubkey;

      if (!currentUserPublicKey) {
        console.log(new Error("No current user public key found"));
        return [];
      }

      const dTag = generateUniqueDTag([currentUserPublicKey]);
      const filter: NDKFilter = {
        kinds: [NDKKind.GiftWrap],
        "#d": [dTag],
      };

      const options: NDKSubscriptionOptions = {
        closeOnEose: false, // Keep the subscription open
        ..._options,
      };

      sub = getNDK().getInstance().subscribe(filter, options);

      sub.on("event", (event: NDKEvent) => {
        try {
          const unwrappedGifts = nip17.unwrapEvent(event as Event, privateKey);
          const chatRoom = JSON.parse(unwrappedGifts.content) as ChatRoom;
          const cloneChatRoomMap = cloneDeep(chatRoomMap);

          chatRoom.recipients.forEach((recipient) => {
            cloneChatRoomMap.set(recipient, chatRoom);
          });

          setChatRoomMap(cloneChatRoomMap);

          loadProfile(chatRoom.recipients);
        } catch (err) {
          console.error("Error unwrapping gifts", err);
        }
      });
    } catch (error) {
      console.error("Error loading chat rooms", error);
      return () => {};
    } finally {
      setLoading(false);
      ref.current = "loaded";
    }
  };

  useEffect(() => {
    return () => {
      console.log(`
        
        DEAD
        
        
        ---`);
      // Clean up subscriptions when the hook unmounts
      sub?.stop?.();
    };
  }, []);

  return {
    isLoading,
    chatRooms,
    profiles,
    loadChatRooms,
    asyncLoadChatRooms,
    storeChatRoom,
    hasEverLoaded: ref.current === "loaded",
  };
}
