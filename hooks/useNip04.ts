import { NDKFilter, NDKKind, NDKUserProfile } from "@nostr-dev-kit/ndk";
import { useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Event, nip19 } from "nostr-tools";

const CACHE_KEY_NIP04_PROFILE_EVENT_IDS = "nip04-profile-events";
const CACHE_KEY_NIP04_PROFILE = "nip04-profile";

export type NIP04UserProfile = NDKUserProfile & {
  pubkey: string;
  npub: string;
};

export default function useNip14() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<NIP04UserProfile[]>([]);

  const getUserProfilesFromChats = async (): Promise<NIP04UserProfile[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const ndk = getNDK().getInstance();
      const user = ndk.activeUser;

      if (!user) {
        throw new Error("No active user");
      }

      // @ts-expect-error
      const privateKey = getNDK().getInstance().signer?._privateKey;
      const currentUserPublicKey = user.pubkey;
      const currentUserNpub = user.npub;

      // Filter for NIP-17 (Private Direct Messages) events
      let filter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [user.pubkey],
        limit: 10,
      };

      const events = Array.from(await ndk.fetchEvents(filter)) as Event[];

      const profilePromises = events.map(async (rumor) => {
        const npub = nip19.npubEncode(rumor.pubkey);
        const pubKeyObj = { pubkey: rumor.pubkey, npub };
        const profileUser = ndk.getUser(pubKeyObj);

        try {
          const _profile = await profileUser.fetchProfile();
          //   console.log("profile", _profile);
          const profile = _profile ? _profile : pubKeyObj;
          return { ...profile, pubkey: rumor.pubkey };
        } catch (err) {
          console.error("Error fetching profile", err);
          // If profile fetch fails, still include the user with just the pubkey
          return pubKeyObj;
        }
      });

      //   console.log("profilePromises", profilePromises);

      const profileResults = await Promise.allSettled(profilePromises);
      //   const _profiles: NIP04UserProfile[] = profileResults
      const profiles: NIP04UserProfile[] = Array.from(
        profileResults
          .filter(
            (result): result is PromiseFulfilledResult<NIP04UserProfile> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
          // Remove duplicates by creating a Map keyed by npub
          .reduce((unique, profile) => {
            console.log(
              "profile",
              !unique.has(profile.npub) &&
                (profile.pubkey !== currentUserPublicKey ||
                  profile.npub !== currentUserNpub),
              profile.pubkey,
              profile.npub,
              currentUserPublicKey,
              currentUserNpub
            );
            if (
              !unique.has(profile.npub) &&
              (profile.pubkey !== currentUserPublicKey ||
                profile.npub !== currentUserNpub)
            ) {
              unique.set(profile.npub, profile);
            }
            return unique;
          }, new Map<string, NIP04UserProfile>())
          // Convert Map back to array
          .values()
      );

      setUserProfiles(profiles);
      return profiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getUserProfilesFromChats,
    isLoading,
    error,
    userProfiles,
  };
}
