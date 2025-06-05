import { create } from "zustand";

import { AppUserProfile } from "@/constants/types";

export const useProfileStore = create<{
  profiles: Map<string, AppUserProfile>;
  setProfiles: (profiles: Map<string, AppUserProfile>) => void;
  setProfilesFromArray: (profiles: AppUserProfile[]) => void;
  addProfile: (profile: AppUserProfile) => void;
  removeProfile: (pubkey: string) => void;
  clearProfiles: () => void;
  getChatRoomList: () => {
    nip04: AppUserProfile[];
    nip17: AppUserProfile[];
  };
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
  setProfiles: (profiles: Map<string, AppUserProfile>) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      profiles.forEach((profile, pubkey) => {
        newProfiles.set(pubkey, profile);
      });
      return { ...state, profiles: newProfiles };
    }),
  setProfilesFromArray: (profiles: AppUserProfile[]) =>
    set((state) => {
      const _profiles = new Map(state.profiles);

      profiles.forEach((profile) => {
        _profiles.set(profile.pubkey, profile);
      });

      return { ...state, profiles: _profiles };
    }),
  addProfile: (profile: AppUserProfile) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.set(profile.pubkey, profile);
      return { ...state, profiles: newProfiles };
    }),
  removeProfile: (pubkey: string) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.delete(pubkey);
      return { ...state, profiles: newProfiles };
    }),
  clearProfiles: () =>
    set((state) => ({
      ...state,
      profiles: new Map(),
    })),
}));
