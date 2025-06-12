import { create } from "zustand";

import { AppUserProfile } from "@/constants/types";
import { getStoredData, setStoredData } from "@/utils/storage";

const PROFILES_STORAGE_KEY = "nostream-profiles-data";

// Helper functions for converting between Map and Array for storage
const mapToArray = (map: Map<string, AppUserProfile>): AppUserProfile[] => {
  return Array.from(map.values());
};

const arrayToMap = (array: AppUserProfile[]): Map<string, AppUserProfile> => {
  const map = new Map<string, AppUserProfile>();
  array.forEach((profile) => {
    map.set(profile.pubkey, profile);
  });
  return map;
};

// Load profiles from storage
const loadProfiles = async (): Promise<Map<string, AppUserProfile>> => {
  try {
    const storedProfiles = await getStoredData<AppUserProfile[]>(
      PROFILES_STORAGE_KEY,
      []
    );
    return arrayToMap(storedProfiles);
  } catch (error) {
    console.warn("Failed to load profiles from storage:", error);
    return new Map();
  }
};

const mapToObject = (
  map: Map<string, AppUserProfile>
): Record<string, AppUserProfile> => {
  return Object.fromEntries(map);
};

// Save profiles to storage
const saveProfiles = async (
  profiles: Map<string, AppUserProfile>
): Promise<void> => {
  try {
    // const profilesArray = mapToArray(profiles);
    const profilesObject = mapToObject(profiles);
    await setStoredData(PROFILES_STORAGE_KEY, profilesObject);
  } catch (error) {
    console.warn("Failed to save profiles to storage:", error);
  }
};

export const useProfileStore = create<{
  profiles: Map<string, AppUserProfile>;
  setProfiles: (profiles: Map<string, AppUserProfile>) => void;
  setProfilesFromArray: (profiles: AppUserProfile[]) => void;
  addProfile: (profile: AppUserProfile) => void;
  removeProfile: (pubkey: string) => void;
  wipeCleanProfiles: () => void;
  getChatRoomList: () => {
    nip04: AppUserProfile[];
    nip17: AppUserProfile[];
  };
  loadProfilesFromStorage: () => Promise<void>;
}>((set, get) => ({
  profiles: new Map(),
  getChatRoomList: () => {
    return Array.from(get().profiles.values()).reduce(
      (acc, curr) => {
        const { nip04, nip17 } = acc;
        if (curr.nip === "NIP04") {
          nip04.push(curr);
        } else {
          nip17.push(curr);
        }
        return acc;
      },
      { nip04: [] as AppUserProfile[], nip17: [] as AppUserProfile[] }
    );
  },
  loadProfilesFromStorage: async () => {
    const profiles = await loadProfiles();
    set((state) => ({ ...state, profiles }));
  },
  setProfiles: (profiles: Map<string, AppUserProfile>) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      profiles.forEach((profile, pubkey) => {
        newProfiles.set(pubkey, profile);
      });
      saveProfiles(newProfiles); // Persist to storage
      return { ...state, profiles: newProfiles };
    }),
  setProfilesFromArray: (profiles: AppUserProfile[]) =>
    set((state) => {
      const _profiles = new Map(state.profiles);

      profiles.forEach((profile) => {
        _profiles.set(profile.pubkey, profile);
      });

      saveProfiles(_profiles); // Persist to storage
      return { ...state, profiles: _profiles };
    }),
  addProfile: (profile: AppUserProfile) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.set(profile.pubkey, profile);
      saveProfiles(newProfiles); // Persist to storage
      return { ...state, profiles: newProfiles };
    }),
  removeProfile: (pubkey: string) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.delete(pubkey);
      saveProfiles(newProfiles); // Persist to storage
      return { ...state, profiles: newProfiles };
    }),
  wipeCleanProfiles: () =>
    set((state) => {
      const newProfiles = new Map();
      saveProfiles(newProfiles); // Persist to storage
      return { ...state, profiles: newProfiles };
    }),
}));

// Initialize profiles from storage when the store is created
useProfileStore.getState().loadProfilesFromStorage();
