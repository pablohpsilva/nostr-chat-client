import { create } from "zustand";

import { DEFAULT_RELAYS } from "@/constants";
import { RelayConfig, RelayDict } from "@/constants/types";
import {
  getStoredData,
  removeStoredData,
  setStoredData,
} from "@/utils/storage";

interface RelayStore {
  // State
  relays: RelayDict;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadRelays: () => Promise<void>;
  saveRelays: (relays: RelayDict) => Promise<void>;
  addRelay: (url: string, config?: RelayConfig) => Promise<boolean>;
  removeRelay: (url: string) => Promise<void>;
  toggleRelay: (url: string, type: "read" | "write") => Promise<void>;
  resetToDefaults: () => Promise<void>;
  // updateNDK: () => void;
  clearError: () => void;
  wipeClean: () => Promise<void>;

  // Computed
  getActiveRelays: () => RelayDict;
  getActiveRelayCount: () => number;
  getTotalRelayCount: () => number;
  getSortedRelays: () => [string, RelayConfig][];
}

const STORAGE_KEY = "nostream-relay-config";

const useRelayStore = create<RelayStore>()((set, get) => ({
  // Initial state
  relays: DEFAULT_RELAYS,
  isLoading: false,
  isSaving: false,
  error: null,

  // Actions
  loadRelays: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedRelays = await getStoredData<RelayDict>(
        STORAGE_KEY,
        DEFAULT_RELAYS
      );
      set({ relays: storedRelays });
      // get().updateNDK();
    } catch (error) {
      console.error("Error loading relays:", error);
      set({ error: "Failed to load relays" });
      // Fallback to defaults if loading fails
      set({ relays: DEFAULT_RELAYS });
    } finally {
      set({ isLoading: false });
    }
  },

  saveRelays: async (relays: RelayDict) => {
    set({ isSaving: true, error: null });
    try {
      await setStoredData(STORAGE_KEY, relays);
      set({ relays });
      // get().updateNDK();
    } catch (error) {
      console.error("Error saving relays:", error);
      set({ error: "Failed to save relays" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  addRelay: async (
    url: string,
    config: RelayConfig = { read: true, write: true }
  ) => {
    const { relays, saveRelays } = get();

    // Validate URL format
    let formattedUrl = url.trim();
    if (
      !formattedUrl.startsWith("ws://") &&
      !formattedUrl.startsWith("wss://")
    ) {
      formattedUrl = `wss://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      set({ error: "Invalid relay URL format" });
      return false;
    }

    if (relays[formattedUrl]) {
      set({ error: "Relay already exists" });
      return false;
    }

    const updatedRelays = {
      ...relays,
      [formattedUrl]: config,
    };

    try {
      await saveRelays(updatedRelays);
      return true;
    } catch {
      return false;
    }
  },

  removeRelay: async (url: string) => {
    const { relays, saveRelays } = get();
    const { [url]: _, ...updatedRelays } = relays;
    await saveRelays(updatedRelays);
  },

  toggleRelay: async (url: string, type: "read" | "write") => {
    const { relays, saveRelays } = get();
    const updatedRelays = {
      ...relays,
      [url]: {
        ...relays[url],
        [type]: !relays[url][type],
      },
    };
    await saveRelays(updatedRelays);
  },

  resetToDefaults: async () => {
    await get().saveRelays(DEFAULT_RELAYS);
  },

  // updateNDK: () => {
  //   const activeRelays = get().getActiveRelays();
  //   debugger;
  //   getNDK().setRelays(activeRelays);
  //   getNDK().getInstance().connect();
  // },

  clearError: () => {
    set({ error: null });
  },

  getSortedRelays: () => {
    const { relays } = get();
    return Object.entries(relays)
      .filter(([_, config]) => config.read || config.write)
      .sort(([a], [b]) => {
        if (a.includes("nostream")) return -1;
        if (b.includes("nostream")) return 1;
        return a.localeCompare(b);
      });
  },

  // Computed values
  getActiveRelays: () => {
    return Object.fromEntries(get().getSortedRelays());
  },

  getActiveRelayCount: () => {
    return Object.keys(get().getActiveRelays()).length;
  },

  getTotalRelayCount: () => {
    return Object.keys(get().relays).length;
  },

  wipeClean: async () => {
    set({ isLoading: true, error: null });
    try {
      await removeStoredData(STORAGE_KEY);
      set({ relays: DEFAULT_RELAYS });
      // get().updateNDK();
    } catch (error) {
      console.error("Error wiping relay data:", error);
      set({ error: "Failed to clear relay data" });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export { useRelayStore };
export type { RelayStore };
