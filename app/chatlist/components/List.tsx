import { NDKKind } from "@nostr-dev-kit/ndk";
import { Fragment, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import ProfileListItem from "@/components/ui/ProfileListItem";
import { TypographyBodyS } from "@/components/ui/Typography";
import useNip14Profiles from "@/hooks/useNip04Profiles";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";
import { useProfileStore } from "@/store/profiles";

interface ListProps {
  onChatClick: (kind: `NIP${NDKKind}`, pubkey: string) => void;
}

export default function List(props: ListProps) {
  const {
    getUserProfilesFromChats: getNip04UserProfilesFromChats,
    isLoading: isLoadingNip04UserProfiles,
  } = useNip14Profiles();
  const {
    loadChatRooms: getNip17UserProfilesFromChats,
    isLoading: isLoadingNip17UserProfiles,
    isLoadingProfiles,
  } = useNip17StoreProfile();
  const { profiles: userProfiles, getChatRoomList } = useProfileStore();
  const { nip04: nip04UserProfiles, nip17: nip17UserProfiles } = useMemo(() => {
    return getChatRoomList();
  }, [userProfiles]);
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
      {isLoading ? (
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
      ) : (
        <Fragment>
          {hasPrivateChats && (
            <Fragment>
              {Object.values(nip17UserProfiles).map(
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
            </Fragment>
          )}

          {hasPublicChats && (
            <Fragment>
              {Object.values(nip04UserProfiles).map(
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
            </Fragment>
          )}
        </Fragment>
      )}
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
