import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import {
  H1,
  H5,
  TypographyBodyL,
  TypographyCaptionL,
} from "@/components/ui/Typography";
import { ROUTES } from "@/constants/routes";

export default function FeaturesScreen() {
  const { redirect } = useLocalSearchParams();
  const router = useRouter();

  const handleGotIt = () => {
    router.push(redirect ?? ROUTES.ROOT);
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />;
      <StatusBar style="light" />
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
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="lime"
            >
              If you like our service, but you don't want to use our free relays
              and want extra privacy without the headache of maintaining your
              own relay, you can use our paid relays.
            </TypographyCaptionL>
            <View style={styles.featureDescription}>
              <Button
                variant="ghost-02"
                size="small"
                onPress={() => alert("soon")}
              >
                Rent a relay
              </Button>
            </View>

            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="magenta"
            >
              Just make sure the following NIPs are supported by your relay: 1,
              2, 4, 9, 11, 12, 15, 16, 17, 20, 22, 28, 33, 40, 44, 59
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
            <TypographyBodyL style={styles.featureDescription}>
              This application is a client-side application. This means that all
              the encryption and decryption is done on your device. We only send
              encrypted messages. Nobody can see who and to whom nor the message
              sent.
            </TypographyBodyL>
            <TypographyBodyL style={styles.featureDescription}>
              Your keys are stored on your device. We don't store them. As long
              as you don't share them, nobody can decrypt your messages.
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
            <TypographyCaptionL
              style={styles.featureDescription}
              colorName="yellow"
            >
              This is a true decentralized application that operates entirely on
              your device, with no traditional backend servers. Instead, it
              connects directly to the Nostr protocol - an open,
              censorship-resistant network of relay servers. Your data flows
              freely through this decentralized infrastructure without any
              intermediary services or central points of control, ensuring
              complete sovereignty over your communications.
            </TypographyCaptionL>
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
          <Button variant="rounded" onPress={handleGotIt}>
            Got it
          </Button>
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
    gap: 12,
  },
  featureDescription: {
    marginLeft: 32,
  },
});
