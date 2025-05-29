import { NDKKind } from "@nostr-dev-kit/ndk";
import { Fragment, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ProfileListItem from "@/components/ui/ProfileListItem";
import useNip14 from "@/hooks/useNip04";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";

interface ListProps {
  onChatClick: (kind: `NIP${NDKKind}`, pubkey: string) => void;
  handleOnClickLogout: () => void;
}

export default function List({ handleOnClickLogout }: ListProps) {
  const {
    getUserProfilesFromChats: getNip04UserProfilesFromChats,
    userProfiles: nip04UserProfiles,
    isLoading: isLoadingNip04UserProfiles,
  } = useNip14();
  const {
    profiles: nip17UserProfiles,
    loadChatRooms: getNip17UserProfilesFromChats,
    isLoading: isLoadingNip17UserProfiles,
    isLoadingNip17Profiles,
  } = useNip17StoreProfile();
  const isLoading =
    isLoadingNip17UserProfiles ||
    isLoadingNip04UserProfiles ||
    isLoadingNip17Profiles;
  const hasPrivateChats = Object.keys(nip17UserProfiles).length > 0;
  const hasPublicChats = Object.keys(nip04UserProfiles).length > 0;
  const hasConversations = hasPrivateChats || hasPublicChats;

  useEffect(() => {
    console.log("START -> getNip17UserProfilesFromChats");
    getNip17UserProfilesFromChats();
    // getNip17UserProfilesFromChats().then((data) => {
    //   asyncGetNip17UserProfilesFromChats();
    //   console.log("data", data);
    // });
    console.log("END -> getNip17UserProfilesFromChats");
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
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : // error ? (
      //   <View style={styles.centerContainer}>
      //     <Text style={styles.errorText}>Error loading chats</Text>
      //   </View>
      // ) :
      !hasConversations ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <Fragment>
          {hasPrivateChats && (
            <Fragment>
              {Object.values(nip17UserProfiles).map(
                ({ npub, pubkey, displayName, picture, created_at }, index) => (
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
                ({ npub, displayName, picture, image, created_at }, index) => (
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
  );
}

const styles = StyleSheet.create({
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
