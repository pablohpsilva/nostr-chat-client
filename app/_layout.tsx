// // this is needed to polyfill TextDecoder which nostr-tools uses
// import "fast-text-encoding";

// // this is needed to polyfill crypto.getRandomValues which nostr-tools uses
import "react-native-get-random-values";

// // this is needed to polyfill crypto.subtle which nostr-tools uses
import "react-native-webview-crypto";

import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import "react-native-reanimated";
// import PolyfillCrypto from "react-native-webview-crypto";

// import NDKHeadless from "@/components/NDKHeadless";
import { UnifiedNostrProvider } from "@/components/Context/UnifiedNostrProvider";
import { DEFAULT_RELAYS } from "@/constants";
import { DarkTheme, DefaultTheme } from "@/constants/Theme";
import { useColorScheme } from "@/hooks/useColorScheme";

// Disable all LogBox notifications
if (__DEV__) {
  console.log("ignoreAllLogs");
  console.log("ignoreAllLogs");
  console.log("ignoreAllLogs");
  console.log("ignoreAllLogs");
  console.log("ignoreAllLogs");
  LogBox.ignoreAllLogs(true);
}

// Alternative: Ignore specific warnings only (uncomment and modify as needed)
// LogBox.ignoreLogs([
//   'Warning: componentWillReceiveProps',
//   'Warning: componentWillMount',
//   'Module RCTImageLoader',
//   'Non-serializable values were found in the navigation state',
//   'VirtualizedLists should never be nested',
//   'Setting a timer for a long period of time',
// ]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // Poppins fonts
    "Poppins-Regular": require("../assets/fonts/Poppins/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins/Poppins-Bold.ttf"),
    // Inter fonts
    "Inter-Regular": require("../assets/fonts/Inter/static/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter/static/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter/static/Inter_18pt-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter/static/Inter_18pt-Bold.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <UnifiedNostrProvider
      relayUrls={Object.keys(DEFAULT_RELAYS)}
      autoConnect={true}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* <PolyfillCrypto /> */}
        {/* <NDKHeadless /> */}
        <Stack>
          <Stack.Screen name="features" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="chatlist" options={{ headerShown: false }} />
          <Stack.Screen name="relays" options={{ headerShown: false }} />
          <Stack.Screen name="keys" options={{ headerShown: false }} />
          <Stack.Screen name="nostrsample" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat/NIP17/[npub]"
            options={{ headerShown: false }}
          />
          {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UnifiedNostrProvider>
  );
}
