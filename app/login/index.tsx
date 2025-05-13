import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { useNDKSessionLogin } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { ROUTES } from "@/constants/routes";
import { useThemeColor } from "@/hooks/useThemeColor";
// import { getKeys } from "@/libs/local-storage";
import { APP_NAME } from "@/constants";
import { CreateAccountForm } from "./components/CreateAccountForm";
import { CreateAdvancedAccountForm } from "./components/CreateAdvancedAccountForm";
import { ImportKeyAdvancedForm } from "./components/ImportKeyAdvancedForm";
import { ImportKeyForm } from "./components/ImportKeyForm";
import { LoginForm } from "./components/LoginForm";
import { KeysType, LoginMode } from "./types";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>(LoginMode.LOGIN);
  const login = useNDKSessionLogin();
  const backgroundColor = useThemeColor({}, "background");

  const handleLogin = async (keys: KeysType) => {
    const signer = new NDKPrivateKeySigner(keys.nsec);

    // await saveSigner(keys);

    await login(signer);
    // Redirect to the app after successful login
    router.push("/chatlist");
  };

  const handleCreateAccount = async (keys: KeysType) => {
    // await saveSigner(keys);

    const signer = new NDKPrivateKeySigner(keys.nsec);
    await login(signer);

    // Redirect to the app after successful login
    router.replace(ROUTES.CHAT);
  };

  const handleOnClickBack = () => {
    setMode(LoginMode.LOGIN);
  };

  const renderFormBasedOnMode = () => {
    switch (mode) {
      case LoginMode.LOGIN:
        return <LoginForm setMode={setMode} />;
      case LoginMode.CREATE:
        return (
          <CreateAccountForm
            onCreateAccount={handleCreateAccount}
            onClickBack={handleOnClickBack}
          />
        );
      case LoginMode.CREATE_ADVANCED:
        return (
          <CreateAdvancedAccountForm
            onCreateAccount={handleCreateAccount}
            onClickBack={handleOnClickBack}
          />
        );
      case LoginMode.IMPORT:
        return (
          <ImportKeyForm
            handleLogin={handleLogin}
            onClickBack={handleOnClickBack}
          />
        );
      case LoginMode.IMPORT_ADVANCED:
        return (
          <ImportKeyAdvancedForm
            handleLogin={handleLogin}
            onClickBack={handleOnClickBack}
          />
        );
      default:
        return <LoginForm setMode={setMode} />;
    }
  };

  // useEffect(() => {
  //   (async () => {
  //     const keys = await getKeys();
  //     if (keys) {
  //       const signer = new NDKPrivateKeySigner(keys.nsec);
  //       await login(signer);
  //       // Redirect to the app after successful login
  //       router.replace(ROUTES.CHAT);
  //     }
  //   })();
  // }, []);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>{APP_NAME}</Text>
                  <Text style={styles.subtitle}>
                    {mode === LoginMode.LOGIN &&
                      "Sign in with your Nostr key or create one"}
                    {mode === LoginMode.CREATE && "Create a new Nostr account"}
                    {mode === LoginMode.CREATE_ADVANCED &&
                      "Create a new Nostr account with advanced options"}
                    {mode === LoginMode.IMPORT &&
                      "Import your existing Nostr key"}
                    {mode === LoginMode.IMPORT_ADVANCED &&
                      "Import your existing Nostr key with advanced options"}
                  </Text>
                </View>

                <View style={styles.formWrapper}>
                  {renderFormBasedOnMode()}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formWrapper: {
    marginTop: 24,
  },
});
