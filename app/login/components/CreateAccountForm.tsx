import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import * as Clipboard from "expo-clipboard";
import React, { Fragment, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import "react-native-get-random-values";

import { Button } from "@/components/ui/Button";
import {
  TypographyBodyL,
  TypographyBodyS,
  TypographyBodySBold,
  TypographyCaptionL,
  TypographyCaptionS,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeysType } from "../types";

interface CreateAccountFormProps {
  onCreateAccount: (keys: KeysType) => Promise<void>;
  onClickBack: () => void;
}

export const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
  onCreateAccount,
  onClickBack,
}) => {
  const [keys, setKeys] = useState<KeysType | null>({
    npub: "" as `npub${string}`,
    nsec: "" as `nsec${string}`,
    privateKey: "",
    publicKey: "",
  });
  const hasGeneratedKeys = keys?.npub && keys?.nsec;

  const handleOnClickGenerateKeys = async () => {
    try {
      const signer = NDKPrivateKeySigner.generate();
      const privateKey = signer.privateKey; // Get the hex private key
      const publicKey = signer.pubkey; // Get the hex public key
      const nsec = signer.nsec as `nsec${string}`; // Get the private key in nsec format
      const npub = signer.npub as `npub${string}`; // Get the public key in npub format
      const newKeys = {
        privateKey,
        publicKey,
        nsec,
        npub,
      };

      setKeys(newKeys);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOnClickContinue = async () => {
    if (keys) {
      Alert.alert("Confirmation", "Are you sure you saved your keys?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => onCreateAccount(keys),
        },
      ]);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Text copied to clipboard");
  };

  return (
    <Fragment>
      <TypographyBodyL>We'll generate a new Nostr key for you.</TypographyBodyL>
      <TypographyBodyL>
        Be sure to save your private key securely!
      </TypographyBodyL>

      {hasGeneratedKeys && (
        <>
          <View style={styles.keysContainer}>
            <TypographyCaptionL>
              Your Keys,{" "}
              <TypographyBodySBold>Your Responsibility</TypographyBodySBold>
            </TypographyCaptionL>
            {keys && (
              <View style={styles.keysWrapper}>
                <View style={styles.keySection}>
                  <View style={styles.keyHeader}>
                    <TypographyBodyS>Public Key (npub)</TypographyBodyS>
                    <Button
                      size="small"
                      variant="text-primary"
                      onPress={() => copyToClipboard(keys.npub)}
                    >
                      Copy
                    </Button>
                  </View>
                  <TypographyBodyS>{keys.npub}</TypographyBodyS>
                </View>

                <View style={styles.keySection}>
                  <View style={styles.keyHeader}>
                    <TypographyBodyS>Private Key (nsec)</TypographyBodyS>
                    <Button
                      size="small"
                      variant="text-primary"
                      onPress={() => copyToClipboard(keys.nsec)}
                    >
                      Copy
                    </Button>
                  </View>
                  <TypographyBodyS>{keys.nsec}</TypographyBodyS>
                </View>
              </View>
            )}
          </View>

          <TypographyCaptionS style={styles.criticalWarning}>
            WARNING: Never share your private key with anyone! Save it somewhere
            secure.
          </TypographyCaptionS>

          <TypographyCaptionS style={styles.criticalWarning}>
            WARNING: If you lose/forget/give away your private key the following
            can happen:
          </TypographyCaptionS>
          <View style={styles.warningList}>
            <TypographyCaptionS style={styles.warningListItem}>
              • Lose your account
            </TypographyCaptionS>
            <TypographyCaptionS style={styles.warningListItem}>
              • Bad actors gain access to your account
            </TypographyCaptionS>
            <TypographyCaptionS style={styles.warningListItem}>
              • Your privacy and anonymity are compromised
            </TypographyCaptionS>
            <TypographyCaptionS style={styles.warningListItem}>
              • You can be watched by bad actors without your knowledge
            </TypographyCaptionS>
            <TypographyCaptionS style={styles.warningListItem}>
              • You can potentially lose your funds (depends on the wallet you
              use)
            </TypographyCaptionS>
          </View>
        </>
      )}

      <SafeAreaView edges={["bottom"]}>
        {hasGeneratedKeys ? (
          <Button onPress={handleOnClickContinue} disabled={!keys}>
            Continue
          </Button>
        ) : (
          <Button onPress={handleOnClickGenerateKeys}>Create Account</Button>
        )}
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: "#666",
  },
  warningText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  keysContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  pulseAnimation: {
    // Note: actual animation would need to be implemented with Animated API
  },
  keysWrapper: {
    gap: 12,
  },
  keySection: {
    marginBottom: 8,
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  copyButton: {
    fontSize: 12,
    color: "#0066cc",
  },
  keyValue: {
    padding: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  keyValueText: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  criticalWarning: {
    fontSize: 12,
    color: Colors.dark.coral,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "left",
  },
  warningList: {
    paddingLeft: 8,
    marginTop: 4,
  },
  warningListItem: {
    fontSize: 12,
    color: Colors.dark.cyan,
    marginBottom: 2,
  },
  primaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "#4ade80", // green-600 equivalent
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 16,
  },
  secondaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 16,
  },
});
