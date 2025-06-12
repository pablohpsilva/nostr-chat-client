// Here we will initialize NDK and configure it to be available throughout the application
import NDK from "@nostr-dev-kit/ndk";
// import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import {
  NDKSessionLocalStorage,
  useNDKInit,
  useNDKSessionMonitor,
} from "@nostr-dev-kit/ndk-hooks";
import { useEffect } from "react";

import { DEFAULT_RELAYS } from "@/constants";
import { RelayDict } from "@/constants/types";

// Setup Dexie cache adapter (Client-side only)
// let cacheAdapter: NDKCacheAdapterDexie | undefined;
// if (typeof window !== "undefined") {
//   cacheAdapter = new NDKCacheAdapterDexie({ dbName: APP_NAME });
// }

// Use the browser's localStorage for session storage
const sessionStorage = new NDKSessionLocalStorage();

// Singleton pattern to ensure only one NDK instance is used throughout the app
export const getNDK = (() => {
  const relays = DEFAULT_RELAYS;
  const relayUrls = Object.keys(relays);
  // This closure ensures we only have one reference to the NDK instance
  // Create the singleton NDK instance
  // const ndk = new NDK({ explicitRelayUrls: relayUrls, cacheAdapter });
  const ndk = new NDK({
    explicitRelayUrls: relayUrls,
  });
  let instance = ndk;

  // Connect to relays on initialization (client-side)
  // if (typeof window !== "undefined") ndk.connect();
  ndk.connect();

  // Return a function that always provides the same instance
  return () => {
    return {
      getInstance: () => instance,
      getRelayUrls: () => instance.explicitRelayUrls,
      setRelays: (newRelays: RelayDict) => {
        console.log("setRelays", newRelays);
        console.log("instance", instance);
        const explicitRelayUrls = Object.keys(newRelays);
        // instance = new NDK({ explicitRelayUrls, cacheAdapter });
        instance = new NDK({ explicitRelayUrls });
        if (typeof window !== "undefined") {
          instance.connect();
        }
      },
    };
  };
})();

const ndk = getNDK().getInstance();

// Helper to get the current user from the NDK instance
export const getCurrentUser = async () => {
  if (!ndk.signer) return null;
  return await ndk.signer.user();
};

export default function NDKHeadless() {
  const initNDK = useNDKInit();

  useNDKSessionMonitor(sessionStorage, {
    profile: true, // automatically fetch profile information for the active user
    follows: true, // automatically fetch follows of the active user
  });

  useEffect(() => {
    if (ndk) {
      initNDK(ndk);
    }
  }, [initNDK]);

  return null;
}
