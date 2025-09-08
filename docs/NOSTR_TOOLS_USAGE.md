# Nostr Tools Implementation for React Native

This guide explains how to use the comprehensive nostr-tools implementation created for React Native applications.

## Overview

The implementation provides:

- Pure `nostr-tools` based connection (no NDK dependency)
- React hooks for easy integration
- React Context for global state management
- Support for all major nostr operations
- Cross-platform storage (React Native + Web)
- TypeScript support

## File Structure

```
interal-lib/ndk.ts          # Core nostr-tools implementation
hooks/useNostrTools.ts      # React hooks
components/Context/NostrProvider.tsx  # React Context Provider
components/Examples/NostrExample.tsx  # Complete example component
```

## Quick Start

### 1. Wrap your app with NostrProvider

```tsx
import React from "react";
import { NostrProvider } from "@/components/Context/NostrProvider";
import { YourMainComponent } from "./YourMainComponent";

export default function App() {
  const customRelays = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
  ];

  return (
    <NostrProvider relayUrls={customRelays} autoInitialize={true}>
      <YourMainComponent />
    </NostrProvider>
  );
}
```

### 2. Use hooks in your components

```tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useNostr } from "@/components/Context/NostrProvider";
import { useNostrPublish } from "@/hooks/useNostrTools";

export function MyNostrComponent() {
  const { currentUser, login, logout, isLoggedIn } = useNostr();
  const { sendTextNote, isPublishing } = useNostrPublish();
  const [message, setMessage] = useState("");

  const handleSendNote = async () => {
    try {
      await sendTextNote(message);
      setMessage("");
      alert("Note sent!");
    } catch (error) {
      alert("Failed to send note");
    }
  };

  if (!isLoggedIn) {
    return (
      <View>
        <Text>Please login first</Text>
        {/* Add login UI here */}
      </View>
    );
  }

  return (
    <View>
      <Text>Welcome, {currentUser?.npub}</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="What's on your mind?"
      />
      <TouchableOpacity onPress={handleSendNote} disabled={isPublishing}>
        <Text>{isPublishing ? "Sending..." : "Send Note"}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Core Features

### Authentication

```tsx
import { useNostr } from "@/components/Context/NostrProvider";

function LoginComponent() {
  const { login, generateAccount, logout, currentUser, isLoggedIn } =
    useNostr();

  // Login with private key (nsec or hex)
  const handleLogin = async () => {
    try {
      await login("nsec1..." /* or hex private key */);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Generate new account
  const handleGenerateAccount = async () => {
    try {
      const user = await generateAccount();
      console.log("New account:", user.nsec); // Save this!
    } catch (error) {
      console.error("Account generation failed:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <View>
      {isLoggedIn ? (
        <View>
          <Text>Logged in as: {currentUser?.npub}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={handleLogin}>
            <Text>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGenerateAccount}>
            <Text>Generate New Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

### Publishing Events

```tsx
import { useNostrPublish } from "@/hooks/useNostrTools";

function PublishComponent() {
  const {
    sendTextNote,
    sendDirectMessage,
    sendPrivateDirectMessage,
    updateProfile,
    isPublishing,
    error,
  } = useNostrPublish();

  // Send a text note
  const sendNote = async () => {
    await sendTextNote("Hello, nostr!", [["t", "hello"]]);
  };

  // Send direct message (NIP-04)
  const sendDM = async () => {
    await sendDirectMessage("recipient_pubkey", "Secret message");
  };

  // Send private direct message (NIP-44)
  const sendPrivateDM = async () => {
    await sendPrivateDirectMessage("recipient_pubkey", "Very secret message");
  };

  // Update profile
  const updateMyProfile = async () => {
    await updateProfile({
      name: "My Name",
      about: "About me",
      picture: "https://example.com/avatar.jpg",
      nip05: "myname@example.com",
    });
  };

  return (
    <View>
      <TouchableOpacity onPress={sendNote} disabled={isPublishing}>
        <Text>Send Note</Text>
      </TouchableOpacity>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
    </View>
  );
}
```

### Subscribing to Events

```tsx
import { useNostrSubscription } from "@/hooks/useNostrTools";
import { NostrFilter } from "@/interal-lib/ndk";

function TimelineComponent() {
  // Subscribe to timeline events
  const timelineFilters: NostrFilter[] = [
    {
      kinds: [1], // Text notes
      limit: 50,
    },
  ];

  const { events, isLoading, error } = useNostrSubscription(timelineFilters, {
    enabled: true,
    onEvent: (event) => {
      console.log("New event:", event.content);
    },
    onEose: () => {
      console.log("End of stored events");
    },
  });

  return (
    <View>
      {isLoading && <Text>Loading timeline...</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {events.map((event) => (
        <View key={event.id}>
          <Text>{event.content}</Text>
          <Text style={{ fontSize: 12, color: "gray" }}>
            {new Date(event.created_at * 1000).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

### Fetching Events

```tsx
import { useNostrEvents } from "@/hooks/useNostrTools";

function ProfileComponent({ pubkey }: { pubkey: string }) {
  const { getUserProfile, getEvents, isLoading } = useNostrEvents();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileEvent = await getUserProfile(pubkey);
      if (profileEvent) {
        setProfile(JSON.parse(profileEvent.content));
      }
    };

    fetchProfile();
  }, [pubkey]);

  const fetchUserNotes = async () => {
    const filters = [
      {
        kinds: [1],
        authors: [pubkey],
        limit: 20,
      },
    ];

    const notes = await getEvents(filters);
    console.log("User notes:", notes);
  };

  return (
    <View>
      {profile ? (
        <View>
          <Text>{profile.name}</Text>
          <Text>{profile.about}</Text>
        </View>
      ) : (
        <Text>Loading profile...</Text>
      )}
      <TouchableOpacity onPress={fetchUserNotes}>
        <Text>Fetch Notes</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Direct Message Decryption

```tsx
import { useNostrDecryption } from "@/hooks/useNostrTools";

function DMComponent({ dmEvent }: { dmEvent: NostrEvent }) {
  const { decryptDirectMessage, decryptPrivateDirectMessage, isDecrypting } =
    useNostrDecryption();
  const [decryptedContent, setDecryptedContent] = useState("");

  const handleDecrypt = async () => {
    try {
      // For NIP-04 messages
      const content = await decryptDirectMessage(dmEvent);
      // For NIP-44 messages (more secure)
      // const content = await decryptPrivateDirectMessage(dmEvent);

      setDecryptedContent(content);
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  };

  return (
    <View>
      {decryptedContent ? (
        <Text>{decryptedContent}</Text>
      ) : (
        <TouchableOpacity onPress={handleDecrypt} disabled={isDecrypting}>
          <Text>{isDecrypting ? "Decrypting..." : "Decrypt Message"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Global Event Listening

```tsx
import { useNostrGlobalEvents } from "@/hooks/useNostrTools";

function GlobalEventMonitor() {
  const { events, clearEvents } = useNostrGlobalEvents(
    (event) => {
      console.log("Global event received:", event.kind, event.id);
    },
    true // enabled
  );

  return (
    <View>
      <Text>Recent Events: {events.length}</Text>
      <TouchableOpacity onPress={clearEvents}>
        <Text>Clear Events</Text>
      </TouchableOpacity>
      {events.slice(0, 5).map((event) => (
        <Text key={event.id}>
          Kind {event.kind}: {event.id.substring(0, 10)}...
        </Text>
      ))}
    </View>
  );
}
```

### Relay Management

```tsx
import { useNostr } from "@/components/Context/NostrProvider";

function RelayManager() {
  const { relays, addRelay, removeRelay } = useNostr();

  const handleAddRelay = async () => {
    try {
      await addRelay("wss://relay.example.com");
    } catch (error) {
      console.error("Failed to add relay:", error);
    }
  };

  const handleRemoveRelay = async (url: string) => {
    try {
      await removeRelay(url);
    } catch (error) {
      console.error("Failed to remove relay:", error);
    }
  };

  return (
    <View>
      <Text>Connected Relays:</Text>
      {relays.map((relay) => (
        <View
          key={relay.url}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <Text>{relay.url}</Text>
          <Text>{relay.connected ? "🟢" : "🔴"}</Text>
          <TouchableOpacity onPress={() => handleRemoveRelay(relay.url)}>
            <Text>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={handleAddRelay}>
        <Text>Add Relay</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Advanced Usage

### Custom Filters

```tsx
const customFilters: NostrFilter[] = [
  {
    kinds: [1, 6], // Text notes and reposts
    authors: ["pubkey1", "pubkey2"],
    since: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
    until: Math.floor(Date.now() / 1000),
    limit: 100,
    "#t": ["bitcoin", "nostr"], // Tags
    "#p": ["mentioned_pubkey"], // Mentions
  },
];
```

### Direct nostr-tools Access

```tsx
import { nostrTools } from "@/interal-lib/ndk";

// Direct access to the singleton instance
const currentUser = nostrTools.getCurrentUser();
const relayInfo = nostrTools.getRelayInfo();

// Subscribe directly
const subscriptionId = nostrTools.subscribe(
  [{ kinds: [1], limit: 10 }],
  (event) => console.log("Event:", event),
  () => console.log("EOSE"),
  ["wss://relay.damus.io"]
);

// Unsubscribe later
nostrTools.unsubscribe(subscriptionId);
```

## Error Handling

All hooks provide error states and error clearing functions:

```tsx
const { error, clearError } = useNostrTools();
const { error: publishError, clearError: clearPublishError } =
  useNostrPublish();

// Clear errors when needed
useEffect(() => {
  if (error) {
    console.error("Nostr error:", error);
    // Auto-clear after 5 seconds
    setTimeout(clearError, 5000);
  }
}, [error]);
```

## TypeScript Support

All types are exported from the main implementation:

```tsx
import {
  NostrUser,
  NostrEvent,
  NostrFilter,
  RelayInfo,
  NostrSubscription,
} from "@/interal-lib/ndk";

// Use types in your components
interface MyComponentProps {
  user: NostrUser;
  events: NostrEvent[];
  onEventSelect: (event: NostrEvent) => void;
}
```

## Performance Considerations

1. **Event Deduplication**: Subscriptions automatically handle duplicate events
2. **Memory Management**: Global event listener keeps only the last 100 events
3. **Connection Pooling**: Uses nostr-tools SimplePool for efficient relay connections
4. **Automatic Cleanup**: Subscriptions are cleaned up when components unmount

## Security Notes

1. **Private Key Storage**: Private keys are stored securely using platform-appropriate storage
2. **Encryption**: Supports both NIP-04 and NIP-44 encryption for direct messages
3. **Validation**: All events are validated before publishing
4. **Error Handling**: Crypto operations are wrapped in try-catch blocks

## Migration from NDK

If you're migrating from NDK, the main differences are:

1. **Initialization**: Use `NostrProvider` instead of NDK context
2. **Events**: Use `NostrEvent` type instead of `NDKEvent`
3. **Filters**: Use `NostrFilter` type instead of `NDKFilter`
4. **Publishing**: Use hook functions instead of NDK event methods

## Complete Example

See `components/Examples/NostrExample.tsx` for a complete working example that demonstrates all features.

## Troubleshooting

### Common Issues

1. **"User must be logged in"**: Ensure user is authenticated before calling publishing functions
2. **Relay connection failures**: Check relay URLs and network connectivity
3. **Decryption failures**: Verify the message was encrypted for your key
4. **Event validation errors**: Check event structure and required fields

### Debug Mode

Enable debug logging:

```tsx
// In your app initialization
console.log("Nostr connection state:", {
  isInitialized: nostrTools.isInitialized,
  currentUser: nostrTools.getCurrentUser(),
  relays: nostrTools.getRelayInfo(),
});
```
