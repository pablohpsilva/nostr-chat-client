import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { nip19 } from "nostr-tools";
import { Fragment } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import ChatHeader from "@/components/Chat/ChatHeader";
import EmptyChat from "@/components/Chat/EmptyChat";
import MessageInput from "@/components/Chat/MessageInput";
import MessageList from "@/components/Chat/MessageList";
import { ROUTES } from "@/constants/routes";
import { ChatRoom } from "@/constants/types";
import useNDKWrapper from "@/hooks/useNDKWrapper";
import useNip17Chat from "@/hooks/useNip17ChatNoCache";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";

export default function NIP17ChatPage() {
  const { npub } = useLocalSearchParams();
  const router = useRouter();
  const {
    messages = [],
    getConversationMessagesWebhook,
    sendMessage,
    isLoading,
    isSendingMessage,
    timeRange,
    getHistoricalMessages,
  } = useNip17Chat([npub as string]);
  const { storeChatRoom, loadChatRooms } = useNip17StoreProfile();
  const { ndk } = useNDKWrapper();
  const currentUser = ndk?.activeUser;

  const handleSendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !currentUser) {
      return;
    }

    await sendMessage(newMessage);
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

  // useEffect(() => {
  //   getConversationMessagesWebhook();
  //   // loadChatRooms().then((chatRoomMap) => {
  //   //   getConversationMessagesWebhook();
  //   //   handleStoreChatRoom(chatRoomMap);
  //   // });
  //   // getHistoricalMessages();
  // }, [npub]);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.innerContainer}>
          <ChatHeader
            userProfile={{ pubkey: `${npub}` }}
            onBackClick={handleBackToList}
          />

          {messages.length === 0 && (
            <EmptyChat
              isLoading={isLoading}
              loadPreviousMessages={getHistoricalMessages}
            />
          )}

          {messages.length > 0 && (
            <MessageList
              messages={messages as NDKEvent[]}
              isLoading={isLoading}
              loadPreviousMessages={getHistoricalMessages}
              timeRange={timeRange}
            />
          )}

          <MessageInput
            onSendMessage={handleSendMessage}
            disable={isLoading || isSendingMessage}
          />
        </View>
      </KeyboardAvoidingView>
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
  contentContainer: {
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
