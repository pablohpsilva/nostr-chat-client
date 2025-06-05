import { NDKEvent, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TypographyBodyL } from "@/components/ui/Typography";
import { ROUTES } from "@/constants/routes";
import useNip04Chat from "@/hooks/useNip04Chat";
import MessageInput from "../NIP17/components/MessageInput";
import ChatHeader from "./components/ChatHeader";
import EmptyChat from "./components/EmptyChat";
import MessageList from "./components/MessageList";

export default function NIP17ChatPage() {
  const { npub } = useLocalSearchParams();
  const router = useRouter();
  const currentUser = useNDKCurrentUser();
  const { messages, getConversationMessagesWebhook, sendMessage, isLoading } =
    useNip04Chat();

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

  useEffect(() => {
    getConversationMessagesWebhook(`${npub}`);
  }, [npub]);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.innerContainer}>
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
