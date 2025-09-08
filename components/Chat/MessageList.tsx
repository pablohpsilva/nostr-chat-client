import { NDKEvent } from "@nostr-dev-kit/ndk";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ChatMessage from "@/components/Chat/ChatMessage";
import VirtualizedMessageList from "@/components/Chat/VirtualizedMessageList";
import { Button } from "@/components/ui/Button";
import { NOSTR_LIMITS } from "@/constants/nostr";
import { TimeRange } from "@/store/chat";
import { useNDK } from "../Context";

interface MessageListProps {
  messages: NDKEvent[];
  isLoading?: boolean;
  loadPreviousMessages: () => void;
  timeRange: TimeRange;
}

const MessageList = React.memo(
  ({
    messages,
    isLoading = false,
    loadPreviousMessages,
    timeRange,
  }: MessageListProps) => {
    const { ndk } = useNDK();
    const currentUser = ndk?.activeUser;
    const scrollViewRef = useRef<ScrollView>(null);
    const lastMessageTimestampRef = useRef<number>(0);

    // Memoize the load more text to prevent unnecessary re-renders
    const loadMoreText = useMemo(
      () =>
        isLoading
          ? "Fetching and decrypting messages..."
          : timeRange?.since
          ? `Loaded since ${dayjs(timeRange.since * 1000).format(
              "YYYY-MM-DD"
            )}. Tap to load more.`
          : "Tap to load messages",
      [isLoading, timeRange?.since]
    );

    // Memoize scroll function to prevent re-creation
    const scrollToBottom = useCallback(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, []);

    // Memoize currentUser pubkey to prevent unnecessary re-renders
    const currentUserPubkey = useMemo(
      () => currentUser?.pubkey,
      [currentUser?.pubkey]
    );

    useEffect(() => {
      if (messages.length === 0) {
        return;
      }

      const latestMessage = messages[messages.length - 1];
      const latestTimestamp = latestMessage.created_at || 0;

      if (latestTimestamp > lastMessageTimestampRef.current) {
        lastMessageTimestampRef.current = latestTimestamp;
        scrollToBottom();
      }
    }, [messages, scrollToBottom]);

    // Use virtualized list for large message counts
    const shouldUseVirtualization =
      messages.length > NOSTR_LIMITS.MESSAGE_PER_PAGE;

    if (shouldUseVirtualization) {
      return (
        <VirtualizedMessageList
          messages={messages}
          isLoading={isLoading}
          loadPreviousMessages={loadPreviousMessages}
          timeRange={timeRange}
        />
      );
    }

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
            {loadMoreText}
          </Button>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id || `${message.created_at}-${message.pubkey}`}
              isFromMe={message.pubkey === currentUserPubkey}
              content={message.content}
              timestamp={message.created_at!}
            />
          ))
        )}
        <View style={styles.scrollBuffer} />
      </ScrollView>
    );
  }
);

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
