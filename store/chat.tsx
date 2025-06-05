import { nip17 } from "nostr-tools";
import { create } from "zustand";

import { removeDuplicateEventsViaId } from "@/hooks/useTag";

type ChatStoreValue = {
  chat: ReturnType<typeof nip17.unwrapEvent>[];
  filterSince?: number;
  filterUntil?: number;
};

export const useChatStore = create<{
  currentChat: string;
  chats: Map<string, ChatStoreValue>;
  addChat: (
    key: string,
    chat:
      | ReturnType<typeof nip17.unwrapEvent>
      | ReturnType<typeof nip17.unwrapEvent>[],
    filterSince?: number,
    filterUntil?: number
  ) => void;
  getChat: (key: string) => ChatStoreValue;
  setCurrentChat: (key: string) => void;
  getCurrentChat: () => ChatStoreValue;
}>((set, get) => ({
  currentChat: "",
  chats: new Map(),
  addChat: (
    key: string,
    chat:
      | ReturnType<typeof nip17.unwrapEvent>
      | ReturnType<typeof nip17.unwrapEvent>[],
    filterSince: number = Math.floor(
      (Date.now() - 360 * 24 * 60 * 60 * 1000) / 1000
    ),
    filterUntil?: number
  ) =>
    set((state) => {
      const _chats = new Map(state.chats);
      const _chatList = Array.isArray(chat) ? chat : [chat];
      const oldChats = _chats.get(key)?.chat || [];
      const chatList = removeDuplicateEventsViaId(
        oldChats.concat(_chatList)
      ).sort((a, b) => a.created_at - b.created_at);

      _chats.set(key, { chat: chatList, filterSince, filterUntil });

      return { ...state, chats: _chats };
    }),
  getChat: (key: string) => {
    if (!get().chats.get(key)) {
      return {
        chat: [],
        filterSince: Math.floor(
          (Date.now() - 360 * 24 * 60 * 60 * 1000) / 1000
        ),
        filterUntil: undefined,
      } as ChatStoreValue;
    }

    return get().chats.get(key)!;
  },
  setCurrentChat: (key: string) =>
    set((state) => ({ ...state, currentChat: key })),
  getCurrentChat: () => {
    if (!get().chats.get(get().currentChat)) {
      return {
        chat: [],
        filterSince: Math.floor(
          (Date.now() - 360 * 24 * 60 * 60 * 1000) / 1000
        ),
        filterUntil: undefined,
      } as ChatStoreValue;
    }

    return get().chats.get(get().currentChat)!;
  },
}));
