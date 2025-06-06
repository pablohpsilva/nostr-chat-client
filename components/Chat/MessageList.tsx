import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "../ui/Button";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: NDKEvent[];
  isLoading?: boolean;
  loadPreviousMessages: () => void;
}

const MessageList = ({
  messages,
  isLoading = false,
  loadPreviousMessages,
}: MessageListProps) => {
  const currentUser = useNDKCurrentUser();
  const scrollViewRef = useRef<ScrollView>(null);
  const lastMessageTimestampRef = useRef<number>(0);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    const latestTimestamp = latestMessage.created_at || 0;
    const isFromCurrentUser = latestMessage.pubkey === currentUser?.pubkey;

    if (
      latestTimestamp > lastMessageTimestampRef.current &&
      isFromCurrentUser
    ) {
      lastMessageTimestampRef.current = latestTimestamp;
      scrollToBottom();
    }
  }, [messages, currentUser?.pubkey]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View>
        <Button
          disabled={isLoading}
          variant="text-primary"
          onPress={loadPreviousMessages}
        >
          {isLoading
            ? "Fetching and decrypting messages..."
            : "Load 10 days of messages"}
        </Button>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        messages.map((message, index) => {
          const isFromMe = message.pubkey === currentUser?.pubkey;

          return (
            <ChatMessage
              key={`${message.id}-${message.created_at}-${index}`}
              isFromMe={isFromMe}
              content={message.content}
              timestamp={message.created_at!}
            />
          );
        })
      )}
      <View style={styles.scrollBuffer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
  },
  scrollBuffer: {
    height: 8,
  },
});

export default MessageList;
