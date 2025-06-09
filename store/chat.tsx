import { nip17 } from "nostr-tools";
import { create } from "zustand";

import { removeDuplicatesByKey } from "@/hooks/useTag";
import {
  getStoredData,
  removeStoredData,
  setStoredData,
} from "@/utils/storage";

/**
 * Chat Store with automatic 10-day message loading
 *
 * By default, when no specific time range is provided, the store will:
 * - Load messages from 10 days ago until today
 * - Only refetch if the full 10-day range isn't loaded
 * - Refresh data every 5 minutes for real-time updates
 *
 * Usage:
 * ```typescript
 * const { shouldFetchDefaultRange, addMessages, getMissingRanges } = useChatStore();
 *
 * // Check if we need to load the default 10-day range
 * if (shouldFetchDefaultRange(chatKey)) {
 *   // Get only the missing ranges to optimize loading
 *   const missingRanges = getMissingRanges(chatKey);
 *
 *   for (const { since, until } of missingRanges) {
 *     const messages = await fetchMessages(since, until);
 *     addMessages(chatKey, messages);
 *   }
 * }
 * ```
 */

// Helper function to get default time range (today to 10 days ago)
const getDefaultTimeRange = () => {
  const now = Math.floor(Date.now() / 1000);
  const tenDaysAgo = now - 10 * 24 * 60 * 60; // 10 days in seconds
  return {
    since: tenDaysAgo,
    until: now,
  };
};

type ChatMessages = ReturnType<typeof nip17.unwrapEvent>[];

interface ChatData {
  messages: ChatMessages;
  since?: number; // Oldest message timestamp we have loaded
  until?: number; // Newest message timestamp we have loaded
  lastFetched?: number; // When we last fetched messages
}

const CHAT_STORAGE_KEY = "nostream-chat-data";

// Helper function to convert Map to object for storage
const mapToObject = (map: Map<string, ChatData>): Record<string, ChatData> => {
  return Object.fromEntries(map);
};

// Helper function to convert object back to Map
const objectToMap = (
  obj: Record<string, ChatData> | null
): Map<string, ChatData> => {
  if (!obj) return new Map();
  return new Map(Object.entries(obj));
};

interface ChatStore {
  // Storage for multiple chats: chatKey -> chat data
  chats: Map<string, ChatData>;

  // Current active chat
  currentChatKey: string;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  loadChats: () => Promise<void>;
  saveChats: () => Promise<void>;
  setMessages: (chatKey: string, messages: ChatMessages) => void;
  addMessage: (
    chatKey: string,
    message: ReturnType<typeof nip17.unwrapEvent>
  ) => void;
  addMessages: (chatKey: string, messages: ChatMessages) => void;
  getMessages: (chatKey: string) => ChatMessages;
  getChatData: (chatKey: string) => ChatData;
  clearMessages: (chatKey: string) => void;
  setCurrentChat: (chatKey: string) => void;
  getCurrentMessages: () => ChatMessages;
  wipeCleanMessages: () => Promise<void>;
  clearError: () => void;

  // Time range management
  getTimeRange: (chatKey: string) => {
    since?: number;
    until?: number;
    lastFetched: number;
  };
  getDefaultRange: () => { since: number; until: number };
  updateTimeRange: (chatKey: string, since?: number, until?: number) => void;
  shouldFetchRange: (
    chatKey: string,
    requestedSince?: number,
    requestedUntil?: number
  ) => boolean;
  shouldFetchDefaultRange: (chatKey: string) => boolean;
  getMissingRanges: (
    chatKey: string
  ) => Array<{ since: number; until: number }>;
  markFetched: (chatKey: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: new Map(),
  currentChatKey: "",
  isLoading: false,
  isSaving: false,
  error: null,

  // Storage actions
  loadChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedChats = await getStoredData<Record<string, ChatData> | null>(
        CHAT_STORAGE_KEY,
        null
      );
      const chatsMap = objectToMap(storedChats);
      set({ chats: chatsMap });
    } catch (error) {
      console.error("Error loading chats:", error);
      set({ error: "Failed to load chat data" });
    } finally {
      set({ isLoading: false });
    }
  },

  saveChats: async () => {
    set({ isSaving: true, error: null });
    try {
      const { chats } = get();
      const chatsObject = mapToObject(chats);
      await setStoredData(CHAT_STORAGE_KEY, chatsObject);
    } catch (error) {
      console.error("Error saving chats:", error);
      set({ error: "Failed to save chat data" });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setMessages: (chatKey: string, messages: ChatMessages) =>
    set((state) => {
      const newChats = new Map(state.chats);
      const sortedMessages = messages.sort(
        (a, b) => a.created_at - b.created_at
      );

      // Calculate time range from messages
      const since =
        sortedMessages.length > 0 ? sortedMessages[0].created_at : undefined;
      const until =
        sortedMessages.length > 0
          ? sortedMessages[sortedMessages.length - 1].created_at
          : undefined;

      newChats.set(chatKey, {
        messages: sortedMessages,
        since,
        until,
        lastFetched: Math.floor(Date.now() / 1000),
      });

      // Auto-save after updating
      setTimeout(() => get().saveChats(), 0);

      return { ...state, chats: newChats };
    }),

  addMessage: (
    chatKey: string,
    message: ReturnType<typeof nip17.unwrapEvent>
  ) =>
    set((state) => {
      const newChats = new Map(state.chats);
      const existingChatData = newChats.get(chatKey) || { messages: [] };
      const updatedMessages = removeDuplicatesByKey(
        [...existingChatData.messages, message],
        "id"
      );
      const sortedMessages = updatedMessages.sort(
        (a, b) => a.created_at - b.created_at
      );

      // Update time range
      const newSince = Math.min(
        existingChatData.since || message.created_at,
        message.created_at
      );
      const newUntil = Math.max(
        existingChatData.until || message.created_at,
        message.created_at
      );

      newChats.set(chatKey, {
        ...existingChatData,
        messages: sortedMessages,
        since: newSince,
        until: newUntil,
      });

      // Auto-save after updating
      setTimeout(() => get().saveChats(), 0);

      return { ...state, chats: newChats };
    }),

  addMessages: (chatKey: string, messages: ChatMessages) =>
    set((state) => {
      const newChats = new Map(state.chats);
      const existingChatData = newChats.get(chatKey) || { messages: [] };
      const allMessages = [...existingChatData.messages, ...messages];
      const deduplicatedMessages = removeDuplicatesByKey(allMessages, "id");
      const sortedMessages = deduplicatedMessages.sort(
        (a, b) => a.created_at - b.created_at
      );

      // Update time range
      let newSince = existingChatData.since;
      let newUntil = existingChatData.until;

      if (sortedMessages.length > 0) {
        newSince = newSince
          ? Math.min(newSince, sortedMessages[0].created_at)
          : sortedMessages[0].created_at;
        newUntil = newUntil
          ? Math.max(
              newUntil,
              sortedMessages[sortedMessages.length - 1].created_at
            )
          : sortedMessages[sortedMessages.length - 1].created_at;
      }

      newChats.set(chatKey, {
        ...existingChatData,
        messages: sortedMessages,
        since: newSince,
        until: newUntil,
      });

      // Auto-save after updating
      setTimeout(() => get().saveChats(), 0);

      return { ...state, chats: newChats };
    }),

  getMessages: (chatKey: string) => {
    const messages = get().chats.get(chatKey)?.messages || [];
    return messages;
  },

  getChatData: (chatKey: string) => {
    return get().chats.get(chatKey) || { messages: [] };
  },

  clearMessages: (chatKey: string) =>
    set((state) => {
      const newChats = new Map(state.chats);
      newChats.set(chatKey, { messages: [] });

      // Auto-save after updating
      setTimeout(() => get().saveChats(), 0);

      return { chats: newChats };
    }),

  wipeCleanMessages: async () => {
    set({ isLoading: true, error: null });
    try {
      await removeStoredData(CHAT_STORAGE_KEY);
      set({ chats: new Map(), currentChatKey: "" });
    } catch (error) {
      console.error("Error wiping chat data:", error);
      set({ error: "Failed to clear chat data" });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentChat: (chatKey: string) => set({ currentChatKey: chatKey }),

  getCurrentMessages: () => {
    const { chats, currentChatKey } = get();
    return chats.get(currentChatKey)?.messages || [];
  },

  // Time range management
  getTimeRange: (chatKey: string) => {
    const { chats } = get();
    const chatData = chats.get(chatKey);
    return {
      since: chatData?.since,
      until: chatData?.until ?? Math.floor(Date.now() / 1000),
      lastFetched: chatData?.lastFetched ?? Math.floor(Date.now() / 1000),
    };
  },

  getDefaultRange: () => getDefaultTimeRange(),

  updateTimeRange: (chatKey: string, since?: number, until?: number) =>
    set((state) => {
      const newChats = new Map(state.chats);
      const existingChatData = newChats.get(chatKey) || { messages: [] };

      newChats.set(chatKey, {
        ...existingChatData,
        since: since !== undefined ? since : existingChatData.since,
        until: until !== undefined ? until : existingChatData.until,
      });
      return { chats: newChats };
    }),

  shouldFetchRange: (
    chatKey: string,
    requestedSince?: number,
    requestedUntil?: number
  ) => {
    const chatData = get().getChatData(chatKey);

    // If no chat data exists, we should fetch
    if (!chatData || chatData.messages.length === 0) {
      return true;
    }

    // If no specific range requested, use default range (10 days)
    if (!requestedSince && !requestedUntil) {
      const defaultRange = getDefaultTimeRange();

      // Check if we have the full default range
      const hasFullDefaultRange =
        chatData.since &&
        chatData.until &&
        chatData.since <= defaultRange.since &&
        chatData.until >= defaultRange.until;

      if (!hasFullDefaultRange) {
        return true; // Need to fetch default range
      }

      // If we have the full range, check if we should refresh (5 minutes)
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      return !chatData.lastFetched || chatData.lastFetched < fiveMinutesAgo;
    }

    // Check if requested range is outside our loaded range
    if (requestedSince && chatData.since && requestedSince < chatData.since) {
      return true; // Need older messages
    }

    if (requestedUntil && chatData.until && requestedUntil > chatData.until) {
      return true; // Need newer messages
    }

    return false; // We have the requested range
  },

  shouldFetchDefaultRange: (chatKey: string) => {
    const { shouldFetchRange } = get();
    return shouldFetchRange(chatKey); // Uses default range when no params provided
  },

  getMissingRanges: (chatKey: string) => {
    const { chats } = get();
    const chatData = chats.get(chatKey);
    const defaultRange = getDefaultTimeRange();

    // If no data exists, return the full default range
    if (!chatData || chatData.messages.length === 0) {
      return [defaultRange];
    }

    const ranges: Array<{ since: number; until: number }> = [];

    // Always fetch 10 days before the oldest message we have
    const tenDaysBeforeOldest = chatData.since
      ? chatData.since - 10 * 24 * 60 * 60 // 10 days in seconds
      : defaultRange.since;

    ranges.push({
      since: tenDaysBeforeOldest,
      until: chatData.since ? chatData.since - 1 : defaultRange.until,
    });

    // Check if we need newer messages (after our newest)
    if (!chatData.until || chatData.until < defaultRange.until) {
      ranges.push({
        since: chatData.until ? chatData.until + 1 : defaultRange.since,
        until: defaultRange.until,
      });
    }

    return ranges;
  },

  markFetched: (chatKey: string) =>
    set((state) => {
      const newChats = new Map(state.chats);
      const existingChatData = newChats.get(chatKey);

      if (existingChatData) {
        newChats.set(chatKey, {
          ...existingChatData,
          lastFetched: Math.floor(Date.now() / 1000),
        });
      }

      return { chats: newChats };
    }),
}));
