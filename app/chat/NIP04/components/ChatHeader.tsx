import { Ionicons } from "@expo/vector-icons";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TypographyTitle } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";

interface ChatHeaderProps {
  userProfile: NDKUserProfile;
  onBackClick: () => void;
}

const ChatHeader = ({ userProfile, onBackClick }: ChatHeaderProps) => {
  const formatPubkey = (pubkey: string, length: number = 6) => {
    return `${pubkey.substring(0, length)}...${pubkey.substring(
      pubkey.length - length
    )}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <Link href={ROUTES.CHAT} asChild>
          <TouchableOpacity onPress={onBackClick} style={styles.backButton}>
            <Ionicons name="chevron-back" size={18} color={Colors.dark.white} />
          </TouchableOpacity>
        </Link>
        <View>
          <TypographyTitle>
            {userProfile?.displayName ||
              userProfile?.name ||
              formatPubkey(`${userProfile?.npub ?? userProfile?.pubkey}`, 12)}
          </TypographyTitle>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    backgroundColor: Colors.dark.backgroundSecondary,
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default ChatHeader;
