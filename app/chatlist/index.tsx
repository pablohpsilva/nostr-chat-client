import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { ROUTES } from "@/constants/routes";
import useNip14 from "@/hooks/useNip04";
import useNip17 from "@/hooks/useNip17";
import List from "./components/List";
// import List from "./components/List";

export default function ChatListPage() {
  const logout = useNDKSessionLogout();
  const router = useRouter();
  const {
    getUserProfilesFromChats: getNip17UserProfilesFromChats,
    userProfiles: nip17UserProfiles,
    isLoading: isLoadingNip17UserProfiles,
  } = useNip17();
  const {
    getUserProfilesFromChats: getNip04UserProfilesFromChats,
    userProfiles: nip04UserProfiles,
    isLoading: isLoadingNip04UserProfiles,
  } = useNip14();
  const isLoading = isLoadingNip17UserProfiles || isLoadingNip04UserProfiles;

  const handleOnClickLogout = () => {
    logout();
    router.replace(ROUTES.LOGIN);
  };

  useEffect(() => {
    getNip17UserProfilesFromChats();
    getNip04UserProfilesFromChats();
  }, []);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <List
          loading={isLoading}
          error={null}
          nip04UserProfiles={nip04UserProfiles}
          nip17UserProfiles={nip17UserProfiles}
          onChatClick={() => {}}
          handleOnClickLogout={handleOnClickLogout}
        />
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
