import NDK, {
  NDKEvent,
  NDKFilter,
  NDKNip07Signer,
  NDKNip46Signer,
  NDKPrivateKeySigner,
} from "@nostr-dev-kit/ndk";
import { useEffect, useRef, useState } from "react";

import { alertUser } from "@/utils/alert";
import { captureException } from "@sentry/react-native";

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
        captureException("PUBLISHING EVENT");
        await event.publish();
        captureException("PUBLISHED EVENT");
      }

      return event;
    } catch (error) {
      captureException(error);
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
