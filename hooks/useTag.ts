import { nip19 } from "nostr-tools";

import { getNDK } from "@/components/NDKHeadless";
import {
  NIP17PossiblePublicKey,
  NIP17PossiblePublicKeys,
  Recipient,
} from "@/constants/types";
import { generateUniqueDTag } from "@/lib/generateUniqueDTag";

/**
 * This function will remove duplicates from an array.
 * It will also normalize the recipients.
 *
 * @param value - The array to remove duplicates from.
 * @returns The array with duplicates removed.
 */
export function removeDuplicates<T extends NIP17PossiblePublicKey>(
  value: T[]
): T[] {
  const seen = new Set<string>();
  return value.filter((item) => {
    let key: string;
    if (typeof item === "string") {
      key = item;
    } else if (typeof item === "object" && "publicKey" in item) {
      key = item.publicKey;
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

export function removeDuplicateEventsViaId<T extends { id: string | number }>(
  value: T[]
): T[] {
  const seen = new Set<string>();
  return value.filter((item) => {
    let key: string;
    if (typeof item === "string") {
      key = item;
    } else if (typeof item === "object" && "id" in item) {
      // @ts-expect-error
      key = item.id;
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

/**
 * This function will normalize the recipients.
 * It will convert string-like npub recipients to the format that is expected by the NDK.
 *
 *
 * @param possiblePublicKeys
 * @returns Recipient[]
 */
export function normalizeRecipients(
  possiblePublicKeys?: NIP17PossiblePublicKeys,
  ignoreCurrentUser = false
): Recipient[] {
  if (!possiblePublicKeys) {
    throw new Error("No public key found");
  }

  const recipients = Array.isArray(possiblePublicKeys)
    ? possiblePublicKeys
    : [possiblePublicKeys];

  const result = removeDuplicates(
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
    })
  );

  if (!ignoreCurrentUser) {
    return removeDuplicates(
      result.concat({
        publicKey: getNDK().getInstance().activeUser?.pubkey!,
      })
    );
  }

  return result;
}

export function normalizeRecipientsNPub(
  possiblePublicKeys?: NIP17PossiblePublicKeys,
  ignoreCurrentUser = false
): nip19.NPub[] {
  if (!possiblePublicKeys) {
    throw new Error("No public key found");
  }

  const recipients = Array.isArray(possiblePublicKeys)
    ? possiblePublicKeys
    : [possiblePublicKeys];

  const result = removeDuplicates(
    recipients.map((r) => {
      if (typeof r === "string") {
        if (r.startsWith("npub")) {
          return r as nip19.NPub;
        }

        return nip19.npubEncode(r);
      }
      return nip19.npubEncode(r.publicKey) as nip19.NPub;
    })
  );

  if (!ignoreCurrentUser) {
    return removeDuplicates(
      result.concat(
        nip19.npubEncode(getNDK().getInstance().activeUser?.pubkey!)
      )
    );
  }

  return result;
}

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
export function createChatTag(_publicKey?: string) {
  const [publicKey] = normalizeRecipients(
    _publicKey || getNDK().getInstance().activeUser?.pubkey
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
}

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
export function createMessageTag(
  possibleRecipients: string[] | nip19.NPub[] | Recipient[],
  ignoreCurrentUserOnTag = false,
  ignoreCurrentUserOnRecipients = true
) {
  const currentUser = getNDK().getInstance().activeUser?.pubkey;

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
}
