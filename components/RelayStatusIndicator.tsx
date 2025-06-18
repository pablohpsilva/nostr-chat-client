import { Colors } from "@/constants/Colors";
import { RelayStatus, useRelayStatus } from "@/hooks/useRelayStatus";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RelayStatusIndicatorProps {
  showDetails?: boolean;
  onPress?: () => void;
}

const getStatusColor = (status: RelayStatus): string => {
  switch (status) {
    case "connected":
      return Colors.dark.lime;
    case "connecting":
      return Colors.dark.yellow;
    case "disconnected":
      return Colors.dark.coral;
    case "error":
      return Colors.dark.coral;
    default:
      return Colors.dark.yellow;
  }
};

const getStatusIcon = (status: RelayStatus): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case "connected":
      return "checkmark-circle";
    case "connecting":
      return "time";
    case "disconnected":
      return "close-circle";
    case "error":
      return "warning";
    default:
      return "help-circle";
  }
};

export function RelayStatusIndicator({
  showDetails = false,
  onPress,
}: RelayStatusIndicatorProps) {
  const {
    relayStatus,
    isLoading,
    connectedCount,
    totalCount,
    healthyCount,
    refreshStatus,
  } = useRelayStatus();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      refreshStatus();
    }
  };

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <Ionicons name="sync" size={16} color={Colors.dark.yellow} />
        <Text style={styles.text}>Checking relays...</Text>
      </TouchableOpacity>
    );
  }

  const relayList = Object.values(relayStatus);
  const overallStatus = connectedCount > 0 ? "connected" : "disconnected";

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.indicator}>
        <Ionicons
          name={getStatusIcon(overallStatus)}
          size={16}
          color={getStatusColor(overallStatus)}
        />
        <Text style={[styles.text, { color: getStatusColor(overallStatus) }]}>
          {connectedCount}/{totalCount} relays
        </Text>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailText}>• Connected: {connectedCount}</Text>
          <Text style={styles.detailText}>• Healthy: {healthyCount}</Text>
          <Text style={styles.detailText}>• Total: {totalCount}</Text>

          {relayList.slice(0, 3).map((relay) => (
            <View key={relay.url} style={styles.relayItem}>
              <Ionicons
                name={getStatusIcon(relay.status)}
                size={12}
                color={getStatusColor(relay.status)}
              />
              <Text style={styles.relayUrl} numberOfLines={1}>
                {relay.url.replace("wss://", "").replace("ws://", "")}
              </Text>
              {relay.ping && <Text style={styles.ping}>{relay.ping}ms</Text>}
            </View>
          ))}

          {relayList.length > 3 && (
            <Text style={styles.moreText}>
              +{relayList.length - 3} more relays
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function RelayStatusBadge() {
  const { connectedCount, totalCount, isLoading } = useRelayStatus();

  if (isLoading) {
    return (
      <View style={styles.badge}>
        <Ionicons name="sync" size={12} color={Colors.dark.yellow} />
      </View>
    );
  }

  const isHealthy = connectedCount > 0;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isHealthy ? Colors.dark.lime : Colors.dark.coral },
      ]}
    >
      <Text style={styles.badgeText}>
        {connectedCount}/{totalCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    marginVertical: 4,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.white,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundPrimary,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.dark.yellow,
  },
  relayItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  relayUrl: {
    fontSize: 11,
    color: Colors.dark.white,
    flex: 1,
  },
  ping: {
    fontSize: 10,
    color: Colors.dark.yellow,
  },
  moreText: {
    fontSize: 11,
    color: Colors.dark.yellow,
    fontStyle: "italic",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.dark.coral,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.dark.white,
  },
});
