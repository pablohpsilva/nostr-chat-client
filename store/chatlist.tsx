import { create } from "zustand";

import { ChatRoom } from "@/constants/types";

export const useChatListStore = create<{
  chatRooms: Map<string, ChatRoom>;
  setChatRooms: (chatRooms: Map<string, ChatRoom>) => void;
  removeChatRoom: (pubkey: string) => void;
  clearChatRoom: () => void;
}>((set) => ({
  chatRooms: new Map(),
  setChatRooms: (_chatRooms: Map<string, ChatRoom>) =>
    set((state) => {
      const newChatRooms = new Map(state.chatRooms);
      _chatRooms.forEach((chatRoom, pubkey) => {
        newChatRooms.set(pubkey, chatRoom);
      });
      return { ...state, chatRooms: newChatRooms };
    }),
  removeChatRoom: (pubkey: string) =>
    set((state) => {
      const newProfiles = new Map(state.chatRooms);
      newProfiles.delete(pubkey);
      return { ...state, chatRooms: newProfiles };
    }),
  clearChatRoom: () =>
    set((state) => ({
      ...state,
      chatRooms: new Map(),
    })),
}));
