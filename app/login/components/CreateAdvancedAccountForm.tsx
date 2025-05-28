import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import * as Clipboard from "expo-clipboard";
import { generateSeedWords, privateKeyFromSeedWords } from "nostr-tools/nip06";
import React, { Fragment, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
      handleCreateAccount();
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
      <Text style={styles.description}>
        Be sure to save your <Text style={styles.bold}>seed words</Text> and
        your <Text style={styles.bold}>passphrase</Text> securely!
      </Text>

      <Text style={[styles.label, styles.pulseAnimation]}>
        Your Keys, <Text style={styles.bold}>Your Responsibility</Text>
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Passphrase</Text>
        <TextInput
          placeholder="Enter your passphrase"
          style={styles.textInput}
          onChangeText={handleOnPassphraseChange}
          value={passphrase}
          secureTextEntry
        />
        <Text style={styles.helperText}>
          {passphrase.length === 0 && "Minimum 8 characters"}
          {passphrase.length > 0 &&
            passphrase.length < 8 &&
            `${8 - passphrase.length} characters missing`}
        </Text>
      </View>

      {seedWords.length > 0 && (
        <>
          <View style={styles.keyHeader}>
            <Text style={styles.keyLabel}>Seed words</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(seedWords.join(" "))}
            >
              <Text style={styles.copyButton}>Copy to clipboard</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.seedWordsGrid}>
            {seedWords.map((word, index) => (
              <View key={`${word}-${index}`} style={styles.seedWordItem}>
                <Text style={styles.seedWordText}>{word}</Text>
              </View>
            ))}
          </View>

          {keys && (
            <View style={styles.keysWrapper}>
              <View style={styles.keySection}>
                <View style={styles.keyHeader}>
                  <Text style={styles.keyLabel}>Public Key (npub)</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(keys.npub)}>
                    <Text style={styles.copyButton}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal style={styles.keyValue}>
                  <Text style={styles.keyValueText}>{keys.npub}</Text>
                </ScrollView>
              </View>

              <View style={styles.keySection}>
                <View style={styles.keyHeader}>
                  <Text style={styles.keyLabel}>Private Key (nsec)</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(keys.nsec)}>
                    <Text style={styles.copyButton}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal style={styles.keyValue}>
                  <Text style={styles.keyValueText}>{keys.nsec}</Text>
                </ScrollView>
              </View>
            </View>
          )}

          <View style={styles.regenerateButtonContainer}>
            <TouchableOpacity
              onPress={handleCreateAccount}
              disabled={passphrase.length < 8}
              style={[
                styles.regenerateButton,
                passphrase.length < 8 && styles.disabledButton,
              ]}
            >
              <Text style={styles.regenerateButtonText}>
                Generate seed words again
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {seedWords.length === 0 && (
        <TouchableOpacity
          onPress={handleCreateAccount}
          disabled={passphrase.length < 8}
          style={[
            styles.primaryButton,
            passphrase.length < 8 && styles.disabledButton,
          ]}
        >
          <Text style={styles.buttonText}>Generate seed words</Text>
        </TouchableOpacity>
      )}

      {seedWords.length !== 0 && (
        <TouchableOpacity
          onPress={onClickContinue}
          style={styles.primaryButton}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      <TouchableOpacity onPress={onClickBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  pulseAnimation: {
    // Note: actual animation would need to be implemented with Animated API
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(0,0,0,0.5)",
  },
  textInput: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
  },
  keyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(0,0,0,0.5)",
  },
  copyButton: {
    fontSize: 12,
    color: "#0066cc",
  },
  seedWordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seedWordItem: {
    width: "31%",
    padding: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  seedWordText: {
    fontFamily: "monospace",
    fontSize: 12,
    textAlign: "center",
  },
  keysWrapper: {
    gap: 12,
    marginTop: 8,
  },
  keySection: {
    marginBottom: 8,
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
  regenerateButtonContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  regenerateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#0066cc",
    borderRadius: 6,
  },
  regenerateButtonText: {
    fontSize: 12,
    color: "#0066cc",
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
