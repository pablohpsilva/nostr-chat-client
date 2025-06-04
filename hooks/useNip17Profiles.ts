import cloneDeep from "lodash.clonedeep";
import { nip19 } from "nostr-tools";
import { useMemo, useState } from "react";

import { getNDK } from "@/components/NDKHeadless";
import { NIP17UserProfile } from "@/constants/types";
import useTag from "./useTag";

export default function useNip17Profiles() {
  const [isLoading, setLoading] = useState(false);
  const [profilesMap, setProfilesMap] = useState<Map<string, NIP17UserProfile>>(
    new Map()
  );
  const { removeDuplicates } = useTag();
  const profiles = useMemo(
    () => Array.from(profilesMap.values()),
    [profilesMap.values()]
  );

  const loadProfile = async (pubkeys: string[] | nip19.NPub[]) => {
    const ndk = getNDK().getInstance();
    const profiles = (
      await Promise.all(
        removeDuplicates(pubkeys)
          .filter((pubkey) => !profilesMap.has(pubkey))
          .filter((pubkey) => pubkey !== ndk.activeUser?.pubkey)
          .map(async (pubkey) => {
            const user = ndk.getUser({ pubkey });
            const profile = await user.fetchProfile();
            const defaultProfileValues = {
              pubkey,
              npub: nip19.npubEncode(pubkey),
            };

            if (profile) {
              return { ...profile, ...defaultProfileValues };
            }

            return defaultProfileValues;
          })
      )
    ).filter(Boolean) as NIP17UserProfile[];

    return profiles;
  };

  const handleUpdateProfiles = async (profiles: NIP17UserProfile[]) => {
    const cloneProfilesMap = cloneDeep(profilesMap);

    profiles.forEach((profile) => {
      cloneProfilesMap.set(profile.pubkey, profile);
    });

    setProfilesMap(cloneProfilesMap);

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

  console.log("useNip17Profiles", isLoading);

  return {
    loadProfile,
    handleUpdateProfiles,
    loadAndUpdateProfiles,
    profiles,
    isLoading,
  };
}
