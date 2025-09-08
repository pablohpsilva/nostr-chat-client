import { NDKEvent } from "@nostr-dev-kit/ndk";
import dayjs from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ChatMessage from "@/components/Chat/ChatMessage";
import { Button } from "@/components/ui/Button";
import { TimeRange } from "@/store/chat";
import { useNDK } from "../Context";

interface VirtualizedMessageListProps {
  messages: NDKEvent[];
  isLoading?: boolean;
  loadPreviousMessages: () => void;
  timeRange: TimeRange;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

interface MessageItem {
  id: string;
  message: NDKEvent;
  isFromMe: boolean;
}

const ITEM_HEIGHT = 100; // Approximate height of each message
const WINDOW_SIZE = 10; // Number of items to render outside visible area
const INITIAL_NUM_TO_RENDER = 20; // Initial items to render

const VirtualizedMessageList = React.memo(
  ({
    messages,
    isLoading = false,
    loadPreviousMessages,
    timeRange,
    onScroll,
  }: VirtualizedMessageListProps) => {
    const { ndk } = useNDK();
    const currentUser = ndk?.activeUser;
    const flatListRef = useRef<FlatList<MessageItem>>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    // Memoize currentUser pubkey to prevent unnecessary re-renders
    const currentUserPubkey = useMemo(
      () => currentUser?.pubkey,
      [currentUser?.pubkey]
    );

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

    // Transform messages into the format needed for FlatList
    const messageItems = useMemo<MessageItem[]>(() => {
      return messages.map((message) => ({
        id: message.id || `${message.created_at}-${message.pubkey}`,
        message,
        isFromMe: message.pubkey === currentUserPubkey,
      }));
    }, [messages, currentUserPubkey]);

    // Render individual message item
    const renderMessage: ListRenderItem<MessageItem> = useCallback(
      ({ item }) => (
        <ChatMessage
          isFromMe={item.isFromMe}
          content={item.message.content}
          timestamp={item.message.created_at!}
        />
      ),
      []
    );

    // Header component for load more button
    const renderHeader = useCallback(
      () => (
        <View style={styles.headerContainer}>
          <Button
            disabled={isLoading}
            variant="text-primary"
            onPress={loadPreviousMessages}
          >
            {loadMoreText}
          </Button>
        </View>
      ),
      [isLoading, loadPreviousMessages, loadMoreText]
    );

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ),
      []
    );

    // Footer component for spacing
    const renderFooter = useCallback(
      () => <View style={styles.footerSpacing} />,
      []
    );

    // Get item layout for better performance
    const getItemLayout = useCallback(
      (data: MessageItem[] | null | undefined, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      []
    );

    // Key extractor
    const keyExtractor = useCallback((item: MessageItem) => item.id, []);

    // Handle scroll events
    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } =
          event.nativeEvent;
        const isNearBottomThreshold = 100; // pixels from bottom

        const distanceFromBottom =
          contentSize.height - contentOffset.y - layoutMeasurement.height;

        setIsNearBottom(distanceFromBottom < isNearBottomThreshold);

        onScroll?.(event);
      },
      [onScroll]
    );

    // Auto-scroll to bottom for new messages
    const scrollToBottom = useCallback(() => {
      if (messageItems.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, [messageItems.length]);

    // Effect to auto-scroll when new messages arrive
    useEffect(() => {
      if (isNearBottom && messageItems.length > 0) {
        // Small delay to ensure content is rendered
        const timeout = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timeout);
      }
    }, [messageItems.length, isNearBottom, scrollToBottom]);

    return (
      <FlatList
        ref={flatListRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        data={messageItems}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // Performance optimizations
        windowSize={WINDOW_SIZE}
        initialNumToRender={INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        // Memory optimizations
        disableVirtualization={false}
        legacyImplementation={false}
        // Scroll behavior
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        // Accessibility
        accessible={true}
        accessibilityLabel="Message list"
      />
    );
  }
);

VirtualizedMessageList.displayName = "VirtualizedMessageList";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    minHeight: Dimensions.get("window").height * 0.6,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 16,
  },
  footerSpacing: {
    height: 20,
  },
});

export default VirtualizedMessageList;
