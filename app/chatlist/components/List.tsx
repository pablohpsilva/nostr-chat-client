import { Fragment, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import ProfileListItem from "@/components/ui/ProfileListItem";
import {
  TypographyBodyS,
  TypographyOverline,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import useNip04Profiles from "@/hooks/useNip04Profiles";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";

export default function List() {
  const {
    getUserProfilesFromChats: getNip04UserProfilesFromChats,
    isLoading: isLoadingNip04UserProfiles,
    profiles: nip04UserProfiles,
  } = useNip04Profiles();
  const {
    loadChatRooms: getNip17UserProfilesFromChats,
    isLoading: isLoadingNip17UserProfiles,
    isLoadingProfiles,
    profiles: nip17UserProfiles,
  } = useNip17StoreProfile();
  const isLoading =
    isLoadingNip17UserProfiles ||
    isLoadingNip04UserProfiles ||
    isLoadingProfiles;
  const hasPrivateChats = Object.keys(nip17UserProfiles).length > 0;
  const hasPublicChats = Object.keys(nip04UserProfiles).length > 0;

  const onRefresh = () => {
    getNip17UserProfilesFromChats();
    getNip04UserProfilesFromChats();
  };

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View>
        <View style={styles.chatHeader}>
          <TypographyOverline
            lightColor={Colors.dark.deactive}
            darkColor={Colors.dark.deactive}
          >
            NIP17 - Private Messages
          </TypographyOverline>

          {isLoadingNip17UserProfiles && <ActivityIndicator size="small" />}
        </View>
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
          {!hasPrivateChats && !isLoadingNip17UserProfiles && (
            <View style={styles.chatHeaderPlaceholder}>
              <TypographyBodyS style={styles.emptyText}>
                No NIP17 conversations yet or not found
              </TypographyBodyS>
            </View>
          )}
        </Fragment>

        <View style={styles.chatHeader}>
          <TypographyOverline
            lightColor={Colors.dark.deactive}
            darkColor={Colors.dark.deactive}
          >
            NIP04 - Unsafe Chats
          </TypographyOverline>

          {isLoadingNip04UserProfiles && <ActivityIndicator size="small" />}
        </View>

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

        {!hasPublicChats && !isLoadingNip04UserProfiles && (
          <View style={styles.chatHeaderPlaceholder}>
            <TypographyBodyS style={styles.emptyText}>
              No NIP04 conversations yet or not found
            </TypographyBodyS>
          </View>
        )}
      </View>
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
  chatHeader: {
    padding: 8,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatHeaderPlaceholder: {
    padding: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
