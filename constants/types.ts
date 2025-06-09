import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
// import { RESULTS } from "react-native-permissions";

export type Platform = "web" | "ios" | "android";

export type SyntheticPrivKey = "nip07" | "none";
export type PrivKey = string | SyntheticPrivKey;

export type RavenState = {
  ready: boolean;
  dmsDone: boolean;
  syncDone: boolean;
};

export type Keys =
  | {
      pub: string;
      priv: string;
    }
  | {
      pub: string;
      priv: SyntheticPrivKey;
    }
  | null;

export type KeysV2 = {
  // Public
  publicKey: string;
  npub: `npub${string}`;
  // Private
  privateSigner: PrivKey;
  nsec: `nsec${string}`;
  privateKey: string;
};

export type Metadata = {
  name: string;
  about: string;
  picture: string;
};

export type DirectContact = { pub: string; npub: string };

export type Profile = {
  id: string;
  creator: string;
  created: number;
  nip05: string;
} & Metadata;

export type Channel = {
  id: string;
  creator: string;
  created: number;
} & Metadata;

export type ChannelUpdate = { channelId: string } & Channel;

export type EventDeletion = { eventId: string; why: string };

export type PublicMessage = {
  id: string;
  root: string;
  content: string;
  creator: string;
  created: number;
  children?: PublicMessage[];
  reactions?: Reaction[];
  mentions: string[];
};

export type DirectMessage = {
  id: string;
  root?: string;
  content: string;
  peer: string;
  creator: string;
  created: number;
  children?: DirectMessage[];
  reactions?: Reaction[];
  mentions: string[];
  decrypted: boolean;
};

export type Message = PublicMessage | DirectMessage;

export type ChannelMessageHide = { id: string; reason: string };

export type ChannelUserMute = { pubkey: string; reason: string };

export type RelayConfig = {
  read: boolean;
  write: boolean;
};

export type RelayDict = Record<string, RelayConfig>;

export type MuteList = { pubkeys: string[]; encrypted: string };

export type Reaction = {
  id: string;
  message: string;
  peer: string;
  content: string;
  creator: string;
  created: number;
};

export type ReactionCombined = {
  symbol: string;
  authors: string[];
  count: number;
  userReaction: Reaction | undefined;
};

export type ReadMarkMap = Record<string, number>;

export type Recipient = {
  publicKey: string;
  relayUrl?: string;
};

export type ReplyTo = {
  eventId: string;
  relayUrl?: string;
};

export interface ChatRoom {
  recipients: string[];
  recipientsNPubkeys: string[];
}

export type AppUserProfile = NDKUserProfile & {
  pubkey: string;
  npub: string;
  nip: "NIP17" | "NIP04";
};

export type NIP17PossiblePublicKeys =
  | string
  | string[]
  | nip19.NPub
  | nip19.NPub[]
  | Recipient
  | Recipient[];

export type NIP17PossiblePublicKey = string | nip19.NPub | Recipient;

export type TUsePermissionsReturnType = {
  isError?: boolean;
  type: (typeof RESULTS)[keyof typeof RESULTS];
  errorMessage?: string;
};

export interface ICameraScannerProps {
  setIsCameraShown: (value: boolean) => void;
  onReadCode: (value: string) => void;
}
