import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import AddContactModal from "./components/AddContactModal";
import List from "./components/List";
import SettingsModal from "./components/SettingsModal";

export default function ChatListPage() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.container}>
        <SafeAreaView style={styles.header} edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsSettingsModalOpen(true)}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={Colors.dark.white}
              />
            </TouchableOpacity>

            {/* <Search /> */}

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsAddContactModalOpen(true)}
            >
              <Ionicons
                name="add-outline"
                size={24}
                color={Colors.dark.white}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <List />

        <SettingsModal
          isOverlayOpen={isSettingsModalOpen}
          handleCloseOverlay={() => setIsSettingsModalOpen(false)}
        />

        <AddContactModal
          isOverlayOpen={isAddContactModalOpen}
          handleCloseOverlay={() => setIsAddContactModalOpen(false)}
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
