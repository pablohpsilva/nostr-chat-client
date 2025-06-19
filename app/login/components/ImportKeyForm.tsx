import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk-mobile";
import React, { Fragment, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeysType } from "../types";

interface ImportKeyFormProps {
  handleLogin: (keys: KeysType) => Promise<void>;
  onClickBack: () => void;
}

export const ImportKeyForm: React.FC<ImportKeyFormProps> = ({
  handleLogin,
  onClickBack,
}) => {
  const [nsec, setNsec] = useState<string>();
  // User 1
  // "60569c58045299f924661381db8c71eb19d5f8de52b99e102a066e0dd9e170d9"
  // User 2
  // "97b05a0e944a3cddc6b9f89482e2638f32810cbeabd1235ec2c53dc3c676f8f0"
  // "nsec1dwwauw7mvj8klywn5wcsep7hm29tyvfmmp3e55qanzr3s6g5y3hstpmts4"
  // User 3
  // "nsec1dwwauw7mvj8klywn5wcsep7hm29tyvfmmp3e55qanzr3s6g5y3hstpmts4"

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
    <Fragment>
      <View style={styles.formGroup}>
        <TextField
          label="Your nsec private key"
          value={nsec}
          onChangeText={handleOnChangeNsec}
          secureTextEntry
        />

        <SafeAreaView edges={["bottom"]}>
          <Button onPress={handleOnClickLogin} disabled={!nsec}>
            Login
          </Button>
        </SafeAreaView>
      </View>
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
