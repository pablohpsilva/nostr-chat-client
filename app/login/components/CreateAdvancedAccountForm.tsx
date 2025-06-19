import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk-mobile";
import * as Clipboard from "expo-clipboard";
import { generateSeedWords, privateKeyFromSeedWords } from "nostr-tools/nip06";
import React, { Fragment, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import {
  TypographyBodyL,
  TypographyBodyS,
  TypographyBodySBold,
  TypographyCaptionL,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeysType } from "../types";

interface CreateAdvancedAccountFormProps {
  onCreateAccount: (keys: KeysType) => Promise<void>;
  onClickBack: () => void;
}

export const CreateAdvancedAccountForm: React.FC<
  CreateAdvancedAccountFormProps
> = ({ onCreateAccount, onClickBack }) => {
  const [passphrase, setPassphrase] = useState("");
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [keys, setKeys] = useState<KeysType | null>({
    npub: "" as `npub${string}`,
    nsec: "" as `nsec${string}`,
    privateKey: "",
    publicKey: "",
  });

  const handleCreateAccount = async () => {
    const seedWordsString = generateSeedWords();
    setSeedWords(seedWordsString.split(" "));
    const privateKey = privateKeyFromSeedWords(seedWordsString, passphrase);
    const signer = new NDKPrivateKeySigner(privateKey);

    setKeys({
      npub: signer.npub as `npub${string}`,
      nsec: signer.nsec as `nsec${string}`,
      privateKey: signer.privateKey,
      publicKey: signer.pubkey,
    });
  };

  const onClickContinue = () => {
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

  const handleOnPassphraseChange = (value: string) => {
    setPassphrase(value);
    if (value.length >= 8) {
      setLoading(true);
      handleCreateAccount();
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Text copied to clipboard");
  };

  useEffect(() => {
    return () => {
      setKeys(null);
      setPassphrase("");
      setSeedWords([]);
    };
  }, []);

  return (
    <Fragment>
      <TypographyBodyL>
        Be sure to save your <TypographyBodyL>seed words</TypographyBodyL> and
        your <TypographyBodyL>passphrase</TypographyBodyL> securely!
      </TypographyBodyL>

      <TypographyCaptionL>
        Your Keys,{" "}
        <TypographyBodySBold>Your Responsibility</TypographyBodySBold>
      </TypographyCaptionL>

      <View style={styles.formGroup}>
        <TextField
          label="Passphrase"
          placeholder="Enter your passphrase"
          onChangeText={handleOnPassphraseChange}
          value={passphrase}
          secureTextEntry
        />
        <TypographyCaptionL style={{ textAlign: "center" }}>
          {passphrase.length === 0 && "Minimum 8 characters"}
          {passphrase.length > 0 &&
            passphrase.length < 8 &&
            `${8 - passphrase.length} characters missing`}
        </TypographyCaptionL>
      </View>

      {passphrase.length >= 8 && (
        <>
          <View style={styles.keySection}>
            <View style={styles.keyHeader}>
              <TypographyBodyS>Seed words</TypographyBodyS>
              <Button
                size="small"
                variant="text-primary"
                onPress={() => copyToClipboard(seedWords.join(" "))}
              >
                Copy
              </Button>
            </View>
          </View>

          <View style={styles.seedWordsGrid}>
            {seedWords.map((word, index) => (
              <View key={`${word}-${index}`} style={styles.seedWordItem}>
                <TypographyCaptionL style={{ textAlign: "center" }}>
                  {loading ? "" : word}
                </TypographyCaptionL>
              </View>
            ))}
          </View>

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
                <TypographyBodyS style={styles.keyValueText}>
                  {keys.npub}
                </TypographyBodyS>
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
                <TypographyBodyS style={styles.keyValueText}>
                  {keys.nsec}
                </TypographyBodyS>
              </View>
            </View>
          )}

          <View style={styles.regenerateButtonContainer}>
            <Button
              onPress={handleCreateAccount}
              disabled={passphrase.length < 8 || loading}
              variant="text-primary"
            >
              Generate seed words again
            </Button>
          </View>
        </>
      )}

      {seedWords.length === 0 && (
        <Button
          onPress={handleCreateAccount}
          disabled={passphrase.length < 8 || loading}
        >
          Generate seed words
        </Button>
      )}

      <SafeAreaView edges={["bottom"]}>
        {seedWords.length !== 0 && (
          <Button onPress={onClickContinue}>Continue</Button>
        )}
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    gap: 4,
    width: "100%",
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    width: "100%",
  },
  seedWordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seedWordItem: {
    width: "31%",
    padding: 8,
    backgroundColor: Colors.dark.deactive,
    borderWidth: 1,
    borderColor: Colors.dark.deactive,
    borderRadius: 8,
  },
  keysWrapper: {
    gap: 12,
    marginTop: 8,
  },
  keySection: {
    marginBottom: 8,
  },
  keyValueText: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  regenerateButtonContainer: {
    alignItems: "center",
    marginTop: 4,
  },
});
