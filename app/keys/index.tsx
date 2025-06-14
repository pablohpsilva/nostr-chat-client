import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNDK } from "@/components/Context";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  H4,
  H5,
  TypographyBodyL,
  TypographyBodyS,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";
import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk-hooks";

export default function KeysScreen() {
  const router = useRouter();
  const { ndk } = useNDK();
  const currentUser = ndk?.activeUser;
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyConfirmed, setPrivateKeyConfirmed] = useState(false);
  const [keys, setKeys] = useState({
    publicKey: currentUser?.pubkey,
    npub: currentUser?.npub,
    // privateKey: currentUser?.privateKey,
    privateKey: "",
    nsec: "",
  });
  const privateKeyButtonText = showPrivateKey
    ? "Hide Private Key"
    : "Show Private Key";

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  const handlePrivateKeyShow = () => {
    setShowPrivateKey(true);
    const currentUserPrivateKey =
      //   @ts-expect-error
      ndk?.signer?.privateKey;
    const signer = new NDKPrivateKeySigner(
      currentUserPrivateKey as `nsec${string}`
    );
    console.log("signer", signer);
    setKeys((state) => ({
      ...state,
      privateKey: signer.privateKey,
      nsec: signer.nsec,
    }));
  };

  const handleShowPrivateKey = () => {
    if (showPrivateKey) {
      setShowPrivateKey(false);
      setPrivateKeyConfirmed(false);
      return;
    }

    if (privateKeyConfirmed) {
      if (
        Platform.OS === "web" &&
        window.confirm(
          "Never share your private key with anyone. Anyone with access to your private key can control your account and funds. Do you want to continue?"
        )
      ) {
        return handlePrivateKeyShow();
      }

      Alert.alert(
        "Warning",
        "Never share your private key with anyone. Anyone with access to your private key can control your account and funds.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "I Understand",
            onPress: handlePrivateKeyShow,
            style: "destructive",
          },
        ]
      );
    }
    // setShowPrivateKey(true);
  };

  const handleBackButton = () => {
    router.replace(ROUTES.CHAT);
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.dark.white} />
          </TouchableOpacity>

          <H4>Your Keys</H4>
        </SafeAreaView>

        <View style={styles.content}>
          <View style={styles.keySection}>
            <TypographyBodyL>Public Key (hex)</TypographyBodyL>
            <View style={styles.keyContainer}>
              <TextField
                label="Public Key (hex)"
                value={keys?.publicKey || ""}
                editable={false}
                multiline
                width="85%"
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() =>
                  copyToClipboard(keys?.publicKey || "", "Public key")
                }
              >
                <Ionicons
                  name="copy-outline"
                  size={24}
                  color={Colors.dark.white}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.keySection}>
            <TypographyBodyL>Public Key (npub)</TypographyBodyL>
            <View style={styles.keyContainer}>
              <TextField
                label="Public Key (npub)"
                value={keys?.npub || ""}
                editable={false}
                multiline
                width="85%"
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(keys?.npub || "", "npub")}
              >
                <Ionicons
                  name="copy-outline"
                  size={24}
                  color={Colors.dark.white}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.keySection}>
            <View style={styles.privateKeyHeader}>
              <TypographyBodyL>Private Key</TypographyBodyL>
              {!showPrivateKey && (
                <BouncyCheckbox
                  fillColor={Colors.dark.primary}
                  isChecked={privateKeyConfirmed}
                  onPress={() => setPrivateKeyConfirmed(!privateKeyConfirmed)}
                  text="I understand the risks of exposing my private key"
                />
              )}
            </View>
            {showPrivateKey && (
              <Fragment>
                <View style={styles.keyContainer}>
                  <TextField
                    label="Nsec"
                    value={keys?.nsec || ""}
                    editable={false}
                    multiline
                    width="85%"
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(keys?.nsec || "", "Nsec")}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={24}
                      color={Colors.dark.white}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.keyContainer}>
                  <TextField
                    label="Private key"
                    value={keys?.privateKey || ""}
                    editable={false}
                    multiline
                    width="85%"
                  />
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      copyToClipboard(keys?.privateKey || "", "Private key")
                    }
                  >
                    <Ionicons
                      name="copy-outline"
                      size={24}
                      color={Colors.dark.white}
                    />
                  </TouchableOpacity>
                </View>
              </Fragment>
            )}

            {showPrivateKey && (
              <Fragment>
                <H5 colorName="danger">Warning: </H5>
                <TypographyBodyS style={styles.warning}>
                  Never share your private key with anyone. Anyone with access
                  to your private key can control your account and funds.
                </TypographyBodyS>
              </Fragment>
            )}

            <Button
              variant={privateKeyConfirmed ? "rounded" : "ghost-02"}
              onPress={handleShowPrivateKey}
              disabled={!privateKeyConfirmed}
            >
              {privateKeyButtonText}
            </Button>
          </View>
        </View>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  keySection: {
    gap: 8,
  },
  keyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButton: {
    padding: 8,
  },
  privateKeyHeader: {
    gap: 8,
  },
  warning: {
    color: Colors.dark.danger,
    marginTop: 8,
  },
  backButton: {
    marginRight: 16,
  },
});
