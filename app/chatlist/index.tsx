import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ROUTES } from "@/constants/routes";
import useNip14 from "@/hooks/useNip04";
import useNip17StoreProfile from "@/hooks/useNip17ChatRooms";
import List from "./components/List";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Search from "./components/Search";
import { Colors } from "@/constants/Colors";

export default function ChatListPage() {
  const logout = useNDKSessionLogout();
  const router = useRouter();

  const handleOnClickLogout = () => {
    logout();
    router.replace(ROUTES.LOGIN);
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.container}>
        <SafeAreaView style={styles.header} edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleOnClickLogout}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={Colors.dark.white}
              />
            </TouchableOpacity>

            <Search />

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => alert("Soon... :)")}
            >
              <Ionicons
                name="add-outline"
                size={24}
                color={Colors.dark.white}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <List
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    backgroundColor: Colors.dark.backgroundSecondary,
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
});
