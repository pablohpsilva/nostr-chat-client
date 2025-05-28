import { Ionicons } from "@expo/vector-icons";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Fragment } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContextMenu from "react-native-context-menu-view";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileListItem from "@/components/ui/ProfileListItem";
import { Colors } from "@/constants/Colors";
import { NIP17UserProfile } from "@/hooks/useNip17";
import Search from "./Search";

interface ListProps {
  loading: boolean;
  error: string | null;
  nip04UserProfiles: NIP17UserProfile[];
  nip17UserProfiles: NIP17UserProfile[];
  onChatClick: (kind: `NIP${NDKKind}`, pubkey: string) => void;
  handleOnClickLogout: () => void;
}

export default function List({
  loading,
  error,
  nip04UserProfiles,
  nip17UserProfiles,
  handleOnClickLogout,
}: ListProps) {
  const hasPrivateChats = Object.keys(nip17UserProfiles).length > 0;
  const hasPublicChats = Object.keys(nip04UserProfiles).length > 0;
  const hasConversations = hasPrivateChats || hasPublicChats;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleOnClickLogout}
          >
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={Colors.dark.white}
            />
          </TouchableOpacity>

          <Search />

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => alert("Soon... :)")}
          >
            <Ionicons name="add-outline" size={24} color={Colors.dark.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ContextMenu
        actions={[{ title: "Title 1" }, { title: "Title 2" }]}
        onPress={(e) => {
          console.warn(
            `Pressed ${e.nativeEvent.name} at index ${e.nativeEvent.index}`
          );
        }}
      >
        <View style={styles.container} />
      </ContextMenu>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error loading chats</Text>
          </View>
        ) : !hasConversations ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        ) : (
          <Fragment>
            {hasPrivateChats && (
              <Fragment>
                {Object.values(nip17UserProfiles).map(
                  (
                    { npub, pubkey, displayName, picture, created_at },
                    index
                  ) => (
                    <ProfileListItem
                      key={`${pubkey}-${npub}-${index}`}
                      {...{
                        npub,
                        displayName,
                        picture,
                        tag: "NIP17",
                      }}
                    />
                  )
                )}
              </Fragment>
            )}

            {hasPublicChats && (
              <Fragment>
                {Object.values(nip04UserProfiles).map(
                  (
                    { npub, displayName, picture, image, created_at },
                    index
                  ) => (
                    <ProfileListItem
                      key={`${npub}-${npub}-${index}`}
                      {...{
                        npub,
                        displayName,
                        picture,
                        tag: `NIP${NDKKind.EncryptedDirectMessage}`,
                      }}
                    />
                  )
                )}
              </Fragment>
            )}
          </Fragment>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  headerContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
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
  errorText: {
    color: "red",
    fontWeight: "500",
  },
  emptyText: {
    color: "#666",
  },
});
