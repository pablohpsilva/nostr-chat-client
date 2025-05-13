import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

// import { ROUTES } from "@/constants/routes";
import useEncryptedMessage from "@/hooks/useEncryptedMessage";
import usePrivateDirectMessage from "@/hooks/usePrivateDirectMessage";
import List from "./components/List";
// import List from "./components/List";

export default function ChatListPage() {
  const logout = useNDKSessionLogout();
  const router = useRouter();
  const { getUserChats: getEncryptedUserChats, isLoading: isEncryptedLoading } =
    useEncryptedMessage();
  const { getUserChats: getPrivateUserChats, isLoading: isPrivateLoading } =
    usePrivateDirectMessage();
  const [userChats, setUserChats] = useState<{
    encryptedUserChats: Record<string, NDKUserProfile>;
    privateUserChats: Record<string, NDKUserProfile>;
  }>({
    encryptedUserChats: {},
    privateUserChats: {},
  });
  const isLoading = isEncryptedLoading || isPrivateLoading;

  const getUserChats = async () => {
    const encryptedUserChats = await getEncryptedUserChats();
    const privateUserChats = await getPrivateUserChats();

    console.log("{encryptedUserChats, privateUserChats}", {
      encryptedUserChats,
      privateUserChats,
    });

    setUserChats({ encryptedUserChats, privateUserChats });
  };

  const handleOnClickLogout = () => {
    logout();
    // router.replace(ROUTES.LOGIN);
  };

  useEffect(() => {
    getUserChats();
  }, []);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <List
          loading={isLoading}
          error={null}
          nip04UserProfiles={userChats.encryptedUserChats}
          nip17UserProfiles={userChats.privateUserChats}
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
