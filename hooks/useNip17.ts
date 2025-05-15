import { NDKFilter, NDKKind, NDKUserProfile } from "@nostr-dev-kit/ndk";
import { useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { Event, nip17, nip19 } from "nostr-tools";

const CACHE_KEY_NIP17_PROFILE_EVENT_IDS = "nip17-profile-events";
const CACHE_KEY_NIP17_PROFILE = "nip17-profile";

export type NIP17UserProfile = NDKUserProfile & {
  pubkey: string;
  npub: string;
};

export default function useNip17() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<NIP17UserProfile[]>([]);
  //   const { getFromCache, saveToCache } = useCache();

  const getUserProfilesFromChats = async (): Promise<NIP17UserProfile[]> => {
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
        kinds: [NDKKind.GiftWrap],
        "#p": [user.pubkey],
        limit: 10,
        // "#e": [
        //   "d57548998f0a86ba0a96401db56b166db8c44b36f0fd58689d593e63ac3e4934",
        // ],
      };
      //   const cachedNip17ProfileEvents = await getFromCache<string[]>(
      //     CACHE_KEY_NIP17_PROFILE_EVENT_IDS
      //   );
      //   const cachedNip17ProfileEventsIds = cachedNip17ProfileEvents?.map(
      //     (event) => event
      //   );

      //   if (cachedNip17ProfileEvents) {
      //     filter = {
      //       ...filter,
      //       "#e": cachedNip17ProfileEventsIds,
      //     };
      //   }

      const events = Array.from(await ndk.fetchEvents(filter)) as Event[];

      //   await saveToCache(CACHE_KEY_NIP17_PROFILE_EVENT_IDS, [
      //     ...(cachedNip17ProfileEventsIds ?? []),
      //     ...events.map((event) => event.id),
      //   ]);

      let unwrappedGifts: ReturnType<typeof nip17.unwrapManyEvents> = [];

      try {
        unwrappedGifts = nip17.unwrapManyEvents(events, privateKey);
      } catch (err) {
        console.error("Error unwrapping gifts", err);
      }

      const profilePromises = unwrappedGifts.map(async (rumor) => {
        const npub = nip19.npubEncode(rumor.pubkey);
        const pubKeyObj = { pubkey: rumor.pubkey, npub };
        const profileUser = ndk.getUser(pubKeyObj);

        try {
          const _profile = await profileUser.fetchProfile();
          const profile = _profile ? _profile : pubKeyObj;
          return { ...profile, pubkey: rumor.pubkey };
        } catch (err) {
          console.error("Error fetching profile", err);
          // If profile fetch fails, still include the user with just the pubkey
          return pubKeyObj;
        }
      });

      const profileResults = await Promise.allSettled(profilePromises);
      //   const _profiles: NIP17UserProfile[] = profileResults
      const profiles: NIP17UserProfile[] = Array.from(
        profileResults
          .filter(
            (result): result is PromiseFulfilledResult<NIP17UserProfile> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value)
          // Remove duplicates by creating a Map keyed by npub
          .reduce((unique, profile) => {
            if (
              !unique.has(profile.npub) &&
              (profile.pubkey !== currentUserPublicKey ||
                profile.npub !== currentUserNpub)
            ) {
              unique.set(profile.npub, profile);
            }
            return unique;
          }, new Map<string, NIP17UserProfile>())
          // Convert Map back to array
          .values()
      );

      //   const profiles =
      //     (await getFromCache<NIP17UserProfile[]>(CACHE_KEY_NIP17_PROFILE)) || [];

      //   await saveToCache(CACHE_KEY_NIP17_PROFILE, [..._profiles, ...profiles]);

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
