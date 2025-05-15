import { Ionicons } from "@expo/vector-icons";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { Fragment } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fillRoute, ROUTES } from "@/constants/routes";
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

  const formatPublicKey = (value: string) => {
    return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleOnClickLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>

          <Search />
        </View>
      </SafeAreaView>

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
                    { npub, pubkey, displayName, picture, image, created_at },
                    index
                  ) => (
                    <Link
                      key={`${pubkey}-${npub}-${index}`}
                      href={fillRoute(ROUTES.CHAT_ID, {
                        nip: "NIP17",
                        npub: `${npub}`,
                      })}
                      asChild
                    >
                      <TouchableOpacity style={styles.chatItem}>
                        <View style={styles.chatItemContent}>
                          <Image
                            source={{ uri: image || picture }}
                            style={styles.avatar}
                            // defaultSource={require("@/assets/default-avatar.png")}
                          />

                          <View style={styles.chatInfo}>
                            <Text style={styles.chatName}>
                              {displayName || formatPublicKey(`${npub}`)}
                            </Text>
                            {created_at && (
                              <Text style={styles.chatDate}>
                                Created at:{" "}
                                {new Date(created_at * 1000).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.nipContainer}>
                          <Text style={styles.nipTag}>NIP17</Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={24}
                            color="#666"
                          />
                        </View>
                      </TouchableOpacity>
                    </Link>
                  )
                )}
              </Fragment>
            )}

            {hasPublicChats && (
              <Fragment>
                {Object.values(nip04UserProfiles).map(
                  ({ npub, displayName, picture, image, created_at }) => (
                    <Link
                      key={npub}
                      href={fillRoute(ROUTES.CHAT_ID, {
                        nip: `NIP${NDKKind.EncryptedDirectMessage}`,
                        npub: `${npub}`,
                      })}
                      asChild
                    >
                      <TouchableOpacity style={styles.chatItem}>
                        <View style={styles.chatItemContent}>
                          <Image
                            source={{ uri: image || picture }}
                            style={styles.avatar}
                            // defaultSource={require("@/assets/default-avatar.png")}
                          />
                          <View style={styles.chatInfo}>
                            <Text style={styles.chatName}>
                              {displayName || formatPublicKey(`${npub}`)}
                            </Text>
                            {created_at && (
                              <Text style={styles.chatDate}>
                                Created at:{" "}
                                {new Date(created_at * 1000).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.nipContainer}>
                          <Text style={styles.nipTag}>
                            {`NIP${NDKKind.EncryptedDirectMessage}`}
                          </Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={24}
                            color="#666"
                          />
                        </View>
                      </TouchableOpacity>
                    </Link>
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
    backgroundColor: "white",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  chatInfo: {
    justifyContent: "center",
  },
  chatName: {
    fontWeight: "500",
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 12,
    color: "#666",
  },
  nipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nipTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    fontSize: 12,
  },
});
