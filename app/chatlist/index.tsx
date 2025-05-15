import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { ROUTES } from "@/constants/routes";
import useNip17 from "@/hooks/useNip17";
import List from "./components/List";
// import List from "./components/List";

export default function ChatListPage() {
  const logout = useNDKSessionLogout();
  const router = useRouter();
  const { getUserProfilesFromChats, userProfiles, isLoading } = useNip17();

  const handleOnClickLogout = () => {
    logout();
    router.replace(ROUTES.LOGIN);
  };

  useEffect(() => {
    getUserProfilesFromChats();
  }, []);

  // console.log(
  //   "userProfiles",
  //   userProfiles && JSON.stringify(userProfiles, null, 2)
  // );

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <List
          loading={isLoading}
          error={null}
          nip04UserProfiles={[]}
          nip17UserProfiles={userProfiles}
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
