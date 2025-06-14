import { Ionicons } from "@expo/vector-icons";
import { NDKUserProfile } from "@nostr-dev-kit/ndk";
import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
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
      <SafeAreaView
        style={[styles.header, styles.defaultShadow]}
        edges={["top"]}
      >
        <Link href={ROUTES.CHAT} asChild>
          <Button
            variant="small-close"
            onPress={onBackClick}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.dark.white} />
          </Button>
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
    alignItems: "center",
  },
  defaultShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 8,
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
