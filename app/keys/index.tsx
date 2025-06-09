import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  H4,
  TypographyBodyL,
  TypographyBodyS,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";

export default function KeysScreen() {
  const currentUser = useNDKCurrentUser();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyConfirmed, setPrivateKeyConfirmed] = useState(false);
  console.log("currentUser", currentUser);
  const [keys, setKeys] = useState({
    publicKey: currentUser?.pubkey,
    npub: currentUser?.npub,
    // privateKey: currentUser?.privateKey,
    privateKey: "",
  });

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  const handleShowPrivateKey = () => {
    if (!privateKeyConfirmed) {
      Alert.alert(
        "Warning",
        "Never share your private key with anyone. Anyone with access to your private key can control your account and funds.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "I Understand",
            onPress: () => setShowPrivateKey(true),
            style: "destructive",
          },
        ]
      );
      return;
    }
    setShowPrivateKey(true);
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
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
                  isChecked={privateKeyConfirmed}
                  onPress={() => setPrivateKeyConfirmed(!privateKeyConfirmed)}
                  text="I understand the risks of exposing my private key"
                />
              )}
            </View>
            {showPrivateKey ? (
              <View style={styles.keyContainer}>
                <TextField
                  label="Private Key"
                  value={keys?.privateKey || ""}
                  editable={false}
                  multiline
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
            ) : (
              <Button
                variant="rounded"
                onPress={handleShowPrivateKey}
                disabled={!privateKeyConfirmed}
              >
                Show Private Key
              </Button>
            )}
            {showPrivateKey && (
              <TypographyBodyS style={styles.warning}>
                Warning: Never share your private key with anyone. Anyone with
                access to your private key can control your account and funds.
              </TypographyBodyS>
            )}
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
    padding: 16,
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
    color: Colors.dark.error,
    marginTop: 8,
  },
});
