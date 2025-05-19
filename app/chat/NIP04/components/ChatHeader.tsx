import { Ionicons } from "@expo/vector-icons";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";

interface ChatHeaderProps {
  userProfile: NDKUserProfile;
  onBackClick: () => void;
}

const ChatHeader = ({ userProfile, onBackClick }: ChatHeaderProps) => {
  const formatPubkey = (pubkey: string) => {
    return `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <Link href={ROUTES.CHAT} asChild>
          <TouchableOpacity onPress={onBackClick} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
        </Link>
        <View>
          <Text style={styles.username}>
            {userProfile?.displayName ||
              userProfile?.name ||
              formatPubkey(`${userProfile?.npub ?? userProfile?.pubkey}`)}
          </Text>
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
    borderBottomColor: "#e5e7eb",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default ChatHeader;
