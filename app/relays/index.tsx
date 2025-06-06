import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { TextField } from "@/components/ui/TextField";
import {
  H4,
  TypographyBodyL,
  TypographyBodyS,
  TypographyCaptionL,
  TypographyTitle,
} from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { ROUTES } from "@/constants/routes";
import { useRelayStore } from "@/store/relay";

export default function RelayManagementScreen() {
  const router = useRouter();
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const {
    isLoading,
    isSaving,
    error,
    loadRelays,
    addRelay,
    removeRelay,
    getSortedRelays,
    resetToDefaults,
    clearError,
    getActiveRelayCount,
    getTotalRelayCount,
  } = useRelayStore();
  const relayEntries = getSortedRelays();
  const activeRelayCount = getActiveRelayCount();
  const totalRelayCount = getTotalRelayCount();

  // Handle adding new relay with validation and alerts
  const handleAddRelay = useCallback(async () => {
    if (!newRelayUrl.trim()) {
      Alert.alert("Error", "Please enter a relay URL");
      return;
    }

    clearError(); // Clear any previous errors
    const success = await addRelay(newRelayUrl);

    if (success) {
      setNewRelayUrl("");
      return;
    }

    if (error) {
      Alert.alert("Error", error);
    }
  }, [newRelayUrl, addRelay, error, clearError]);

  // Handle removing relay with confirmation
  const handleRemoveRelay = useCallback(
    async (url: string) => {
      const confirmAction = () => {
        removeRelay(url);
      };

      if (Platform.OS === "web") {
        if (window.confirm("Are you sure you want to remove this relay?")) {
          confirmAction();
        }
        return;
      }

      Alert.alert(
        "Remove Relay",
        "Are you sure you want to remove this relay?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: confirmAction },
        ]
      );
    },
    [removeRelay]
  );

  // Handle reset to defaults with confirmation
  const handleResetToDefaults = useCallback(async () => {
    const confirmAction = () => {
      resetToDefaults();
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Reset to default relays? This will remove all custom relays."
        )
      ) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Reset to Defaults",
        "Reset to default relays? This will remove all custom relays.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  }, [resetToDefaults]);

  const handleBackButton = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ROUTES.CHAT);
  };

  useEffect(() => {
    loadRelays();
  }, [loadRelays]);

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.white} />
        </TouchableOpacity>
        <H4>Relays</H4>
      </SafeAreaView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Error Display */}
          {error && (
            <View style={styles.errorCard}>
              <TypographyBodyL style={styles.errorText}>
                {error}
              </TypographyBodyL>
              <TouchableOpacity
                onPress={clearError}
                style={styles.errorCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.dark.coral} />
              </TouchableOpacity>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryCard}>
            <TypographyBodyL style={styles.summaryText}>
              {activeRelayCount} active out of {totalRelayCount} total
            </TypographyBodyL>
            <TypographyCaptionL style={styles.summarySubtext}>
              Active relays are used for reading and writing messages
            </TypographyCaptionL>
          </View>

          {/* Add new relay */}
          <View style={styles.section}>
            <TypographyBodyL style={styles.sectionTitle}>
              Add New Relay
            </TypographyBodyL>
            <View style={styles.addRelayContainer}>
              <TextField
                label="Relay URL"
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChangeText={setNewRelayUrl}
                autoCapitalize="none"
                autoCorrect={false}
                width="80%"
              />
              <Button
                size="small"
                variant="ghost-02"
                onPress={handleAddRelay}
                disabled={isSaving}
              >
                Add
              </Button>
            </View>
          </View>

          {/* Relay list */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TypographyBodyL style={styles.sectionTitle}>
                Your Relays
              </TypographyBodyL>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <TypographyBodyS>Loading relays...</TypographyBodyS>
              </View>
            ) : (
              <View style={styles.relayList}>
                {relayEntries.map(([url, config]) => (
                  <View key={url} style={styles.relayItem}>
                    <View style={styles.relayInfo}>
                      <TypographyBodyL style={styles.relayUrl}>
                        {url}
                      </TypographyBodyL>

                      <View style={styles.relayStatus}>
                        {/* <View style={styles.statusItem}>
                          <TypographyCaptionL>Read:</TypographyCaptionL>
                          <TouchableOpacity
                            style={[
                              styles.statusToggle,
                              config.read && styles.statusToggleActive,
                            ]}
                            onPress={() => toggleRelay(url, "read")}
                            disabled={isSaving}
                          >
                            <Ionicons
                              name={config.read ? "checkmark" : "close"}
                              size={16}
                              color={
                                config.read
                                  ? Colors.dark.lime
                                  : Colors.dark.coral
                              }
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.statusItem}>
                          <TypographyCaptionL>Write:</TypographyCaptionL>
                          <TouchableOpacity
                            style={[
                              styles.statusToggle,
                              config.write && styles.statusToggleActive,
                            ]}
                            onPress={() => toggleRelay(url, "write")}
                            disabled={isSaving}
                          >
                            <Ionicons
                              name={config.write ? "checkmark" : "close"}
                              size={16}
                              color={
                                config.write
                                  ? Colors.dark.lime
                                  : Colors.dark.coral
                              }
                            />
                          </TouchableOpacity>
                        </View> */}
                        {url?.includes("nostream") && (
                          <View style={styles.statusItem}>
                            <Tag
                              tag="Official"
                              color={Colors.dark.primary}
                              width={50}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveRelay(url)}
                      disabled={isSaving}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={Colors.dark.coral}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                <Button
                  variant="ghost-02"
                  size="small"
                  onPress={handleResetToDefaults}
                  disabled={isSaving}
                >
                  Reset to Defaults
                </Button>
              </View>
            )}
          </View>

          {/* Help text */}
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.helpSection}>
              <TypographyTitle>About Relays</TypographyTitle>
              <TypographyCaptionL>
                • You need at least one read and one write relay to use the app.
              </TypographyCaptionL>
              <TypographyCaptionL>
                • Adding more relays provides better redundancy and message
                delivery. Having TOO MANY relays can cause performance issues.
              </TypographyCaptionL>
              <View style={styles.helpItem}>
                <TypographyCaptionL>
                  • We recommend using a maximum of
                </TypographyCaptionL>
                <TypographyCaptionL
                  lightColor={Colors.dark.lime}
                  darkColor={Colors.dark.lime}
                >
                  5 relays.
                </TypographyCaptionL>
              </View>

              {/* <TypographyTitle>About Relays</TypographyTitle>
              <View style={styles.helpItem}>
                <TypographyCaptionL
                  lightColor={Colors.dark.lime}
                  darkColor={Colors.dark.lime}
                >
                  • Read:{" "}
                </TypographyCaptionL>
                <TypographyCaptionL>
                  Allows receiving messages from this relay.
                </TypographyCaptionL>
              </View>
              <View style={styles.helpItem}>
                <TypographyCaptionL
                  lightColor={Colors.dark.lime}
                  darkColor={Colors.dark.lime}
                >
                  • Write:{" "}
                </TypographyCaptionL>
                <TypographyCaptionL>
                  Allows sending messages to this relay
                </TypographyCaptionL>
              </View>
              <View style={styles.helpItem}>
                <TypographyCaptionL>
                  • You need at least one read and one write relay to use the
                  app
                </TypographyCaptionL>
              </View>
              <View style={styles.helpItem}>
                <TypographyCaptionL>
                  • More relays provide better redundancy and message delivery
                </TypographyCaptionL>
              </View> */}
            </View>
          </SafeAreaView>
        </View>
      </ScrollView>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.backgroundPrimary,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: Colors.dark.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundPrimary,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryText: {
    color: Colors.dark.white,
    marginBottom: 4,
  },
  summarySubtext: {
    color: Colors.dark.yellow,
  },
  errorCard: {
    backgroundColor: Colors.dark.coral,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: Colors.dark.white,
    flex: 1,
  },
  errorCloseButton: {
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.dark.white,
    marginBottom: 16,
  },
  addRelayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  addButton: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  relayList: {
    gap: 12,
  },
  relayItem: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  relayInfo: {
    flex: 1,
  },
  relayUrl: {
    color: Colors.dark.white,
    marginBottom: 8,
    fontSize: 14,
  },
  relayStatus: {
    flexDirection: "row",
    gap: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusToggleActive: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  removeButton: {
    padding: 8,
  },
  helpSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  helpItem: {
    display: "flex",
    flexDirection: "row",
    gap: 2,
  },
});
