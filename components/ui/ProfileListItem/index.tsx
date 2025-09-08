import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { fillRoute, ROUTES } from "@/constants/routes";
import { formatPublicKey } from "@/internal-lib/utils";
import Tag from "../Tag";
import { TypographyBodyL, TypographyCaptionXS } from "../Typography";

interface ProfileListItemProps {
  npub?: string;
  displayName?: string;
  picture?: string;
  tag?: string;
}

export default function ProfileListItem({
  npub,
  displayName,
  picture,
  tag = "NIP17",
}: ProfileListItemProps) {
  return (
    <Link
      href={fillRoute(ROUTES.CHAT_ID, {
        nip: tag,
        npub: `${npub}`,
      })}
      asChild
    >
      <TouchableOpacity>
        <View style={styles.chatItem}>
          <View style={styles.chatItemContent}>
            <Image source={{ uri: picture }} style={styles.avatar} />

            <View style={styles.chatInfo}>
              <TypographyBodyL>
                {displayName || formatPublicKey(`${npub}`)}
              </TypographyBodyL>

              <View style={styles.nipContainer}>
                <Tag
                  tag={tag}
                  color={
                    tag === "NIP17" ? Colors.dark.primary : Colors.dark.danger
                  }
                />
                {tag && tag === "NIP04" && (
                  <TypographyCaptionXS>Not safe</TypographyCaptionXS>
                )}
              </View>
            </View>
          </View>

          <View style={styles.nipContainer}>
            <Ionicons
              name="chevron-forward-outline"
              size={12}
              color={Colors.dark.white}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 80,
    backgroundColor: Colors.dark.deactive,
  },
  chatInfo: {
    justifyContent: "center",
    gap: 4,
  },
  chatDate: {
    fontSize: 12,
    color: "#666",
  },
  nipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nipTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 10,
    color: Colors.dark.white,
    width: 42,
    fontWeight: "700",
    textAlign: "center",
  },
});
