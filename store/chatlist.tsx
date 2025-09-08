import { create } from "zustand";

import { NOSTR_STORAGE_KEYS } from "@/constants/nostr";
import { ChatRoom } from "@/constants/types";
import {
  getStoredData,
  removeStoredData,
  setStoredData,
} from "@/utils/storage";

const CHATLIST_STORAGE_KEY = NOSTR_STORAGE_KEYS.CHATLIST_DATA;

// Helper function to convert Map to object for storage
const mapToObject = (map: Map<string, ChatRoom>): Record<string, ChatRoom> => {
  return Object.fromEntries(map);
};

// Helper function to convert object back to Map
const objectToMap = (
  obj: Record<string, ChatRoom> | null
): Map<string, ChatRoom> => {
  if (!obj) return new Map();
  return new Map(Object.entries(obj));
};

export const useChatListStore = create<{
  chatRooms: Map<string, ChatRoom>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Storage actions
  loadChatRooms: () => Promise<void>;
  saveChatRooms: () => Promise<void>;
  clearError: () => void;

  // Existing actions
  setChatRooms: (chatRooms: Map<string, ChatRoom>) => void;
  removeChatRoom: (pubkey: string) => void;
  clearChatRoom: () => void;
  wipeCleanChatRooms: () => Promise<void>;
}>((set, get) => ({
  chatRooms: new Map(),
  isLoading: false,
  isSaving: false,
  error: null,

  // Storage actions
  loadChatRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedChatRooms = await getStoredData<Record<
        string,
        ChatRoom
      > | null>(CHATLIST_STORAGE_KEY, null);
      const chatRoomsMap = objectToMap(storedChatRooms);
      set({ chatRooms: chatRoomsMap });
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      set({ error: "Failed to load chat rooms" });
    } finally {
      set({ isLoading: false });
    }
  },

  saveChatRooms: async () => {
    set({ isSaving: true, error: null });
    try {
      const { chatRooms } = get();
      const chatRoomsObject = mapToObject(chatRooms);
      await setStoredData(CHATLIST_STORAGE_KEY, chatRoomsObject);
    } catch (error) {
      console.error("Error saving chat rooms:", error);
      set({ error: "Failed to save chat rooms" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setChatRooms: (_chatRooms: Map<string, ChatRoom>) =>
    set((state) => {
      const newChatRooms = new Map(state.chatRooms);
      _chatRooms.forEach((chatRoom, pubkey) => {
        newChatRooms.set(pubkey, chatRoom);
      });

      // Auto-save after updating
      setTimeout(() => get().saveChatRooms(), 0);

      return { ...state, chatRooms: newChatRooms };
    }),

  removeChatRoom: (pubkey: string) =>
    set((state) => {
      const newProfiles = new Map(state.chatRooms);
      newProfiles.delete(pubkey);

      // Auto-save after updating
      setTimeout(() => get().saveChatRooms(), 0);

      return { ...state, chatRooms: newProfiles };
    }),

  clearChatRoom: () =>
    set((state) => {
      // Auto-save after updating
      setTimeout(() => get().saveChatRooms(), 0);

      return {
        ...state,
        chatRooms: new Map(),
      };
    }),

  wipeCleanChatRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      await removeStoredData(CHATLIST_STORAGE_KEY);
      set({ chatRooms: new Map() });
    } catch (error) {
      console.error("Error wiping chat rooms:", error);
      set({ error: "Failed to clear chat rooms" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
