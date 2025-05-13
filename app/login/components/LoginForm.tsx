import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { LoginMode } from "../types";

interface LoginFormProps {
  setMode: (mode: LoginMode) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ setMode }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setMode(LoginMode.IMPORT)}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Sign via Nostr Key</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(LoginMode.IMPORT_ADVANCED)}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Sign via Seed Words</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerTextContainer}>
          <Text style={styles.dividerText}>Or</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setMode(LoginMode.CREATE)}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Create New Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(LoginMode.CREATE_ADVANCED)}
        style={styles.tertiaryButton}
      >
        <Text style={styles.tertiaryButtonText}>
          or Create New Advanced Account
        </Text>
      </TouchableOpacity>
    </View>
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
  },
  dividerLine: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "#e5e7eb", // gray-300 equivalent
  },
  dividerTextContainer: {
    backgroundColor: "white",
    paddingHorizontal: 8,
  },
  dividerText: {
    fontSize: 14,
    color: "#6b7280", // gray-500 equivalent
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
