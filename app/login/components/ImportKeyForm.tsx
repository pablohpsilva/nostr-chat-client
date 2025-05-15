import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { KeysType } from "../types";

interface ImportKeyFormProps {
  handleLogin: (keys: KeysType) => Promise<void>;
  onClickBack: () => void;
}

export const ImportKeyForm: React.FC<ImportKeyFormProps> = ({
  handleLogin,
  onClickBack,
}) => {
  const [nsec, setNsec] = useState(
    "60569c58045299f924661381db8c71eb19d5f8de52b99e102a066e0dd9e170d9"
    // "nsec1dwwauw7mvj8klywn5wcsep7hm29tyvfmmp3e55qanzr3s6g5y3hstpmts4"
  );

  const handleOnChangeNsec = (value: string) => {
    setNsec(value);
  };

  const handleOnClickLogin = () => {
    if (!nsec) {
      Alert.alert("Error", "Please enter your nsec private key");
      return;
    }

    try {
      const signer = new NDKPrivateKeySigner(nsec);

      handleLogin({
        npub: signer.npub as `npub${string}`,
        nsec: signer.nsec as `nsec${string}`,
        privateKey: signer.privateKey,
        publicKey: signer.pubkey,
      });
    } catch (error) {
      Alert.alert("Error", "Invalid nsec private key");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Your nsec private key</Text>
        <TextInput
          style={styles.input}
          value={nsec}
          onChangeText={handleOnChangeNsec}
          placeholder="nsec1..."
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        onPress={handleOnClickLogin}
        disabled={!nsec}
        style={[styles.primaryButton, !nsec && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClickBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
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
