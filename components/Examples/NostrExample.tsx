import {
  useNostrDecryption,
  useNostrEvents,
  useNostrGlobalEvents,
  useNostrPublish,
  useNostrPublishNip17,
  useNostrSubscription,
  useNostrTools,
} from "@/hooks/useNostrTools";
import { NostrEvent, NostrFilter } from "@/interal-lib/ndk";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export function NostrExample() {
  // Main nostr connection
  const {
    isInitialized,
    isConnected,
    currentUser,
    relays,
    isLoading,
    error,
    isLoggedIn,
    initialize,
    login,
    generateAccount,
    logout,
    addRelay,
    removeRelay,
    clearError,
  } = useNostrTools();

  // Publishing hooks
  const {
    isPublishing,
    error: publishError,
    sendTextNote,
    sendDirectMessage,
    updateProfile,
    clearError: clearPublishError,
  } = useNostrPublish();

  const {
    isPublishing: isPublishingNip17,
    error: publishErrorNip17,
    sendMessage,
    clearError: clearPublishErrorNip17,
  } = useNostrPublishNip17();

  // Event fetching
  const {
    isLoading: isLoadingEvents,
    error: eventsError,
    getEvents,
    getUserProfile,
    clearError: clearEventsError,
  } = useNostrEvents();

  // Decryption
  const {
    isDecrypting,
    error: decryptError,
    decryptDirectMessage,
    clearError: clearDecryptError,
  } = useNostrDecryption();

  // Local state
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [nip17Content, setNip17Content] = useState("");
  const [dmRecipient, setDmRecipient] = useState("");
  const [dmContent, setDmContent] = useState("");
  const [relayUrl, setRelayUrl] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileAbout, setProfileAbout] = useState("");
  const [recentEvents, setRecentEvents] = useState<NostrEvent[]>([]);

  // Subscribe to global timeline (kind 1 events)
  const timelineFilters: NostrFilter[] = [
    {
      kinds: [1],
      limit: 20,
    },
  ];

  const { events: timelineEvents, isLoading: isLoadingTimeline } =
    useNostrSubscription(timelineFilters, {
      enabled: isLoggedIn,
      onEvent: (event) => {
        console.log("New timeline event:", event.content.substring(0, 50));
      },
    });

  // Subscribe to direct messages for the current user
  const dmFilters: NostrFilter[] = currentUser
    ? [
        {
          kinds: [4],
          "#p": [currentUser.publicKey],
          limit: 10,
        },
      ]
    : [];

  const { events: dmEvents } = useNostrSubscription(dmFilters, {
    enabled: isLoggedIn,
    onEvent: async (event) => {
      try {
        const decryptedContent = await decryptDirectMessage(event);
        console.log("New DM:", decryptedContent);
      } catch (error) {
        console.error("Failed to decrypt DM:", error);
      }
    },
  });

  // Global event listener
  useNostrGlobalEvents((event) => {
    setRecentEvents((prev) => [event, ...prev.slice(0, 9)]); // Keep last 10 events
  }, isLoggedIn);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Handle login
  const handleLogin = async () => {
    if (!privateKeyInput.trim()) {
      Alert.alert("Error", "Please enter a private key");
      return;
    }

    try {
      await login(privateKeyInput.trim());
      setPrivateKeyInput("");
      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Login failed"
      );
    }
  };

  // Handle generate account
  const handleGenerateAccount = async () => {
    try {
      const user = await generateAccount();
      Alert.alert(
        "Account Generated",
        `Your new account:\nnsec: ${user.nsec}\nPlease save this securely!`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate account"
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Success", "Logged out successfully!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Logout failed"
      );
    }
  };

  // Handle send note
  const handleSendNote = async () => {
    if (!noteContent.trim()) {
      Alert.alert("Error", "Please enter note content");
      return;
    }

    try {
      await sendTextNote(noteContent.trim());
      setNoteContent("");
      Alert.alert("Success", "Note sent!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send note"
      );
    }
  };

  // Handle send DM
  const handleSendDM = async () => {
    if (!dmRecipient.trim() || !dmContent.trim()) {
      Alert.alert("Error", "Please enter recipient and message");
      return;
    }

    try {
      await sendDirectMessage(dmRecipient.trim(), dmContent.trim());
      setDmContent("");
      Alert.alert("Success", "Direct message sent!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send DM"
      );
    }
  };

  // Handle send note
  const handleSendNip17 = async () => {
    if (!nip17Content.trim()) {
      Alert.alert("Error", "Please enter note content");
      return;
    }

    try {
      await sendMessage(nip17Content.trim());
      setNip17Content("");
      Alert.alert("Success", "Nip17 sent!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send Nip17"
      );
    }
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      await updateProfile({
        name: profileName.trim(),
        about: profileAbout.trim() || undefined,
      });
      setProfileName("");
      setProfileAbout("");
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  // Handle add relay
  const handleAddRelay = async () => {
    if (!relayUrl.trim()) {
      Alert.alert("Error", "Please enter a relay URL");
      return;
    }

    try {
      await addRelay(relayUrl.trim());
      setRelayUrl("");
      Alert.alert("Success", "Relay added!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add relay"
      );
    }
  };

  // Handle remove relay
  const handleRemoveRelay = async (relayUrl: string) => {
    try {
      await removeRelay(relayUrl);
      setRelayUrl("");
      Alert.alert("Success", "Relay removed!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to remove relay"
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nostr Tools Example</Text>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <Text>Initialized: {isInitialized ? "✅" : "❌"}</Text>
        <Text>Connected: {isConnected ? "✅" : "❌"}</Text>
        <Text>Logged In: {isLoggedIn ? "✅" : "❌"}</Text>
        <Text>Relays: {relays.length}</Text>
        {error && <Text style={styles.error}>Error: {error}</Text>}
      </View>

      {/* Current User */}
      {currentUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current User</Text>
          <Text>npub: {currentUser.npub}</Text>
          <Text>pubkey: {currentUser.publicKey.substring(0, 20)}...</Text>
        </View>
      )}

      {/* Authentication */}
      {!isLoggedIn ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter private key (nsec or hex)"
            value={privateKeyInput}
            onChangeText={setPrivateKeyInput}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGenerateAccount}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Generating..." : "Generate New Account"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Logging out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Send Note */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Note</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's on your mind?"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendNote}
              disabled={isPublishing}
            >
              <Text style={styles.buttonText}>
                {isPublishing ? "Sending..." : "Send Note"}
              </Text>
            </TouchableOpacity>
            {publishError && (
              <Text style={styles.error}>Error: {publishError}</Text>
            )}
          </View>

          {/* Send nip17 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Nip17</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's on your mind?"
              value={nip17Content}
              onChangeText={setNip17Content}
              multiline
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendNip17}
              disabled={isPublishingNip17}
            >
              <Text style={styles.buttonText}>
                {isPublishing ? "Sending..." : "Send Nip17"}
              </Text>
            </TouchableOpacity>
            {publishError && (
              <Text style={styles.error}>Error: {publishError}</Text>
            )}
          </View>

          {/* Send Direct Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Direct Message</Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient public key or npub"
              value={dmRecipient}
              onChangeText={setDmRecipient}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message"
              value={dmContent}
              onChangeText={setDmContent}
              multiline
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendDM}
              disabled={isPublishing}
            >
              <Text style={styles.buttonText}>
                {isPublishing ? "Sending..." : "Send DM"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Update Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={profileName}
              onChangeText={setProfileName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="About"
              value={profileAbout}
              onChangeText={setProfileAbout}
              multiline
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleUpdateProfile}
              disabled={isPublishing}
            >
              <Text style={styles.buttonText}>
                {isPublishing ? "Updating..." : "Update Profile"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Timeline ({timelineEvents.length} events)
            </Text>
            {isLoadingTimeline && <Text>Loading timeline...</Text>}
            {timelineEvents.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventAuthor}>
                  {event.pubkey.substring(0, 10)}...
                </Text>
                <Text>{event.content.substring(0, 100)}...</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.created_at * 1000).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>

          {/* Direct Messages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Direct Messages ({dmEvents.length} messages)
            </Text>
            {dmEvents.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventAuthor}>
                  From: {event.pubkey.substring(0, 10)}...
                </Text>
                <Text>[Encrypted content]</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.created_at * 1000).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>

          {/* Recent Global Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recent Global Events ({recentEvents.length})
            </Text>
            {recentEvents.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventAuthor}>
                  Kind {event.kind} from {event.pubkey.substring(0, 10)}...
                </Text>
                <Text style={styles.eventTime}>
                  {new Date(event.created_at * 1000).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Relay Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relay Management</Text>
        <TextInput
          style={styles.input}
          placeholder="wss://relay.example.com"
          value={relayUrl}
          onChangeText={setRelayUrl}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddRelay}>
          <Text style={styles.buttonText}>Add Relay</Text>
        </TouchableOpacity>

        <Text style={styles.subTitle}>Connected Relays:</Text>
        {relays.map((relay) => (
          <View key={relay.url} style={styles.relayItem}>
            <Text>{relay.url}</Text>
            <Text
              style={relay.connected ? styles.connected : styles.disconnected}
            >
              {relay.connected ? "🟢" : "🔴"}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleRemoveRelay(relay.url)}
            >
              <Text style={styles.buttonText}>Remove Relay</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    marginBottom: 8,
  },
  eventAuthor: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  relayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  connected: {
    color: "green",
  },
  disconnected: {
    color: "red",
  },
});
