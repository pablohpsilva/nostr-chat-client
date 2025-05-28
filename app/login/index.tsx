import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { useNDKSessionLogin } from "@nostr-dev-kit/ndk-hooks";
import { Stack, useRouter } from "expo-router";
import { Fragment, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
// import { getKeys } from "@/libs/local-storage";
import { H2, TypographyBodyL } from "@/components/ui/Typography";
import { APP_NAME } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
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
      <SafeAreaView edges={["top"]} style={styles.wrapper}>
        <Button variant="small-close" size="unset" onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Button>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.header}>
            <H2>Welcome to {APP_NAME}</H2>
            <TypographyBodyL style={styles.subtitle}>
              {mode === LoginMode.LOGIN &&
                "Sign in with your Nostr key or create one"}
              {mode === LoginMode.CREATE && "Create a new Nostr account"}
              {mode === LoginMode.CREATE_ADVANCED &&
                "Create a new Nostr account with advanced options"}
              {mode === LoginMode.IMPORT && "Import your existing Nostr key"}
              {mode === LoginMode.IMPORT_ADVANCED &&
                "Import your existing Nostr key with advanced options"}
            </TypographyBodyL>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {renderFormBasedOnMode()}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 24,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 800,
    marginHorizontal: "auto",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 800,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
    width: "100%",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    gap: 16,
    marginHorizontal: "auto",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  keyboardAvoidingView: {
    width: "100%",
  },
  scrollContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 16,
    marginHorizontal: "auto",
  },
});
