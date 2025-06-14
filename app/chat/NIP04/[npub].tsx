import { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import ChatHeader from "@/components/Chat/ChatHeader";
import EmptyChat from "@/components/Chat/EmptyChat";
import MessageInput from "@/components/Chat/MessageInput";
import MessageList from "@/components/Chat/MessageList";
import { useNDK } from "@/components/Context";
import { TypographyOverline } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";
import useNip04Chat from "@/hooks/useNip04Chat";

export default function NIP17ChatPage() {
  const { npub } = useLocalSearchParams();
  const router = useRouter();
  const { ndk } = useNDK();
  const currentUser = ndk?.activeUser;
  const {
    messages,
    getConversationMessagesWebhook,
    sendMessage,
    getHistoricalMessages,
    isLoading,
    timeRange,
  } = useNip04Chat([npub as string]);

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

  useEffect(() => {
    getConversationMessagesWebhook();
    getHistoricalMessages();
  }, [npub]);

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

          <View style={styles.warningContainer}>
            <TypographyOverline
              lightColor={Colors.dark.white}
              darkColor={Colors.dark.white}
            >
              This chat is unsafe. Use NIP17 chat instead.
            </TypographyOverline>
          </View>
          <MessageInput onSendMessage={handleSendMessage} />
        </View>
      </KeyboardAvoidingView>
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
  warningContainer: {
    padding: 8,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.dark.coral,
  },
});
