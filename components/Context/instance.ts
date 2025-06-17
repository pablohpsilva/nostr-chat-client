import NDK, {
  NDKEvent,
  NDKFilter,
  NDKKind,
  NDKNip07Signer,
  NDKNip46Signer,
  NDKPrivateKeySigner,
  NDKRelaySet,
} from "@nostr-dev-kit/ndk";
import { useEffect, useRef, useState } from "react";

import { alertUser } from "@/utils/alert";

export default function NDKInstance(explicitRelayUrls: string[]) {
  const loaded = useRef(false);

  const [ndk, _setNDK] = useState<NDK | undefined>(undefined);
  const [signer, _setSigner] = useState<
    NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer | undefined
  >(undefined);

  useEffect(() => {
    async function load() {
      if (ndk === undefined && loaded.current === false) {
        loaded.current = true;
        await loadNdk(explicitRelayUrls);
      }
    }
    load();
  }, []);

  async function loadNdk(
    explicitRelayUrls: string[],
    signer?: NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer
  ) {
    const ndkInstance = new NDK({ explicitRelayUrls, signer });

    if (signer) {
      _setSigner(signer);
    }

    try {
      await ndkInstance.connect();
      alertUser("CONNECTED");
      _setNDK(ndkInstance);
    } catch (error) {
      console.error("ERROR loading NDK NDKInstance", error);
    }
  }

  function unloadNdk() {
    if (ndk === undefined) return;
    _setSigner(undefined);
    const connectedRelays = ndk.pool.connectedRelays();
    connectedRelays.forEach((relay) => {
      relay.disconnect();
    });
    _setNDK(undefined);
  }

  async function setSigner(
    signer: NDKPrivateKeySigner | NDKNip46Signer | NDKNip07Signer | undefined
  ) {
    if (signer !== undefined) {
      await loadNdk(explicitRelayUrls, signer);
    } else {
      unloadNdk();
    }
  }

  async function fetchEvents(filter: NDKFilter): Promise<NDKEvent[]> {
    if (ndk === undefined) return [];

    return new Promise((resolve) => {
      const events: Map<string, NDKEvent> = new Map();

      const relaySetSubscription = ndk.subscribe(filter, {
        closeOnEose: true,
      });

      relaySetSubscription.on("event", (event: NDKEvent) => {
        event.ndk = ndk;
        events.set(event.tagId(), event);
      });

      relaySetSubscription.on("eose", () => {
        setTimeout(() => resolve(Array.from(new Set(events.values()))), 3000);
      });
    });
  }

  async function signPublishEvent(
    event: NDKEvent,
    params: { repost: boolean; publish: boolean; sign: boolean } | undefined = {
      repost: false,
      sign: true,
      publish: true,
    }
  ) {
    try {
      if (ndk === undefined) {
        return;
      }

      event.ndk = ndk;

      if (params.repost) {
        await event.repost();
      }

      if (params.sign) {
        await event.sign();
      }

      if (params.publish) {
        alertUser(`0. ndk: ${Boolean(ndk)}`);
        alertUser(`1. ndk.explicitRelayUrls: ${ndk.explicitRelayUrls}`);
        const relaySet = NDKRelaySet.fromRelayUrls(ndk.explicitRelayUrls!, ndk);
        alertUser(`2. relaySet: ${Boolean(relaySet)}`);

        // If the published event is a delete event, notify the cache if there is one
        if (
          event.kind === NDKKind.EventDeletion &&
          ndk.cacheAdapter?.deleteEventIds
        ) {
          const eTags = event.getMatchingTags("e").map((tag) => tag[1]);
          ndk.cacheAdapter.deleteEventIds(eTags);
        }

        // if (ndk.cacheAdapter?.addUnpublishedEvent) {
        //   try {
        //     ndk.cacheAdapter?.addUnpublishedEvent?.(event, relaySet.relayUrls);
        //   } catch (e) {
        //     console.error("Error adding unpublished event to cache", e);
        //   }
        // }

        // if this is a delete event, send immediately to the cache
        if (
          event.kind === NDKKind.EventDeletion &&
          ndk.cacheAdapter?.deleteEventIds
        ) {
          ndk.cacheAdapter?.deleteEventIds(
            event.getMatchingTags("e").map((tag) => tag[1])
          );
        }

        alertUser(`3. ndk.subManager: ${Boolean(ndk.subManager)}`);
        alertUser(
          `4. ndk.subManager.dispatchEvent: ${Boolean(
            ndk.subManager.dispatchEvent
          )}`
        );
        alertUser(`5. event.rawEvent: ${Boolean(event.rawEvent)}`);
        alertUser(`6. event.rawEvent: ${event.rawEvent()}`);
        ndk.subManager.dispatchEvent(event.rawEvent(), undefined, true);
        alertUser("7. DISPATCHED");

        alertUser(`8. relaySet.publish: ${relaySet.publish}`);
        const relays = await relaySet.publish(event, 10 * 1000, 1);
        alertUser(`9. relays: ${relays}`);
        alertUser("10. EVENT PUBLISHED");

        alertUser(
          `11. ndk.subManager.seenEvent: ${Boolean(ndk.subManager.seenEvent)}`
        );
        relays.forEach((relay) => ndk?.subManager.seenEvent(event.id, relay));
        alertUser("12. SEEN EVENT");
      }

      return event;
    } catch (error) {
      alertUser(error as string);
      throw error;
    }
  }

  return {
    ndk,
    signer,
    loadNdk,
    setSigner,
    fetchEvents,
    signPublishEvent,
  };
}
