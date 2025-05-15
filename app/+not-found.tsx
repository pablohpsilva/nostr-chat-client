import { Link, Stack, usePathname, useSegments } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Fragment, useEffect } from "react";

export default function NotFoundScreen() {
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    console.error("Navigation Error:");
    console.error("- Path not found:", pathname);
    console.error("- Segments:", segments);
    console.error("- Stack:", new Error().stack);
  }, [pathname, segments]);

  return (
    <Fragment>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <ThemedText style={styles.path}>Path: {pathname}</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  path: {
    marginTop: 10,
    marginBottom: 20,
  },
});
