import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";

type LogoProps = {
  size?: "small" | "medium" | "large";
};

export function Logo({ size = "medium" }: LogoProps) {
  const logoSize = size === "small" ? 60 : size === "medium" ? 100 : 140;

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icon.png")}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        contentFit="contain"
      />
      <ThemedText
        type="title"
        style={[
          styles.appName,
          size === "small"
            ? { fontSize: 20 }
            : size === "medium"
            ? { fontSize: 32 }
            : { fontSize: 42 },
        ]}
      >
        NoStream
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    marginBottom: 16,
  },
  appName: {
    fontWeight: "bold",
  },
});
