import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { TypographyBodyL, TypographyTitle } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { fillRoute, ROUTES } from "@/constants/routes";
import { useChatStore } from "@/store/chat";
import { useChatListStore } from "@/store/chatlist";
import { useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import { Link, useRouter } from "expo-router";

export default function SettingsModal({
  isOverlayOpen,
  handleCloseOverlay,
}: {
  isOverlayOpen: boolean;
  handleCloseOverlay: () => void;
}) {
  const { wipeCleanMessages } = useChatStore();
  const { wipeCleanChatRooms } = useChatListStore();
  const logout = useNDKSessionLogout();
  const router = useRouter();

  const handleLogout = () => {
    handleCloseOverlay();
    logout();
    wipeCleanMessages();
    wipeCleanChatRooms();
    router.replace(ROUTES.LOGIN);
  };

  const handleOnClickLogout = () => {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Logging out will wipe clean your device's data. Are you sure you want to continue?"
        )
      ) {
        handleLogout();
      }
      return;
    }
    return Alert.alert(
      "Log out?",
      "Logging out will wipe clean your device's data. Are you sure you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: handleLogout,
        },
      ]
    );
  };

  const handleScroll = (event: any) => {
    const { contentOffset, velocity } = event.nativeEvent;

    // If scrolling down with significant velocity near the top, close modal
    if (contentOffset.y <= 50 && velocity.y < -0.5) {
      handleCloseOverlay();
    }
  };

  const toBeImplemented = () => {
    alert("Soon :)");
  };

  return (
    <Modal
      visible={isOverlayOpen}
      animationType="slide"
      onRequestClose={handleCloseOverlay}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            onPress={handleCloseOverlay}
            style={styles.backButton}
          >
            <Ionicons
              name="close-outline"
              size={20}
              color={Colors.dark.white}
            />
          </TouchableOpacity>
          <TypographyTitle>Settings</TypographyTitle>
        </View>

        <ScrollView
          style={styles.searchResults}
          contentContainerStyle={styles.searchResultsContent}
          onScrollEndDrag={handleScroll}
          scrollEventThrottle={16}
        >
          <View>
            <Link
              href={fillRoute(ROUTES.FEATURES, {}, `?redirect=${ROUTES.CHAT}`)}
              onPress={handleCloseOverlay}
              style={styles.menuItem}
            >
              <TypographyBodyL>💬 FAQ and Features</TypographyBodyL>
            </Link>
            <Link
              href={ROUTES.RELAYS}
              onPress={handleCloseOverlay}
              style={styles.menuItem}
            >
              <TypographyBodyL>🔗 Relays</TypographyBodyL>
            </Link>
            <Link href="#" onPress={toBeImplemented} style={styles.menuItem}>
              <TypographyBodyL>⚡️ Zaps</TypographyBodyL>
            </Link>
            <Link href="#" onPress={toBeImplemented} style={styles.menuItem}>
              <TypographyBodyL>💳 Cachu Wallet</TypographyBodyL>
            </Link>
            <Link href="#" onPress={toBeImplemented} style={styles.menuItem}>
              <TypographyBodyL>🔒 Privacy</TypographyBodyL>
            </Link>
            <Link
              href={ROUTES.KEYS}
              onPress={handleCloseOverlay}
              style={styles.menuItem}
            >
              <TypographyBodyL>🔑 Keys</TypographyBodyL>
            </Link>
          </View>
        </ScrollView>
        <Button variant="text-primary" onPress={handleOnClickLogout}>
          Logout
        </Button>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  backButton: {
    marginRight: 16,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    color: Colors.dark.white,
    borderColor: Colors.dark.backgroundPrimary,
    backgroundColor: Colors.dark.backgroundPrimary,
    borderRadius: 8,
    outline: "none",
    outlineWidth: 0,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    padding: 8,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  menuItem: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderColor: Colors.dark.deactive,
  },
});
