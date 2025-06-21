import { sha256 } from "@noble/hashes/sha256";

const DEFAULT_SALT = process.env.EXPO_PUBLIC_SALT || "nostr-tools";

export function generateUniqueDTag(
  pubkeys: string[],
  salt: string = DEFAULT_SALT
) {
  console.log("generateUniqueDTag called with:", {
    pubkeys,
    salt,
    DEFAULT_SALT,
  });

  if (!pubkeys || pubkeys.length === 0) {
    console.error("No pubkeys provided to generateUniqueDTag");
    return "";
  }

  // 1. Sort the pubkeys lexicographically
  const sortedPubkeys = pubkeys.sort().concat(salt);

  // 2. Combine them into a single string
  const chatKey = sortedPubkeys.join(":");
  // 3. Hash the string using sha256 from nostr-tools
  const hashBytes = sha256(chatKey);
  const dTag = Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return dTag;
}
