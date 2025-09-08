/**
 * Modular Nostr Hooks
 *
 * This barrel export provides access to all focused Nostr hooks.
 * Each hook has a single responsibility and can be used independently.
 */

import { useNostrConnection } from "./useNostrConnection";
import { useNostrPublish } from "./useNostrPublish";

// Connection and authentication
export { useNostrConnection } from "./useNostrConnection";

// Publishing hooks
export { useNostrPublish } from "./useNostrPublish";
export { useNostrPublishNip17 } from "./useNostrPublishNip17";

// Subscription and event fetching
export { useNostrEvents, useNostrSubscription } from "./useNostrSubscription";

// Decryption
export { useNostrDecryption } from "./useNostrDecryption";

// Global event monitoring
export { useNostrGlobalEvents } from "./useNostrGlobalEvents";

/**
 * Composite hook that combines connection and basic publishing
 * For compatibility with existing code that expects a single hook
 */

export function useNostrTools() {
  const connection = useNostrConnection();
  const publish = useNostrPublish();

  return {
    // Connection state and methods
    ...connection,

    // Publishing methods (for backward compatibility)
    ...publish,
  };
}

// Re-export types from internal lib for convenience
export type {
  NostrEvent,
  NostrFilter,
  NostrUser,
  RelayInfo,
} from "@/internal-lib/ndk";
