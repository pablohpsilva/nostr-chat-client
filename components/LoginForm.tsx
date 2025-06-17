import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const inputBackground = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "tabIconDefault");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Implement actual login logic here

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // On successful login, navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.formContainer}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Sign in to continue
        </ThemedText>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBackground, color: textColor },
            ]}
            placeholder="Username or Email"
            placeholderTextColor={placeholderColor}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBackground, color: textColor },
            ]}
            placeholder="Password"
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => Alert.alert("Reset Password", "Feature coming soon!")}
        >
          <ThemedText type="link">Forgot Password?</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <ThemedText style={styles.loginButtonText}>
            {isLoading ? "Signing in..." : "Sign In"}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <ThemedText>Don&apos;t have an account? </ThemedText>
          <TouchableOpacity
            onPress={() => Alert.alert("Register", "Feature coming soon!")}
          >
            <ThemedText type="link">Sign Up</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
