import { NDKEvent, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import useNip17Chat from "@/hooks/useNip17Chat";
import useNip17StoreProfile, { ChatRoom } from "@/hooks/useNip17StoreProfile";
import { nip19 } from "nostr-tools";
import ChatHeader from "./components/ChatHeader";
import EmptyChat from "./components/EmptyChat";
import MessageInput from "./components/MessageInput";
import MessageList from "./components/MessageList";

export default function NIP17ChatPage() {
  const { npub } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useNDKCurrentUser();
  const { messages, getConversationMessagesWebhook, sendMessage } =
    useNip17Chat();
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
    // getConversationMessagesWebhook(`${npub}`);
    // getConversationMessagesWebhook(`${npub}`).then(() => {
    //   console.log("getConversationMessagesWebhook");
    //   handleStoreChatRoom();
    // });
    loadChatRooms().then((chatRoomMap) => {
      getConversationMessagesWebhook(`${npub}`);
      console.log("chatRoomMap", chatRoomMap);
      handleStoreChatRoom(chatRoomMap);
    });
  }, [npub]);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.innerContainer}>
          <ChatHeader
            userProfile={{ pubkey: `${npub}` }}
            onBackClick={handleBackToList}
          />

          {messages.length ? (
            <MessageList messages={messages as NDKEvent[]} />
          ) : (
            <EmptyChat />
          )}

          <SafeAreaView style={styles.header} edges={["bottom"]}>
            <MessageInput onSendMessage={handleSendMessage} />
          </SafeAreaView>
        </View>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  header: {},
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});
