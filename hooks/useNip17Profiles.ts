import cloneDeep from "lodash.clonedeep";
import { nip19 } from "nostr-tools";
import { useState } from "react";

import { useProfileStore } from "@/app-store/profiles";
import { getNDK } from "@/components/NDKHeadless";
import { AppUserProfile } from "@/constants/types";
import { removeDuplicatesByKey } from "./useTag";

export default function useNip17Profiles() {
  const [isLoading, setLoading] = useState(false);
  const {
    profiles: profilesMap,
    setProfilesFromArray,
    getChatRoomList,
  } = useProfileStore();

  const loadProfile = async (pubkeys: string[] | nip19.NPub[]) => {
    const ndk = getNDK().getInstance();
    const profiles = (
      await Promise.all(
        removeDuplicatesByKey(pubkeys, "publicKey")
          .filter((pubkey) => !profilesMap.has(pubkey))
          .filter((pubkey) => pubkey !== ndk.activeUser?.pubkey)
          .map(async (pubkey) => {
            const user = ndk.getUser({ pubkey });
            const profile = await user.fetchProfile();
            const defaultProfileValues = {
              pubkey,
              npub: nip19.npubEncode(pubkey),
              nip: "NIP17",
            };

            if (profile) {
              return { ...profile, ...defaultProfileValues };
            }

            return defaultProfileValues;
          })
      )
    ).filter(Boolean) as AppUserProfile[];

    return profiles;
  };

  const handleUpdateProfiles = async (profiles: AppUserProfile[]) => {
    const cloneProfilesMap = cloneDeep(profilesMap);

    profiles.forEach((profile) => {
      cloneProfilesMap.set(profile.pubkey, profile);
    });

    setProfilesFromArray(profiles);

    return cloneProfilesMap;
  };

  const loadAndUpdateProfiles = async (pubkeys: string[] | nip19.NPub[]) => {
    try {
      setLoading(true);
      const profiles = await loadProfile(pubkeys);
      await handleUpdateProfiles(profiles);

      return profiles;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loadProfile,
    handleUpdateProfiles,
    loadAndUpdateProfiles,
    getChatRoomList,
    isLoading,
  };
}
