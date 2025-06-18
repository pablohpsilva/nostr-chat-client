import { useNDK } from "@/components/Context";
import { DEFAULT_RELAYS } from "@/constants";
import { RelayConfig, RelayDict } from "@/constants/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type RelayStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error"
  | "unknown";

export type RelayStatusInfo = {
  url: string;
  status: RelayStatus;
  config: RelayConfig;
  lastConnected?: number;
  lastError?: string;
  ping?: number;
  isHealthy: boolean;
};

export type RelayStatusMap = Record<string, RelayStatusInfo>;

interface UseRelayStatusReturn {
  relayStatus: RelayStatusMap;
  isLoading: boolean;
  connectedCount: number;
  totalCount: number;
  healthyCount: number;
  checkRelayStatus: (url: string) => Promise<RelayStatusInfo>;
  checkAllRelays: () => Promise<void>;
  refreshStatus: () => void;
}

export function useRelayStatus(customRelays?: RelayDict): UseRelayStatusReturn {
  const { ndk } = useNDK();
  const [relayStatus, setRelayStatus] = useState<RelayStatusMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<number>();

  // Use custom relays if provided, otherwise use DEFAULT_RELAYS
  const relaysToCheck = customRelays || DEFAULT_RELAYS;

  const checkRelayConnection = useCallback(
    async (url: string): Promise<RelayStatus> => {
      if (!ndk) return "unknown";

      try {
        // Check if relay is in NDK's connected relays
        const connectedRelays = ndk.pool?.connectedRelays();
        if (connectedRelays) {
          const isConnected = Array.from(connectedRelays).some(
            (relay) => relay.url === url
          );
          if (isConnected) return "connected";
        }

        // Check if relay is in NDK's relay pool at all
        const poolRelay = ndk.pool?.relays.get(url);
        if (poolRelay) {
          // Check the relay's connection status
          if (poolRelay.connectivity?.status === 1) return "connected";
          if (poolRelay.connectivity?.status === 0) return "connecting";
          if (poolRelay.connectivity?.status === 3) return "error";
        }

        return "disconnected";
      } catch (error) {
        console.error(`Error checking relay connection for ${url}:`, error);
        return "error";
      }
    },
    [ndk]
  );

  const pingRelay = useCallback(
    async (url: string): Promise<number | undefined> => {
      try {
        const startTime = Date.now();

        // Simple WebSocket connection test
        return new Promise((resolve) => {
          const ws = new WebSocket(url);
          const timeout = setTimeout(() => {
            ws.close();
            resolve(undefined);
          }, 5000);

          ws.onopen = () => {
            const pingTime = Date.now() - startTime;
            clearTimeout(timeout);
            ws.close();
            resolve(pingTime);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            resolve(undefined);
          };
        });
      } catch (error) {
        return undefined;
      }
    },
    []
  );

  const checkRelayStatus = useCallback(
    async (url: string): Promise<RelayStatusInfo> => {
      const config = relaysToCheck[url] || { read: true, write: true };

      try {
        const [status, ping] = await Promise.all([
          checkRelayConnection(url),
          pingRelay(url),
        ]);

        const statusInfo: RelayStatusInfo = {
          url,
          status,
          config,
          ping,
          isHealthy:
            status === "connected" && ping !== undefined && ping < 2000,
          lastConnected: status === "connected" ? Date.now() : undefined,
        };

        return statusInfo;
      } catch (error) {
        return {
          url,
          status: "error",
          config,
          isHealthy: false,
          lastError: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [relaysToCheck, checkRelayConnection, pingRelay]
  );

  const checkAllRelays = useCallback(async () => {
    if (!ndk) return;

    setIsLoading(true);

    try {
      const relayUrls = Object.keys(relaysToCheck);
      const statusPromises = relayUrls.map((url) => checkRelayStatus(url));
      const statuses = await Promise.all(statusPromises);

      const statusMap: RelayStatusMap = {};
      statuses.forEach((status) => {
        statusMap[status.url] = status;
      });

      setRelayStatus(statusMap);
    } catch (error) {
      console.error("Error checking all relay statuses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [ndk, relaysToCheck, checkRelayStatus]);

  const refreshStatus = useCallback(() => {
    checkAllRelays();
  }, [checkAllRelays]);

  // Initial check and setup periodic refresh
  useEffect(() => {
    if (ndk) {
      checkAllRelays();

      // Set up periodic status check every 30 seconds
      intervalRef.current = setInterval(() => {
        checkAllRelays();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ndk, checkAllRelays]);

  // Listen for NDK connection events
  useEffect(() => {
    if (!ndk) {
      return;
    }

    const handleRelayConnect = () => {
      // Refresh status when a relay connects
      setTimeout(() => checkAllRelays(), 1000);
    };

    const handleRelayDisconnect = () => {
      // Refresh status when a relay disconnects
      setTimeout(() => checkAllRelays(), 1000);
    };

    // If NDK exposes relay events, listen to them
    ndk.pool?.on?.("relay:connect", handleRelayConnect);
    ndk.pool?.on?.("relay:disconnect", handleRelayDisconnect);

    return () => {
      ndk.pool?.off?.("relay:connect", handleRelayConnect);
      ndk.pool?.off?.("relay:disconnect", handleRelayDisconnect);
    };
  }, [ndk, checkAllRelays]);

  // Calculate summary statistics
  const relayStatusArray = Object.values(relayStatus);
  const connectedCount = relayStatusArray.filter(
    (r) => r.status === "connected"
  ).length;
  const totalCount = relayStatusArray.length;
  const healthyCount = relayStatusArray.filter((r) => r.isHealthy).length;

  return {
    relayStatus,
    isLoading,
    connectedCount,
    totalCount,
    healthyCount,
    checkRelayStatus,
    checkAllRelays,
    refreshStatus,
  };
}
