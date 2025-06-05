import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ChatMessage from "../../NIP17/components/ChatMessage";

interface MessageListProps {
  messages: NDKEvent[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const currentUser = useNDKCurrentUser();
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
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
    gap: 16,
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
