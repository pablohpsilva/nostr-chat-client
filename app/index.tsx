import { Link, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import {
  H1,
  TypographyBodyL,
  TypographyCaptionL,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.replace("/login");
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={{ minHeight: 100 }} />

        <H1>Welcome to the safest way to chat</H1>
        <View style={styles.content}>
          <View style={styles.features}>
            <TypographyBodyL>🌐 Decentralized</TypographyBodyL>
            <TypographyBodyL>🔓 Permissionless</TypographyBodyL>
            <TypographyBodyL>👤 Anonymous</TypographyBodyL>
            <TypographyBodyL style={{ position: "relative" }}>
              🔒 <Text style={styles.e2eRealTag}>REAL</Text> End-to-end
              encryption
            </TypographyBodyL>
            <TypographyBodyL>🟣 Nostr based</TypographyBodyL>
            <TypographyBodyL>⚡️ Lightning powered</TypographyBodyL>
            <TypographyBodyL>
              🚫 No tracking and no data collection
            </TypographyBodyL>
            <TypographyBodyL>🧅 Tor powered</TypographyBodyL>
          </View>
          <View style={{ marginTop: 20 }}>
            <Link href={ROUTES.FEATURES}>
              <TypographyCaptionL colorName="primary">
                I want to know more!
              </TypographyCaptionL>
            </Link>
          </View>
        </View>

        <SafeAreaView edges={["bottom"]}>
          <Button onPress={handleNavigateToLogin}>Get Started</Button>
        </SafeAreaView>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  features: {
    alignSelf: "stretch",
    marginTop: 20,
    gap: 8,
  },
  e2eRealTag: {
    color: Colors.light.yellow,
    fontSize: 8,
    fontWeight: "bold",
  },
});
