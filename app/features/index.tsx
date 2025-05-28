import { LinkButton } from "@/components/ui/Button/LinkButton";
import {
  H1,
  H5,
  TypographyBodyL,
  TypographyCaptionL,
} from "@/components/ui/Typography";
import { ROUTES } from "@/constants/routes";
import { Stack } from "expo-router";
import { Fragment } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeaturesScreen() {
  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />;
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <H1>How It Works</H1>
        </SafeAreaView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.featureSection}>
            <H5>🌐 Decentralized</H5>
            <TypographyBodyL style={styles.featureDescription}>
              No single point of failure. Your messages are encrypted using the
              best Nostr-NIP17 message encryption, distributed across a network
              of relays, ensuring the platform remains available even if some
              servers go down.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              If you don't like or don't trust our relays, you can run your own
              relay and use it in the application.
            </TypographyCaptionL>
          </View>

          <View style={styles.featureSection}>
            <H5>🔓 Permissionless</H5>
            <TypographyBodyL style={styles.featureDescription}>
              No gatekeepers or approval processes. Anyone can join the app
              without asking for permission from any central authority.
            </TypographyBodyL>
          </View>

          <View style={styles.featureSection}>
            <H5>👤 Anonymous</H5>
            <TypographyBodyL style={styles.featureDescription}>
              Your identity is protected by cryptographic keys, not personal
              information. No phone numbers, email addresses, or real names
              required to start chatting.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              You own your data. You own your keys. You own your identity.
            </TypographyCaptionL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="lime"
            >
              All public keys are pseudonymous. As long as you don't share
              publicly your public key and/or do not create a Nostr Profile,
              nobody can link your public key to you.
            </TypographyCaptionL>
          </View>

          <View style={styles.featureSection}>
            <H5>🔒 End-to-end encryption</H5>
            <TypographyBodyL style={styles.featureDescription}>
              Messages are encrypted on your device before sending and can only
              be decrypted by the intended recipient. Even relay operators
              cannot read your conversations - true privacy by design.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              This is REAL end-to-end encryption. Not WhatsApp "end-to-end"
              encription where Meta has access to all your data.
            </TypographyCaptionL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="lime"
            >
              The entire app handles all the encryption and decryption on your
              device. We only send Nostr-NIP17 messages, that are already
              encrypted, and wrapped into encryption. Nobody can see who and to
              whom nor the message sent.
            </TypographyCaptionL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="magenta"
            >
              You control your Public and Private keys. Unless you share them,
              nobody can decrypt your messages.
            </TypographyCaptionL>
          </View>

          <View style={styles.featureSection}>
            <H5>🟣 Nostr based</H5>
            <TypographyBodyL style={styles.featureDescription}>
              Built on the Nostr protocol, a simple, open standard for
              decentralized social networks. This ensures interoperability with
              other Nostr applications and long-term sustainability.
            </TypographyBodyL>
          </View>

          <View style={styles.featureSection}>
            <H5>⚡️ Lightning powered</H5>
            <TypographyBodyL style={styles.featureDescription}>
              Integrated Bitcoin Lightning Network support enables instant,
              low-cost payments within chats. Send value as easily as sending a
              message, opening up new possibilities for digital interactions.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              🚧 Feature is under development. 🚧
            </TypographyCaptionL>
          </View>

          <View style={styles.featureSection}>
            <H5>🚫 No tracking and no data collection</H5>
            <TypographyBodyL style={styles.featureDescription}>
              We don't collect, store, or analyze your personal data. No
              analytics, no tracking pixels, no behavioral profiling. Your
              privacy is respected from the ground up.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              If you would like to share your thoughts or feedback, please
              contact us.
            </TypographyCaptionL>
          </View>

          <View style={styles.featureSection}>
            <H5>🧅 Tor powered</H5>
            <TypographyBodyL style={styles.featureDescription}>
              The relays we provide are using Tor by default. You can use the
              app with or without Tor.
            </TypographyBodyL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              All the messages are encrypted on your device and routed through
              the Tor network, ensuring your privacy and security. Having Tor
              enabled is recommended to enhance your privacy.
            </TypographyCaptionL>
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="lime"
            >
              If you use Tor, your messages are encrypted and routed through the
              Tor network, ensuring your privacy and security.
            </TypographyCaptionL>
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <LinkButton href={ROUTES.ROOT}>Got it!</LinkButton>
        </SafeAreaView>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 800,
    marginHorizontal: "auto",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
  },
  featureSection: {
    marginBottom: 24,
    gap: 8,
  },
  featureDescription: {
    marginLeft: 32,
  },
});
