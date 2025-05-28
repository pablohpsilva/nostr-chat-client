import React, { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";
import { LoginMode } from "../types";

interface LoginFormProps {
  setMode: (mode: LoginMode) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ setMode }) => {
  return (
    <Fragment>
      <Button variant="rounded" onPress={() => setMode(LoginMode.IMPORT)}>
        Sign via Nostr Key
      </Button>

      <Button
        variant="rounded"
        onPress={() => setMode(LoginMode.IMPORT_ADVANCED)}
      >
        Sign via Seed Words
      </Button>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerTextContainer}>
          <Text style={styles.dividerText}>Or</Text>
        </View>
      </View>

      <Button variant="ghost-02" onPress={() => setMode(LoginMode.CREATE)}>
        Create New Account
      </Button>

      <Button
        variant="text-white"
        onPress={() => setMode(LoginMode.CREATE_ADVANCED)}
        size="small"
      >
        or Create New Advanced Account
      </Button>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  primaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "#3b82f6", // blue-600 equivalent
    borderRadius: 6,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  dividerContainer: {
    position: "relative",
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    width: "100%",
  },
  dividerLine: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "#e5e7eb", // gray-300 equivalent
  },
  dividerTextContainer: {
    backgroundColor: Colors.light.backgroundPrimary,
    paddingHorizontal: 8,
  },
  dividerText: {
    fontSize: 14,
    color: "#6b7280", // gray-500 equivalent
    backgroundColor: "transparent",
  },
  secondaryButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db", // gray-300 equivalent
    borderRadius: 6,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#374151", // gray-700 equivalent
    fontWeight: "500",
    fontSize: 16,
  },
  tertiaryButton: {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  tertiaryButtonText: {
    color: "#374151", // gray-700 equivalent
    fontSize: 14,
  },
});
