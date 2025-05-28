import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { privateKeyFromSeedWords } from "nostr-tools/nip06";
import React, { Fragment, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { KeysType } from "../types";

interface ImportKeyAdvancedFormProps {
  handleLogin: (keys: KeysType) => Promise<void>;
  onClickBack: () => void;
}

export const ImportKeyAdvancedForm: React.FC<ImportKeyAdvancedFormProps> = ({
  handleLogin,
  onClickBack,
}) => {
  const [passphrase, setPassphrase] = useState("");
  const [seedWords, setSeedWords] = useState<string[]>([]);
  const [seedWordsText, setSeedWordsText] = useState("");

  const seedWordsIsSet = seedWords.length >= 4;

  const handleOnChangeSeedWords = (value: string) => {
    setSeedWordsText(value);
    if (value.includes(" ")) {
      setSeedWords(value.split(" ").filter((word) => word.trim() !== ""));
      return;
    }

    setSeedWords([]);
  };

  const handleOnChangePassphrase = (value: string) => {
    setPassphrase(value);
  };

  const handleOnClickLogin = () => {
    if (seedWords.length === 0) {
      Alert.alert("Error", "Please enter valid seed words");
      return;
    }

    try {
      const privateKey = passphrase
        ? privateKeyFromSeedWords(seedWords.join(" "), passphrase)
        : privateKeyFromSeedWords(seedWords.join(" "));
      const signer = new NDKPrivateKeySigner(privateKey);

      handleLogin({
        npub: signer.npub as `npub${string}`,
        nsec: signer.nsec as `nsec${string}`,
        privateKey: signer.privateKey,
        publicKey: signer.pubkey,
      });
    } catch (error) {
      Alert.alert("Error", "Invalid seed words or passphrase");
    }
  };

  return (
    <Fragment>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Seed words</Text>
        <TextInput
          style={styles.input}
          placeholder="Seed words separated by spaces..."
          onChangeText={handleOnChangeSeedWords}
          value={seedWordsText}
          secureTextEntry
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Passphrase (if you have one)</Text>
        <TextInput
          style={styles.input}
          placeholder="Passphrase..."
          onChangeText={handleOnChangePassphrase}
          value={passphrase}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        onPress={handleOnClickLogin}
        disabled={!seedWordsIsSet}
        style={[styles.primaryButton, !seedWordsIsSet && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClickBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "white",
    marginTop: 4,
  },
  primaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "#3b82f6", // blue-600 equivalent
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 16,
  },
});
