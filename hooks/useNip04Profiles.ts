import { NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { Event, nip19 } from "nostr-tools";
import { useState } from "react";

import { useProfileStore } from "@/app-store/profiles";
import { getNDK } from "@/components/NDKHeadless";
import { AppUserProfile } from "@/constants/types";
import { removeDuplicatesByKey } from "./useTag";

export default function useNip14Profiles() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setProfilesFromArray, getChatRoomList } = useProfileStore();

  const getUserProfilesFromChats = async (): Promise<AppUserProfile[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const ndk = getNDK().getInstance();
      const user = ndk.activeUser;

      if (!user) {
        throw new Error("No active user");
      }

      const currentUserPublicKey = user.pubkey;
      const currentUserNpub = user.npub;

      // Filter for NIP-04 (Private Direct Messages) events
      let filter: NDKFilter = {
        kinds: [NDKKind.EncryptedDirectMessage],
        "#p": [user.pubkey],
      };

      const _events = Array.from(await ndk.fetchEvents(filter)) as Event[];
      const events = removeDuplicatesByKey(
        _events.filter((event) => event.pubkey !== currentUserPublicKey),
        "pubkey"
      );

      const profilePromises = events.map(async (rumor) => {
        const npub = nip19.npubEncode(rumor.pubkey);
        const pubKeyObj = { pubkey: rumor.pubkey, npub };
        const profileUser = ndk.getUser(pubKeyObj);

        try {
          const _profile = await profileUser.fetchProfile();
          const profile = _profile ? _profile : pubKeyObj;
          return { ...profile, npub, pubkey: rumor.pubkey, nip: "NIP04" };
        } catch (err) {
          console.error("Error fetching profile", err);
          // If profile fetch fails, still include the user with just the pubkey
          return pubKeyObj;
        }
      });

      const profileResults = await Promise.allSettled(profilePromises);
      //   const _profiles: NIP04UserProfile[] = profileResults
      const profiles: AppUserProfile[] = Array.from(
        profileResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value as AppUserProfile)
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
          }, new Map<string, AppUserProfile>())
          // Convert Map back to array
          .values()
      );

      console.log("profiles", profiles);

      setProfilesFromArray(profiles);

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
    profiles: getChatRoomList().nip04,
    getUserProfilesFromChats,
    isLoading,
    error,
    userProfiles: [],
  };
}
