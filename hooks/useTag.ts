import { nip19 } from "nostr-tools";

import { useNDK } from "@/components/Context";
import { NIP17PossiblePublicKeys, Recipient } from "@/constants/types";
import { generateUniqueDTag } from "@/interal-lib/generateUniqueDTag";

/**
 * Generic function to remove duplicates from an array based on a key.
 * It handles both primitive values and objects with specified key properties.
 *
 * @param array - The array to remove duplicates from
 * @param keyProp - The property name to use as unique key (e.g. 'publicKey', 'pubkey', 'id')
 * @returns Array with duplicates removed
 */
export function removeDuplicatesByKey<T>(array: T[], keyProp?: string): T[] {
  const seen = new Set<string>();

  return array.filter((item) => {
    let key: string;
    if (typeof item === "string") {
      key = item;
    } else if (
      typeof item === "object" &&
      item !== null &&
      keyProp &&
      keyProp in item
    ) {
      // @ts-expect-error - We know the key exists due to the check above
      key = String(item[keyProp]);
    } else {
      key = String(item);
    }

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function useTag() {
  const { ndk } = useNDK();

  // Example usage:
  // removeDuplicatesByKey(items) // For primitive arrays
  // removeDuplicatesByKey(items, 'publicKey') // For objects with publicKey
  // removeDuplicatesByKey(items, 'pubkey') // For objects with pubkey
  // removeDuplicatesByKey(items, 'id') // For objects with id

  /**
   * This function will normalize the recipients.
   * It will convert string-like npub recipients to the format that is expected by the NDK.
   *
   *
   * @param possiblePublicKeys
   * @returns Recipient[]
   */
  const normalizeRecipients = (
    possiblePublicKeys?: NIP17PossiblePublicKeys,
    ignoreCurrentUser = false
  ): Recipient[] => {
    if (!possiblePublicKeys) {
      throw new Error("No public key found");
    }

    const recipients = Array.isArray(possiblePublicKeys)
      ? possiblePublicKeys
      : [possiblePublicKeys];

    const result = removeDuplicatesByKey(
      recipients.map((r) => {
        if (typeof r === "string") {
          if (r.startsWith("npub")) {
            const { data: publicKey } = nip19.decode(r);
            return { publicKey: publicKey as string } as Recipient;
          }

          return { publicKey: r } as Recipient;
        }

        if (r.publicKey.startsWith("npub")) {
          const { data: publicKey } = nip19.decode(r.publicKey);
          return { ...r, publicKey: publicKey as string } as Recipient;
        }

        return r;
      }),
      "publicKey"
    );

    if (!ignoreCurrentUser) {
      return removeDuplicatesByKey(
        result.concat({
          publicKey: ndk?.activeUser?.pubkey!,
        }),
        "publicKey"
      );
    }

    return result;
  };

  const normalizeRecipientsNPub = (
    possiblePublicKeys?: NIP17PossiblePublicKeys,
    ignoreCurrentUser = false
  ): nip19.NPub[] => {
    if (!possiblePublicKeys) {
      throw new Error("No public key found");
    }

    const recipients = Array.isArray(possiblePublicKeys)
      ? possiblePublicKeys
      : [possiblePublicKeys];

    const result = removeDuplicatesByKey(
      recipients.map((r) => {
        if (typeof r === "string") {
          if (r.startsWith("npub")) {
            return r as nip19.NPub;
          }

          return nip19.npubEncode(r);
        }
        return nip19.npubEncode(r.publicKey) as nip19.NPub;
      }),
      "publicKey"
    );

    if (!ignoreCurrentUser) {
      return removeDuplicatesByKey(
        result.concat(nip19.npubEncode(ndk?.activeUser?.pubkey!)),
        "publicKey"
      );
    }

    return result;
  };

  /**
   * This function will handle the chat tag.
   * Chat tags can be used to anonymously identify a chat.
   * The idea here is to create a tag using the public key of a user.
   * The event (not done here) shall contain an encrypted message/content that will be decrypted,
   * allowing the recipient to identify who he was talking to.
   *
   * @param _publicKey - The public key of the user. If not provided, the current user will be used.
   * @returns {
   *  tag: string,
   *  recipient: Recipient,
   *  recipientPublicKey: string
   * }
   */
  const createChatTag = (_publicKey?: string) => {
    const [publicKey] = normalizeRecipients(
      _publicKey || ndk?.activeUser?.pubkey
    );

    if (!publicKey) {
      throw new Error("No public key found");
    }

    const tag = generateUniqueDTag([publicKey.publicKey]);

    return {
      tag,
      recipient: publicKey,
      recipientPublicKey: publicKey.publicKey,
    };
  };

  /**
   * This function will handle the message tag.
   * Use this function to create a tag for a message.
   * The same tag shall be used for all recipients of the message.
   * This way we can have "groups" that will be anonymusly identified.
   *
   * @param recipients - The recipients of the message.
   * @param ignoreCurrentUserOnTag - If true, the current user will not be included in the tag. DO NOT use this, unless you know what you're doing.
   * @returns {
   *  tag: string,
   *  recipients: Recipient[],
   *  recipientsPublicKeys: string[]
   * }
   */
  const createMessageTag = (
    possibleRecipients: string[] | nip19.NPub[] | Recipient[],
    ignoreCurrentUserOnTag = false,
    ignoreCurrentUserOnRecipients = true
  ) => {
    const currentUser = ndk?.activeUser?.pubkey;

    const recipients = normalizeRecipients(possibleRecipients, true);

    if (!ignoreCurrentUserOnRecipients) {
      recipients.push({ publicKey: currentUser! });
    }

    if (!ignoreCurrentUserOnTag && !currentUser) {
      throw new Error("No current user found");
    }

    const recipientsPublicKeys = recipients.map((r) => r.publicKey);
    if (!ignoreCurrentUserOnTag) {
      recipientsPublicKeys.push(currentUser!);
    }

    const tag = generateUniqueDTag(recipientsPublicKeys);

    return {
      tag,
      recipients,
      recipientsPublicKeys,
    };
  };

  return {
    createChatTag,
    createMessageTag,
    normalizeRecipients,
    normalizeRecipientsNPub,
  };
}
