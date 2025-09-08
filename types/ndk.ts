/**
 * Enhanced type definitions for NDK and Nostr
 * Provides proper typing to eliminate @ts-expect-error usage
 */

import NDK, { NDKSigner } from "@nostr-dev-kit/ndk";

/**
 * Extended NDK interface with typed signer access
 */
export interface TypedNDK extends NDK {
  signer?: TypedNDKSigner;
}

/**
 * Enhanced signer interface with proper private key access
 */
export interface TypedNDKSigner extends NDKSigner {
  _privateKey?: Uint8Array;
  privateKey?: Uint8Array;
}

/**
 * Type guard to check if signer has private key
 */
export function hasPrivateKey(signer: any): signer is TypedNDKSigner {
  return (
    signer &&
    (typeof signer._privateKey !== "undefined" ||
      typeof signer.privateKey !== "undefined")
  );
}

/**
 * Safely extract private key from signer
 */
export function getPrivateKey(signer: any): Uint8Array<ArrayBuffer> | null {
  if (!hasPrivateKey(signer)) {
    return null;
  }

  // Try different possible property names
  const key = signer._privateKey || signer.privateKey || null;

  if (!key) return null;

  // Ensure we return a proper Uint8Array with ArrayBuffer backing
  if (key instanceof Uint8Array) {
    // Convert to proper ArrayBuffer-backed Uint8Array if needed
    if (key.buffer instanceof ArrayBuffer) {
      return new Uint8Array(
        key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength)
      );
    }
    // For SharedArrayBuffer, create a new ArrayBuffer copy
    const buffer = new ArrayBuffer(key.byteLength);
    const view = new Uint8Array(buffer);
    view.set(key);
    return view;
  }

  return null;
}

/**
 * Type guard for NDK with signer
 */
export function hasNDKSigner(ndk: NDK): ndk is TypedNDK {
  return ndk.signer !== undefined;
}

/**
 * Enhanced event interface with better typing
 */
export interface TypedNDKEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  content: string;
  tags: string[][];
  sig: string;
  ndk?: TypedNDK;
}

/**
 * Nostr event filter with better typing
 */
export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  "#e"?: string[];
  "#p"?: string[];
  "#d"?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: any;
}

/**
 * User profile interface
 */
export interface NostrProfile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  [key: string]: any;
}

/**
 * Subscription options with better defaults
 */
export interface SubscriptionOptions {
  closeOnEose?: boolean;
  relayUrls?: string[];
  timeoutMs?: number;
  id?: string;
}
