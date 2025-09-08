import { NostrEvent } from "@nostr-dev-kit/ndk";
import {
  EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getEventHash,
  getPublicKey,
  UnsignedEvent,
} from "nostr-tools";
import { GiftWrap, Seal } from "nostr-tools/kinds";

import { decrypt, encrypt, getConversationKey } from "./nip44";

type Rumor = UnsignedEvent & { id: string };

export const TWO_DAYS = 2 * 24 * 60 * 60;

export const now = () => Math.round(Date.now() / 1000);
export const randomNow = () => Math.round(now() - Math.random() * TWO_DAYS);

const nip44ConversationKey = (privateKey: Uint8Array, publicKey: string) => {
  return getConversationKey(privateKey, publicKey);
};

const nip44Encrypt = (
  data: EventTemplate,
  privateKey: Uint8Array,
  publicKey: string
) => {
  const encrypted = encrypt(
    JSON.stringify(data),
    nip44ConversationKey(privateKey, publicKey)
  );
  return encrypted;
};

const nip44Decrypt = (data: NostrEvent, privateKey: Uint8Array) =>
  JSON.parse(
    decrypt(data.content, nip44ConversationKey(privateKey, data.pubkey))
  );

export function createRumor(
  event: Partial<UnsignedEvent>,
  privateKey: Uint8Array
): Rumor {
  const rumor = {
    created_at: now(),
    content: "",
    tags: [],
    ...event,
    pubkey: getPublicKey(privateKey),
  } as any;

  rumor.id = getEventHash(rumor);

  return rumor as Rumor;
}

export function createSeal(
  rumor: Rumor,
  privateKey: Uint8Array,
  recipientPublicKey: string
): NostrEvent {
  return finalizeEvent(
    {
      kind: Seal,
      content: nip44Encrypt(rumor, privateKey, recipientPublicKey),
      created_at: randomNow(),
      tags: [],
    },
    privateKey
  );
}

export function createWrap(
  seal: NostrEvent,
  recipientPublicKey: string,
  tags: string[][]
): NostrEvent {
  const randomKey = generateSecretKey();
  const kind = GiftWrap;
  const created_at = randomNow();
  const content = nip44Encrypt(seal, randomKey, recipientPublicKey);

  const result = finalizeEvent(
    {
      kind,
      content,
      created_at,
      tags: [["p", recipientPublicKey], ...tags],
    },
    randomKey
  ) as NostrEvent;

  return result;
}

export function wrapEvent(
  event: Partial<UnsignedEvent>,
  senderPrivateKey: Uint8Array,
  recipientPublicKey: string,
  tags: string[][]
): NostrEvent {
  const rumor = createRumor(event, senderPrivateKey);
  const seal = createSeal(rumor, senderPrivateKey, recipientPublicKey);

  const wrap = createWrap(seal, recipientPublicKey, tags);

  return wrap;
}

export function wrapManyEvents(
  event: Partial<UnsignedEvent>,
  senderPrivateKey: Uint8Array,
  recipientsPublicKeys: string[]
): NostrEvent[] {
  if (!recipientsPublicKeys || recipientsPublicKeys.length === 0) {
    throw new Error("At least one recipient is required.");
  }
  const senderPublicKey = getPublicKey(senderPrivateKey);
  const wrappeds = [wrapEvent(event, senderPrivateKey, senderPublicKey)];

  recipientsPublicKeys.forEach((recipientPublicKey) => {
    wrappeds.push(wrapEvent(event, senderPrivateKey, recipientPublicKey));
  });

  return wrappeds;
}

export function unwrapEvent(
  wrap: NostrEvent,
  recipientPrivateKey: Uint8Array
): Rumor {
  const unwrappedSeal = nip44Decrypt(wrap, recipientPrivateKey);
  return nip44Decrypt(unwrappedSeal, recipientPrivateKey);
}

export function unwrapManyEvents(
  wrappedEvents: NostrEvent[],
  recipientPrivateKey: Uint8Array
): Rumor[] {
  let unwrappedEvents: Rumor[] = [];

  wrappedEvents.forEach((e) => {
    unwrappedEvents.push(unwrapEvent(e, recipientPrivateKey));
  });

  unwrappedEvents.sort((a, b) => a.created_at - b.created_at);

  return unwrappedEvents;
}
