import { getNDK } from "@/components/NDKHeadless";
import { fillRoute, ROUTES } from "@/constants/routes";
import { NDKKind, NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatPubkey = (pubkey: string) => {
  return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
};

export default function SearchStartChat({ npub }: { npub: string }) {
  const [userProfiles, setUserProfiles] = useState<NDKUserProfile>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const user = getNDK().getInstance().getUser({ npub });
      const userProfile = await user.fetchProfile();

      if (userProfile) {
        setUserProfiles(userProfile);
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [npub]);

  return (
    <Fragment>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              {/* <Image
                source={{
                  uri:
                    userProfiles?.picture ||
                    "https://placehold.co/40x40?text=NostrChat",
                }}
                style={styles.avatar}
                defaultSource={require("@/assets/default-avatar.png")}
              /> */}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Text this user:</Text>
              <View>
                <Text style={styles.userName}>
                  {userProfiles?.displayName ||
                    userProfiles?.name ||
                    "UnknownUser"}
                </Text>
                <Text style={styles.pubkey}>{formatPubkey(npub)}</Text>
              </View>
            </View>
          </View>

          <Link
            href={fillRoute(ROUTES.CHAT_ID, {
              nip: `NIP${NDKKind.EncryptedDirectMessage}`,
              pubkey: npub,
            })}
            asChild
          >
            <TouchableOpacity style={styles.chatButton}>
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.statusText}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  textContainer: {
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: "rgba(0,0,0,0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  pubkey: {
    fontSize: 12,
    color: "#6b7280",
  },
  chatButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  chatButtonText: {
    color: "white",
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  errorContainer: {
    padding: 8,
  },
  statusText: {
    color: "#666",
  },
  errorText: {
    color: "red",
  },
});
