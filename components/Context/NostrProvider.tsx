import { useNostrTools } from "@/hooks/nostr";
import React, { createContext, ReactNode, useContext, useEffect } from "react";

// Create the context
const NostrContext = createContext<
  ReturnType<typeof useNostrTools> | undefined
>(undefined);

// Provider props
interface NostrProviderProps {
  children: ReactNode;
  relayUrls?: string[];
  autoInitialize?: boolean;
}

// Provider component
export function NostrProvider({
  children,
  relayUrls,
  autoInitialize = true,
}: NostrProviderProps) {
  const nostrTools = useNostrTools();

  // Auto-initialize the connection when the provider mounts
  useEffect(() => {
    if (autoInitialize && !nostrTools.isInitialized) {
      nostrTools.initialize(relayUrls).catch(console.error);
    }
  }, [autoInitialize, nostrTools.isInitialized, relayUrls]);

  return (
    <NostrContext.Provider value={nostrTools}>{children}</NostrContext.Provider>
  );
}

// Hook to use the nostr context
export function useNostr() {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error("useNostr must be used within a NostrProvider");
  }
  return context;
}

// Export the context for advanced use cases
export { NostrContext };
