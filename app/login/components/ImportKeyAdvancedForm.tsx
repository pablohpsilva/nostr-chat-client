import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk-mobile";
import { privateKeyFromSeedWords } from "nostr-tools/nip06";
import React, { Fragment, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SafeAreaView } from "react-native-safe-area-context";
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
        <TextField
          label="Seed words"
          placeholder="Seed words separated by spaces..."
          onChangeText={handleOnChangeSeedWords}
          value={seedWordsText}
          secureTextEntry
        />

        <TextField
          label="Passphrase (if you have one)"
          placeholder="Passphrase..."
          onChangeText={handleOnChangePassphrase}
          value={passphrase}
          secureTextEntry
        />
      </View>

      <SafeAreaView edges={["bottom"]}>
        <Button
          onPress={handleOnClickLogin}
          disabled={!seedWordsIsSet}
          // style={[styles.primaryButton, !seedWordsIsSet && styles.disabledButton]}
        >
          Login
        </Button>
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
    width: "100%",
  },
});
