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
import { NDKProvider } from "@/components/Context";
import { DEFAULT_RELAYS } from "@/constants";
import { DarkTheme, DefaultTheme } from "@/constants/Theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://8e0f3df32b2ebb086ed1e34cee8f4d72@o4509492843577344.ingest.de.sentry.io/4509492844691536',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

export default Sentry.wrap(function RootLayout() {
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
    <NDKProvider relayUrls={Object.keys(DEFAULT_RELAYS)}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* <PolyfillCrypto /> */}
        {/* <NDKHeadless /> */}
        <Stack>
          <Stack.Screen name="features" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="chatlist" options={{ headerShown: false }} />
          <Stack.Screen name="relays" options={{ headerShown: false }} />
          <Stack.Screen name="keys" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat/NIP17/[npub]"
            options={{ headerShown: false }}
          />
          {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </NDKProvider>
  );
});