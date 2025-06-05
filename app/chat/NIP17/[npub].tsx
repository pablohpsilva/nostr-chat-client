import { NDKEvent, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { nip19 } from "nostr-tools";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import ChatHeader from "@/components/Chat/ChatHeader";
import EmptyChat from "@/components/Chat/EmptyChat";
import MessageInput from "@/components/Chat/MessageInput";
import MessageList from "@/components/Chat/MessageList";
import { TypographyBodyL } from "@/components/ui/Typography";
import { ROUTES } from "@/constants/routes";
import { ChatRoom } from "@/constants/types";
import useNip17Chat from "@/hooks/useNip17Chat";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";

export default function NIP17ChatPage() {
  const { npub } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useNDKCurrentUser();
  const {
    messages,
    getConversationMessagesWebhook,
    sendMessage,
    isLoading,
    isSendingMessage,
  } = useNip17Chat();
  const { storeChatRoom, loadChatRooms } = useNip17StoreProfile();

  const handleSendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !currentUser) {
      return;
    }

    await sendMessage({ publicKey: `${npub}` }, newMessage);
  };

  const handleBackToList = () => {
    if (router.canGoBack()) {
      return router.back();
    }

    router.replace(ROUTES.CHAT);
  };

  const handleStoreChatRoom = async (chatRoomMap: Map<string, ChatRoom>) => {
    let publicKey = "";

    if ((npub as string).startsWith("npub")) {
      const { data: _publicKey } = nip19.decode(npub as string);
      publicKey = _publicKey as string;
    } else {
      publicKey = npub as string;
    }

    await storeChatRoom(chatRoomMap, { publicKey });
  };

  useEffect(() => {
    loadChatRooms().then((chatRoomMap) => {
      getConversationMessagesWebhook(`${npub}`);
      handleStoreChatRoom(chatRoomMap);
    });
  }, [npub]);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <Fragment>
            <ChatHeader
              userProfile={{ pubkey: `${npub}` }}
              onBackClick={handleBackToList}
            />

            {isLoading ? (
              <View style={styles.centerContainer}>
                <TypographyBodyL style={styles.loadingText}>
                  Loading chats...
                </TypographyBodyL>
              </View>
            ) : messages.length ? (
              <MessageList messages={messages as NDKEvent[]} />
            ) : (
              <EmptyChat />
            )}

            <MessageInput
              onSendMessage={handleSendMessage}
              disable={isLoading || isSendingMessage}
            />
          </Fragment>
        </View>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
});
