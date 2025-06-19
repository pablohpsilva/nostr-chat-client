import Ionicons from "@expo/vector-icons/build/Ionicons";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { nip19 } from "nostr-tools";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import {
  TypographyBodyS,
  TypographyBodySBold,
  TypographyBodySRegular,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { fillRoute, ROUTES } from "@/constants/routes";
import { formatPubkey, isValidNpubOrPublicKey } from "@/interal-lib/utils";
import useNDKWrapper from "@/hooks/useNDKWrapper";

export default function SearchStartChat({
  npub: _npub,
  onClose,
}: {
  npub: string;
  onClose?: () => void;
}) {
  const [userProfiles, setUserProfiles] = useState<NDKUserProfile>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const npub = useMemo(() => {
    return !_npub.startsWith("npub") ? nip19.npubEncode(_npub) : _npub;
  }, [_npub]);
  const npubToUse = isValidNpubOrPublicKey(npub) ? npub : "";
  const { fetchProfile } = useNDKWrapper();

  const fetchUserProfile = async () => {
    try {
      if (isValidNpubOrPublicKey(npub)) {
        setIsLoading(true);
        const userProfile = await getProfile(npub);

        if (userProfile) {
          setUserProfiles(userProfile);
        }
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnClose = () => {
    onClose?.();
  };

  useEffect(() => {
    fetchUserProfile();
  }, [npub]);

  return (
    <Fragment>
      <Link
        style={styles.container}
        href={fillRoute(ROUTES.CHAT_ID, {
          nip: "NIP17",
          npub: npubToUse,
        })}
        onPress={handleOnClose}
      >
        <View style={styles.contentContainer}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    userProfiles?.picture ||
                    "https://placehold.co/40x40?text=NostrChat",
                }}
                style={styles.avatar}
                // defaultSource={require("@/assets/default-avatar.png")}
              />
            </View>
            <View style={styles.textContainer}>
              <TypographyBodySRegular>Text this user:</TypographyBodySRegular>
              <View>
                <TypographyBodySBold>
                  {userProfiles?.displayName ||
                    userProfiles?.name ||
                    `Anonymous user: ${formatPubkey(npubToUse)}`}
                </TypographyBodySBold>
                <TypographyBodyS style={styles.pubkey}>
                  Match for: {formatPubkey(_npub)}
                </TypographyBodyS>
              </View>
            </View>
          </View>

          <View style={styles.nipContainer}>
            <Ionicons name="chevron-forward-outline" size={20} color="#fff" />
          </View>
        </View>
      </Link>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <TypographyBodyS style={styles.statusText}>
            Loading...
          </TypographyBodyS>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <TypographyBodyS style={styles.errorText}>
            Error: {error}
          </TypographyBodyS>
        </View>
      )}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.dark.deactive,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 16,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contentContainer: {
    width: "100%",
    display: "flex",
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
  chatButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  nipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
