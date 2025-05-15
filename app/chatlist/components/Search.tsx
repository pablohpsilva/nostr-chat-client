import { Ionicons } from "@expo/vector-icons";
import { Fragment, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// import { useSearch } from "@/hooks/useSearch";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";

import SearchStartChat from "./SearchStartChat";

// const formatPubkey = (pubkey: string) => {
//   return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
// };

/**
 * Format and highlight search terms in content
 */
export const formatHighlightedContent = (
  content: string,
  searchQuery: string,
  threshold: number = 45
) => {
  if (!content) {
    return <Text></Text>;
  }

  const searchIndex = content.toLowerCase().indexOf(searchQuery.toLowerCase());

  // If content is too long, create a trimmed version that includes the search term
  let formattedContent = content;
  if (content.length > threshold) {
    // If search term is found, center the trimmed content around it
    if (searchIndex >= 0) {
      const startPos = Math.max(0, searchIndex - 15);
      const endPos = Math.min(
        content.length,
        searchIndex + searchQuery.length + 15
      );
      formattedContent =
        (startPos > 0 ? "..." : "") +
        content.substring(startPos, endPos) +
        (endPos < content.length ? "..." : "");
    } else {
      // If search term not found, just take first 42 chars
      formattedContent = content.substring(0, 42) + "...";
    }
  }

  // Highlight the search term
  const parts = formattedContent.split(new RegExp(`(${searchQuery})`, "gi"));

  return (
    <Text>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <Text key={i} style={styles.highlightedText}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

/**
 * Format a user identifier (npub or pubkey) for display
 */
export const formatUserIdentifier = (user: NDKUserProfile): string => {
  if (typeof user.npub === "string") {
    return `${user.npub.substring(0, 8)}...${user.npub.substring(
      user.npub.length - 4
    )}`;
  } else if (typeof user.pubkey === "string") {
    return `npub...${user.pubkey.substring(user.pubkey.length - 6)}`;
  }
  return "Unknown ID";
};

export default function Search() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const { search, decryptedDirectMessages, users } = useSearch();

  const handleInputPress = () => {
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    setSearchQuery("");
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // // TODO: Implement nostr search logic here
    // console.log("Searching on nostr for:", query);
    // await search(query);
  };

  return (
    <Fragment>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchInputWrapper}
          onPress={handleInputPress}
          activeOpacity={0.7}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            editable={false}
            pointerEvents="none"
          />
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={18} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOverlayOpen}
        animationType="slide"
        onRequestClose={handleCloseOverlay}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top"]}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={handleCloseOverlay}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search on nostr..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          <ScrollView
            style={styles.searchResults}
            contentContainerStyle={styles.searchResultsContent}
          >
            {searchQuery &&
              searchQuery.startsWith("npub") &&
              searchQuery.length === 63 && (
                <SearchStartChat npub={searchQuery} />
              )}

            {/* Commented out search results code would be converted here */}

            {searchQuery ? (
              <Text style={styles.noResultsText}>
                No results found for "{searchQuery}"
              </Text>
            ) : (
              <Text style={styles.noResultsText}>Type to search on nostr</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  safeArea: {
    backgroundColor: "white",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    width: "80%",
  },
  searchInputWrapper: {
    position: "relative",
  },
  searchInput: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  searchIconContainer: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    marginRight: 16,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    padding: 16,
  },
  highlightedText: {
    fontWeight: "bold",
    color: "#000",
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 32,
    color: "#666",
  },
});
