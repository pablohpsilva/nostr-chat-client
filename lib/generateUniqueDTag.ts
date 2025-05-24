import { sha256 } from "@noble/hashes/sha256";
// import * as Crypto from "expo-crypto";

const DEFAULT_SALT = process.env.EXPO_PUBLIC_SALT || "nostr-tools";

export function generateUniqueDTag(
  pubkeys: string[],
  salt: string = DEFAULT_SALT
) {
  // 1. Sort the pubkeys lexicographically
  const sortedPubkeys = pubkeys.sort().concat(salt);
  // console.log("sortedPubkeys", sortedPubkeys);

  // 2. Combine them into a single string
  const chatKey = sortedPubkeys.join(":");
  // 3. Hash the string using sha256 from nostr-tools
  const hashBytes = sha256(chatKey);
  const dTag = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // return `${dTag.slice(0, 12)}${dTag.slice(52)}`;
  // return `tag:${dTag}`;
  return dTag;
}

export function randomizeString(
  pubkeys: string[],
  salt: string = DEFAULT_SALT
): string {
  const sortedPubkeys = pubkeys.sort().concat(salt);
  const chatKey = sortedPubkeys.join(":");

  const hashBytes = new TextEncoder().encode(chatKey);
  const randomString = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return randomString;
}
