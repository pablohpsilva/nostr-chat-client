import { Colors } from "@/constants/Colors";
import React, { ComponentType, Suspense, lazy } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Loading fallback component
 */
const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.dark.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

/**
 * Utility to create lazy-loaded components with proper error boundaries
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallbackMessage?: string
) {
  const LazyComponent = lazy(importFn);

  return (props: T) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Higher-order component for lazy loading with custom fallback
 */
export function withLazyLoading<T = {}>(
  Component: ComponentType<T>,
  fallbackMessage?: string
) {
  return (props: T) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Pre-built lazy components for common use cases
 */
export const LazyComponents = {
  // Chat components
  ChatScreen: createLazyComponent(
    () => import("@/app/chat/NIP17/[npub]"),
    "Loading chat..."
  ),

  // Settings and utilities
  SettingsModal: createLazyComponent(
    () => import("@/app/chatlist/components/SettingsModal"),
    "Loading settings..."
  ),

  // Examples and documentation
  NostrExample: createLazyComponent(
    () => import("@/components/Examples/NostrExample"),
    "Loading example..."
  ),
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundPrimary,
    gap: 16,
  },
  loadingText: {
    color: Colors.dark.secondary,
    fontSize: 16,
    textAlign: "center",
  },
});

export default LoadingFallback;
