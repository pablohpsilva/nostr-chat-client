import { NDKKind } from "@nostr-dev-kit/ndk";
import { Fragment, useEffect } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import ProfileListItem from "@/components/ui/ProfileListItem";
import { TypographyBodyS } from "@/components/ui/Typography";
import useNip04Profiles from "@/hooks/useNip04Profiles";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";
import { useProfileStore } from "@/store/profiles";

interface ListProps {
  onChatClick?: (kind: `NIP${NDKKind}`, pubkey: string) => void;
}

export default function List(props: ListProps) {
  const {
    getUserProfilesFromChats: getNip04UserProfilesFromChats,
    isLoading: isLoadingNip04UserProfiles,
  } = useNip04Profiles();
  const {
    loadChatRooms: getNip17UserProfilesFromChats,
    isLoading: isLoadingNip17UserProfiles,
    isLoadingProfiles,
  } = useNip17StoreProfile();
  const { getChatRoomList } = useProfileStore();
  const { nip04: nip04UserProfiles, nip17: nip17UserProfiles } =
    getChatRoomList();
  const isLoading =
    isLoadingNip17UserProfiles ||
    isLoadingNip04UserProfiles ||
    isLoadingProfiles;
  const hasPrivateChats = Object.keys(nip17UserProfiles).length > 0;
  const hasPublicChats = Object.keys(nip04UserProfiles).length > 0;
  const hasConversations = hasPrivateChats || hasPublicChats;

  useEffect(() => {
    getNip17UserProfilesFromChats();
    getNip04UserProfilesFromChats();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => {
            getNip17UserProfilesFromChats();
          }}
        />
      }
    >
      {!hasConversations && (
        <View style={styles.centerContainer}>
          <TypographyBodyS style={styles.emptyText}>
            No conversations yet
          </TypographyBodyS>
        </View>
      )}

      <View>
        <Fragment>
          {hasPrivateChats &&
            Object.values(nip17UserProfiles).map(
              ({ npub, pubkey, displayName, picture, created_at }, index) => (
                <ProfileListItem
                  key={`${pubkey}-${npub}-${index}-${created_at}`}
                  {...{
                    npub,
                    displayName,
                    picture,
                    tag: "NIP17",
                  }}
                />
              )
            )}

          {isLoadingNip17UserProfiles && (
            <View style={styles.centerContainer}>
              <TypographyBodyS style={styles.emptyText}>
                Loading NIP17 messages
              </TypographyBodyS>
            </View>
          )}

          {hasPublicChats &&
            Object.values(nip04UserProfiles).map(
              ({ npub, displayName, picture, created_at }, index) => (
                <ProfileListItem
                  key={`${npub}-${npub}-${index}-${created_at}`}
                  {...{
                    npub,
                    displayName,
                    picture,
                    tag: "NIP04",
                  }}
                />
              )
            )}
          {isLoadingNip04UserProfiles && (
            <View style={styles.centerContainer}>
              <TypographyBodyS style={styles.emptyText}>
                Loading NIP04 messages
              </TypographyBodyS>
            </View>
          )}
        </Fragment>
      </View>

      {/* {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <TypographyBodyS style={styles.loadingText}>
            Loading chats...
          </TypographyBodyS>
        </View>
      ) : !hasConversations ? (
        <View style={styles.centerContainer}>
          <TypographyBodyS style={styles.emptyText}>
            No conversations yet
          </TypographyBodyS>
        </View>
      ) : } */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
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
