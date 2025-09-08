/**
 * Nostr Protocol Constants
 *
 * Centralized configuration for all Nostr-related constants,
 * timeouts, limits, and default values.
 */

// Timeouts (in milliseconds)
export const NOSTR_TIMEOUTS = {
  // Publishing timeouts
  PUBLISH_COOLDOWN: 3000,
  RAPID_PUBLISH_COOLDOWN: 2000,
  PUBLISH_TIMEOUT: 15000,

  // Subscription timeouts
  SUBSCRIPTION_TIMEOUT: 10000,
  SUBSCRIPTION_EOSE_TIMEOUT: 3000,

  // Connection timeouts
  RELAY_CONNECTION_TIMEOUT: 5000,
  POOL_STABILIZATION_DELAY: 2000,
  POOL_CLEANUP_DELAY: 500,

  // Debounce timeouts
  MESSAGE_DEBOUNCE: 200,
  STORAGE_SAVE_DEBOUNCE: 1000,
} as const;

// Limits and thresholds
export const NOSTR_LIMITS = {
  // Memory management
  MAX_EVENTS_IN_MEMORY: 100,
  MAX_RETRIES: 3,
  MAX_CONSECUTIVE_FAILURES: 2,

  // Message management
  MESSAGE_PER_PAGE: 30,
  ACCEPTABLE_LESS_PAGE_MESSAGES: 5,
  SCROLL_DETECT_THRESHOLD: 5,

  // Time ranges
  DEFAULT_MESSAGE_HISTORY_DAYS: 10,
  REFRESH_INTERVAL_MINUTES: 5,
} as const;

// Default recipients and test keys
export const NOSTR_DEFAULTS = {
  // Test/Demo recipient (should be configurable via env)
  DEFAULT_CHAT_RECIPIENT:
    process.env.EXPO_PUBLIC_DEFAULT_CHAT_PUBKEY ||
    "000ce6323f7789c48099bbd7da7248634d3310b170992ab15dbdd677c91ed287",
} as const;

// Storage keys
export const NOSTR_STORAGE_KEYS = {
  PRIVATE_KEY: "nostr_private_key",
  RELAYS: "nostr_relays",
  USER_PROFILE: "nostr_user_profile",
  CHAT_DATA: "nostream-chat-data",
  CHATLIST_DATA: "nostream-chatlist-data",
} as const;

// Event kinds (from NIP-01)
export const NOSTR_EVENT_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_RELAY: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  EVENT_DELETION: 5,
  REACTION: 7,
  CHANNEL_CREATION: 40,
  CHANNEL_METADATA: 41,
  CHANNEL_MESSAGE: 42,
  CHANNEL_HIDE_MESSAGE: 43,
  CHANNEL_MUTE_USER: 44,
  GIFT_WRAP: 1059,
  PRIVATE_DIRECT_MESSAGE: 14,
} as const;

// NIP identifiers
export const NIPS = {
  NIP04: "NIP04" as const,
  NIP17: "NIP17" as const,
  NIP44: "NIP44" as const,
  NIP59: "NIP59" as const,
} as const;

// Error codes for consistent error handling
export const NOSTR_ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  PUBLISH_FAILED: "PUBLISH_FAILED",
  SUBSCRIPTION_FAILED: "SUBSCRIPTION_FAILED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  ENCRYPTION_FAILED: "ENCRYPTION_FAILED",
  DECRYPTION_FAILED: "DECRYPTION_FAILED",
  INVALID_KEY: "INVALID_KEY",
  RELAY_ERROR: "RELAY_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

export type NostrErrorCode =
  (typeof NOSTR_ERROR_CODES)[keyof typeof NOSTR_ERROR_CODES];
export type NipType = (typeof NIPS)[keyof typeof NIPS];
