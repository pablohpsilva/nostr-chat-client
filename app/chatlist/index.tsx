import { Ionicons } from "@expo/vector-icons";
import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";
import List from "./components/List";
import Search from "./components/Search";

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
