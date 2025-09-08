import {
  NOSTR_LIMITS,
  NOSTR_STORAGE_KEYS,
  NOSTR_TIMEOUTS,
} from "@/constants/nostr";
import { NIP17PossiblePublicKeys, Recipient, ReplyTo } from "@/constants/types";
import { removeDuplicatesByKey } from "@/hooks/useTag";
import {
  getStoredData,
  removeStoredData,
  setStoredData,
} from "@/utils/storage";
import {
  Event,
  Filter,
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip04,
  nip19,
  nip44,
  validateEvent,
} from "nostr-tools";
import { generateUniqueDTag } from "./generateUniqueDTag";
import { wrapManyEvents } from "./nip17";

// Types
export interface NostrUser {
  privateKey: string;
  publicKey: string;
  npub: string;
  nsec: string;
}

export interface NostrConnection {
  pool: SimplePool;
  connectedRelays: string[];
  user: NostrUser | null;
}

export interface NostrEvent extends Event {}

export interface NostrFilter extends Filter {}

export interface NostrSubscription {
  id: string;
  filters: NostrFilter[];
  onEvent: (event: NostrEvent) => void;
  onEose?: () => void;
  relays: string[];
}

export interface UnsignedNostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface RelayInfo {
  url: string;
  read: boolean;
  write: boolean;
  connected: boolean;
}

// Constants

const DEFAULT_RELAYS = [
  // "wss://relay.damus.io",
  // "wss://nos.lol",
  // "wss://relay.nostr.band",
  // "wss://nostr.mom",
  "wss://nostream-production-0ee9.up.railway.app", // This relay seems problematic
];

// Main NostrTools class
class NostrTools {
  private pool: SimplePool;
  private relayUrls: string[] = [];
  private subscriptions: Map<string, NostrSubscription> = new Map();
  private user: NostrUser | null = null;
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private eventCallbacks: ((event: NostrEvent) => void)[] = [];
  private isInitialized = false;
  private lastPublishTime = 0;
  private publishCount = 0;
  private consecutiveFailures = 0;

  constructor() {
    this.pool = new SimplePool();
  }

  // Ensure pool is healthy and recreate if needed
  private ensurePoolHealth(): void {
    // Check if pool exists and recreate if needed
    if (!this.pool) {
      console.log("Recreating SimplePool instance");
      this.pool = new SimplePool();
    }
  }

  // Force reconnection to all relays
  async ensureRelayConnections(forceReconnect: boolean = false): Promise<void> {
    if (this.relayUrls.length === 0) {
      console.warn("No relay URLs configured");
      return;
    }

    console.log(
      `🔌 Ensuring connections to ${this.relayUrls.length} relays...`
    );

    if (forceReconnect) {
      console.log("🔄 Force reconnecting to all relays");
      // Close existing pool and create new one
      if (this.pool) {
        this.pool.close(this.relayUrls);
        // Wait for proper cleanup
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      this.pool = new SimplePool();

      // Wait longer for the new pool to properly initialize
      console.log("⏳ Waiting for new pool to stabilize...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("✅ Pool ready for publishing");
  }

  // Initialize the nostr connection
  async initialize(relayUrls: string[] = DEFAULT_RELAYS): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load stored relays
      const storedRelays = await getStoredData<string[]>(
        NOSTR_STORAGE_KEYS.RELAYS,
        relayUrls
      );

      // Set relay URLs for SimplePool
      this.relayUrls = storedRelays;

      // Load stored user if exists
      await this.loadStoredUser();

      this.isInitialized = true;
      this.notifyConnectionCallbacks(true);

      console.log(
        `✅ Initialized with ${this.relayUrls.length} relays:`,
        this.relayUrls
      );
      console.log("Pool status:", this.getPoolStatus());
    } catch (error) {
      console.error("Failed to initialize nostr connection:", error);
      throw error;
    }
  }

  normalizeRecipients(
    possiblePublicKeys?: NIP17PossiblePublicKeys,
    ignoreCurrentUser = false
  ): Recipient[] {
    if (!possiblePublicKeys) {
      throw new Error("No public key found");
    }

    const currentUser = this.user?.publicKey;

    const recipients = Array.isArray(possiblePublicKeys)
      ? possiblePublicKeys
      : [possiblePublicKeys];

    const result = removeDuplicatesByKey(
      recipients.map((r) => {
        if (typeof r === "string") {
          if (r.startsWith("npub")) {
            const { data: publicKey } = nip19.decode(r);
            return { publicKey: publicKey as string } as Recipient;
          }

          return { publicKey: r } as Recipient;
        }

        if (r.publicKey.startsWith("npub")) {
          const { data: publicKey } = nip19.decode(r.publicKey);
          return { ...r, publicKey: publicKey as string } as Recipient;
        }

        return r;
      }),
      "publicKey"
    );

    if (!ignoreCurrentUser) {
      return removeDuplicatesByKey(
        result.concat({
          publicKey: currentUser!,
        }),
        "publicKey"
      );
    }

    return result;
  }

  createMessageTag(
    possibleRecipients: string[] | nip19.NPub[] | Recipient[],
    ignoreCurrentUserOnTag = false,
    ignoreCurrentUserOnRecipients = true
  ) {
    const currentUser = this.user?.publicKey;

    const recipients = this.normalizeRecipients(possibleRecipients, true);

    if (!ignoreCurrentUserOnRecipients) {
      recipients.push({ publicKey: currentUser! });
    }

    if (!ignoreCurrentUserOnTag && !currentUser) {
      throw new Error("No current user found");
    }

    const recipientsPublicKeys = recipients.map((r) => r.publicKey);
    if (!ignoreCurrentUserOnTag) {
      recipientsPublicKeys.push(currentUser!);
    }

    const tag = generateUniqueDTag(recipientsPublicKeys);

    return {
      tag,
      recipients,
      recipientsPublicKeys,
    };
  }

  // Login with private key (nsec or hex)
  async login(privateKeyInput: string): Promise<NostrUser> {
    try {
      let privateKey: string;

      // Handle different private key formats
      if (privateKeyInput.startsWith("nsec1")) {
        const decoded = nip19.decode(privateKeyInput);
        if (decoded.type !== "nsec") {
          throw new Error("Invalid nsec format");
        }
        // Convert Uint8Array to hex string
        privateKey = Array.from(decoded.data as Uint8Array, (byte) =>
          byte.toString(16).padStart(2, "0")
        ).join("");
      } else if (privateKeyInput.length === 64) {
        privateKey = privateKeyInput;
      } else {
        throw new Error("Invalid private key format");
      }

      // Convert hex string to Uint8Array for nostr-tools functions
      const privateKeyBytes = new Uint8Array(
        privateKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
      );
      const publicKey = getPublicKey(privateKeyBytes);
      const npub = nip19.npubEncode(publicKey);
      const nsec = nip19.nsecEncode(privateKeyBytes);

      const user: NostrUser = {
        privateKey,
        publicKey,
        npub,
        nsec,
      };

      this.user = user;

      // Store the private key securely
      await setStoredData(NOSTR_STORAGE_KEYS.PRIVATE_KEY, privateKey);

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  // Generate new account
  async generateAccount(): Promise<NostrUser> {
    try {
      const privateKey = generateSecretKey();
      const privateKeyHex = Array.from(privateKey, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");

      return await this.login(privateKeyHex);
    } catch (error) {
      console.error("Failed to generate account:", error);
      throw error;
    }
  }

  // Load stored user
  private async loadStoredUser(): Promise<void> {
    try {
      const storedPrivateKey = await getStoredData<string | null>(
        NOSTR_STORAGE_KEYS.PRIVATE_KEY,
        null
      );
      if (storedPrivateKey) {
        await this.login(storedPrivateKey);
      }
    } catch (error) {
      console.error("Failed to load stored user:", error);
    }
  }

  private loadPrivateKey(): Uint8Array {
    const privateKey = this.user?.privateKey;

    if (!privateKey) {
      throw new Error("No private key found");
    }

    return new Uint8Array(
      privateKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );
  }

  // Logout
  async logout(): Promise<void> {
    try {
      this.user = null;
      await removeStoredData(NOSTR_STORAGE_KEYS.PRIVATE_KEY);
      await removeStoredData(NOSTR_STORAGE_KEYS.USER_PROFILE);

      // Close all subscriptions
      this.subscriptions.clear();

      // Reset publish tracking
      this.publishCount = 0;
      this.lastPublishTime = 0;
      this.consecutiveFailures = 0;

      this.cleanup();

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): NostrUser | null {
    return this.user;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.user !== null;
  }

  // Subscribe to events
  subscribe(
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    onEose?: () => void,
    relayUrls?: string[]
  ): string {
    const subscriptionId = Math.random().toString(36).substring(7);
    const targetRelays = relayUrls || this.relayUrls;

    const subscription: NostrSubscription = {
      id: subscriptionId,
      filters,
      onEvent,
      onEose,
      relays: targetRelays,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe using the pool
    const sub = this.pool.subscribeMany(targetRelays, filters, {
      onevent: (event: Event) => {
        // Notify global event callbacks
        this.eventCallbacks.forEach((callback) => callback(event));
        // Notify subscription-specific callback
        onEvent(event);
      },
      oneose: () => {
        onEose?.();
      },
    });

    // Store the sub reference for cleanup
    (subscription as any).poolSub = sub;

    return subscriptionId;
  }

  // Unsubscribe
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      // Close the pool subscription
      const poolSub = (subscription as any).poolSub;
      if (poolSub) {
        poolSub.close();
      }
      this.subscriptions.delete(subscriptionId);
    }
  }

  // Publish event with isolated pool per publish
  async publishEvent(
    event: UnsignedNostrEvent,
    relayUrls?: string[]
  ): Promise<Event> {
    if (!this.user) {
      throw new Error("User must be logged in to publish events");
    }

    try {
      this.publishCount++;
      const now = Date.now();
      const timeSinceLastPublish = now - this.lastPublishTime;

      console.log(
        `📊 Publish #${this.publishCount}, ${timeSinceLastPublish}ms since last publish`
      );

      // Add cooldown for rapid publishes
      if (
        this.publishCount > 1 &&
        timeSinceLastPublish < NOSTR_TIMEOUTS.PUBLISH_COOLDOWN
      ) {
        console.log("⏳ Rapid publish detected, adding cooldown...");
        await new Promise((resolve) =>
          setTimeout(resolve, NOSTR_TIMEOUTS.RAPID_PUBLISH_COOLDOWN)
        );
      }

      // Convert hex string to Uint8Array for signing
      const privateKeyBytes = this.loadPrivateKey();
      const signedEvent = finalizeEvent(event, privateKeyBytes);

      // Validate the event
      if (!validateEvent(signedEvent)) {
        throw new Error("Invalid event");
      }

      const targetRelays = relayUrls || this.relayUrls;

      if (targetRelays.length === 0) {
        throw new Error("No relays available for publishing");
      }

      console.log("Publishing event to relays:", targetRelays);
      console.log("Event to publish:", {
        id: signedEvent.id.substring(0, 10) + "...",
        kind: signedEvent.kind,
        pubkey: signedEvent.pubkey.substring(0, 10) + "...",
      });

      // Create a fresh, isolated pool for this publish to avoid state issues
      console.log("🆕 Creating fresh pool for this publish...");
      const isolatedPool = new SimplePool();

      try {
        // Wait for pool to initialize
        await new Promise((resolve) =>
          setTimeout(resolve, NOSTR_TIMEOUTS.POOL_STABILIZATION_DELAY / 2)
        );

        // Get the array of promises from the isolated pool
        const publishPromises = isolatedPool.publish(targetRelays, signedEvent);
        console.log("Number of publish promises:", publishPromises.length);

        // Add timeout to each publish promise
        const timeoutPromises = publishPromises.map((promise, index) =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      `Publish timeout (${
                        NOSTR_TIMEOUTS.PUBLISH_TIMEOUT / 1000
                      }s)`
                    )
                  ),
                NOSTR_TIMEOUTS.PUBLISH_TIMEOUT
              )
            ),
          ]).then(
            () => ({ index, status: "fulfilled" as const }),
            (error) => ({ index, status: "rejected" as const, reason: error })
          )
        );

        // Wait for all publish attempts to complete
        const results = await Promise.allSettled(timeoutPromises);

        let successCount = 0;
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const publishResult = result.value;
            if (publishResult.status === "fulfilled") {
              successCount++;
              console.log(
                `✅ Successfully published to relay ${
                  targetRelays[publishResult.index]
                }`
              );
            } else {
              console.error(
                `❌ Failed to publish to relay ${
                  targetRelays[publishResult.index]
                }:`,
                publishResult.reason?.message || publishResult.reason
              );
            }
          }
        });

        console.log(
          `Published to ${successCount}/${targetRelays.length} relays`
        );

        if (successCount === 0) {
          throw new Error("Failed to publish to any relays");
        }

        // Record successful publish time and reset failure counter
        this.consecutiveFailures = 0;
        this.lastPublishTime = Date.now();
        console.log(`✅ Publish #${this.publishCount} completed successfully`);

        return signedEvent;
      } finally {
        // Always clean up the isolated pool
        console.log("🧹 Cleaning up isolated pool...");
        isolatedPool.close(targetRelays);
      }
    } catch (error) {
      this.consecutiveFailures++;
      console.log(`❌ Consecutive failures: ${this.consecutiveFailures}`);
      console.error("Failed to publish event:", error);
      throw error;
    }
  }

  // Send text note
  async sendTextNote(content: string, tags: string[][] = []): Promise<Event> {
    if (!this.user) {
      throw new Error("User must be logged in to send text notes");
    }

    const event: UnsignedNostrEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    };

    return await this.publishEvent(event);
  }

  // Send direct message (NIP-04)
  async sendDirectMessage(
    recipientPubkey: string,
    message: string
  ): Promise<Event> {
    if (!this.user) {
      throw new Error("User must be logged in to send direct messages");
    }

    try {
      const encryptedMessage = await nip04.encrypt(
        this.user.privateKey,
        recipientPubkey,
        message
      );

      const event: UnsignedNostrEvent = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", recipientPubkey]],
        content: encryptedMessage,
      };

      return await this.publishEvent(event);
    } catch (error) {
      console.error("Failed to send direct message:", error);
      throw error;
    }
  }

  // Send private direct message (NIP-44)
  async sendPrivateDirectMessage(
    recipientPubkey: string,
    message: string
  ): Promise<Event> {
    if (!this.user) {
      throw new Error("User must be logged in to send direct messages");
    }

    try {
      const privateKeyBytes = new Uint8Array(
        this.user.privateKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
      );
      const conversationKey = nip44.getConversationKey(
        privateKeyBytes,
        recipientPubkey
      );
      const encryptedMessage = nip44.encrypt(message, conversationKey);

      const event: UnsignedNostrEvent = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", recipientPubkey]],
        content: encryptedMessage,
      };

      return await this.publishEvent(event);
    } catch (error) {
      console.error("Failed to send private direct message:", error);
      throw error;
    }
  }

  async sendNip17DirectMessage(
    recipientPubkey: string,
    message: string,
    conversationTitle?: string,
    replyTo?: ReplyTo,
    relayUrls?: string[]
  ) {
    if (!this.user) {
      throw new Error("User must be logged in to send direct messages");
    }

    try {
      this.publishCount++;
      const now = Date.now();
      const timeSinceLastPublish = now - this.lastPublishTime;

      console.log(
        `📊 NIP-17 Publish #${this.publishCount}, ${timeSinceLastPublish}ms since last publish`
      );

      // Add cooldown for rapid publishes
      if (
        this.publishCount > 1 &&
        timeSinceLastPublish < NOSTR_TIMEOUTS.RAPID_PUBLISH_COOLDOWN
      ) {
        console.log("⏳ Rapid NIP-17 publish detected, adding cooldown...");
        await new Promise((resolve) =>
          setTimeout(resolve, NOSTR_TIMEOUTS.RAPID_PUBLISH_COOLDOWN / 2)
        );
      }

      // Smart reconnection for NIP-17 based on failure history
      if (this.consecutiveFailures >= NOSTR_LIMITS.MAX_CONSECUTIVE_FAILURES) {
        console.log(
          `🔄 Multiple failures detected (${this.consecutiveFailures}), forcing pool refresh for NIP-17...`
        );
        await this.ensureRelayConnections(true);
      } else {
        console.log(
          "🔄 Ensuring relay connections before NIP-17 publishing..."
        );
        await this.ensureRelayConnections();
      }

      const { recipients, tag: dTag } = this.createMessageTag([
        recipientPubkey,
      ]);

      const privateKeyBytes = this.loadPrivateKey();

      const events = wrapManyEvents(
        privateKeyBytes,
        recipients,
        message,
        [["d", dTag]],
        conversationTitle,
        replyTo
      ).map((event) => {
        if (!validateEvent(event)) {
          throw new Error("Invalid event");
        }

        return event;
      });

      const targetRelays = relayUrls || this.relayUrls;

      // Publish events sequentially to avoid race conditions
      for (const event of events) {
        const results = await Promise.allSettled(
          this.pool.publish(targetRelays, event)
        );

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            console.log(
              `Successfully published NIP-17 event to relay ${targetRelays[index]}`
            );
          } else {
            console.error(
              `Failed to publish NIP-17 event to relay ${targetRelays[index]}:`,
              result.reason
            );
          }
        });
      }

      // Record successful publish time
      this.lastPublishTime = Date.now();
      console.log(
        `✅ NIP-17 Publish #${this.publishCount} completed successfully`
      );

      return events;
    } catch (error) {
      console.error("Failed to send nip17 direct message:", error);
      throw error;
    }
  }

  // Decrypt direct message (NIP-04)
  async decryptDirectMessage(event: Event): Promise<string> {
    if (!this.user) {
      throw new Error("User must be logged in to decrypt messages");
    }

    try {
      const senderPubkey = event.pubkey;
      return await nip04.decrypt(
        this.user.privateKey,
        senderPubkey,
        event.content
      );
    } catch (error) {
      console.error("Failed to decrypt direct message:", error);
      throw error;
    }
  }

  // Decrypt private direct message (NIP-44)
  async decryptPrivateDirectMessage(event: Event): Promise<string> {
    if (!this.user) {
      throw new Error("User must be logged in to decrypt messages");
    }

    try {
      const senderPubkey = event.pubkey;
      const privateKeyBytes = new Uint8Array(
        this.user.privateKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
      );
      const conversationKey = nip44.getConversationKey(
        privateKeyBytes,
        senderPubkey
      );
      return nip44.decrypt(event.content, conversationKey);
    } catch (error) {
      console.error("Failed to decrypt private direct message:", error);
      throw error;
    }
  }

  // Get events
  async getEvents(
    filters: NostrFilter[],
    relayUrls?: string[]
  ): Promise<Event[]> {
    const targetRelays = relayUrls || this.relayUrls;

    return new Promise((resolve) => {
      const events: Event[] = [];
      let eoseCount = 0;
      const expectedEose = targetRelays.length;

      const sub = this.pool.subscribeMany(targetRelays, filters, {
        onevent: (event: Event) => {
          events.push(event);
        },
        oneose: () => {
          eoseCount++;
          if (eoseCount >= expectedEose) {
            sub.close();
            // Remove duplicates and sort by created_at
            const uniqueEvents = Array.from(
              new Map(events.map((e) => [e.id, e])).values()
            ).sort((a, b) => b.created_at - a.created_at);
            resolve(uniqueEvents);
          }
        },
      });

      // Timeout after configured time
      setTimeout(() => {
        sub.close();
        const uniqueEvents = Array.from(
          new Map(events.map((e) => [e.id, e])).values()
        ).sort((a, b) => b.created_at - a.created_at);
        resolve(uniqueEvents);
      }, NOSTR_TIMEOUTS.SUBSCRIPTION_TIMEOUT);
    });
  }

  // Get user profile
  async getUserProfile(pubkey: string): Promise<Event | null> {
    const filters: NostrFilter[] = [
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
    ];

    const events = await this.getEvents(filters);
    return events[0] || null;
  }

  // Update user profile
  async updateProfile(profile: {
    name?: string;
    about?: string;
    picture?: string;
    nip05?: string;
    banner?: string;
    website?: string;
    lud16?: string;
  }): Promise<Event> {
    const event: UnsignedNostrEvent = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(profile),
    };

    return await this.publishEvent(event);
  }

  // Get relay information
  getRelayInfo(): RelayInfo[] {
    return this.relayUrls.map((url) => ({
      url,
      read: true,
      write: true,
      connected: true, // SimplePool handles connection state internally
    }));
  }

  // Add relay
  async addRelay(relayUrl: string): Promise<void> {
    try {
      if (!this.relayUrls.includes(relayUrl)) {
        this.relayUrls.push(relayUrl);

        // Update stored relays
        await setStoredData(NOSTR_STORAGE_KEYS.RELAYS, this.relayUrls);

        console.log(`Added relay: ${relayUrl}`);
      }
    } catch (error) {
      console.error(`Failed to add relay ${relayUrl}:`, error);
      throw error;
    }
  }

  // Remove relay
  async removeRelay(relayUrl: string): Promise<void> {
    try {
      const index = this.relayUrls.indexOf(relayUrl);
      if (index > -1) {
        this.relayUrls.splice(index, 1);

        // Update stored relays
        await setStoredData(NOSTR_STORAGE_KEYS.RELAYS, this.relayUrls);

        console.log(`Removed relay: ${relayUrl}`);
      }
    } catch (error) {
      console.error(`Failed to remove relay ${relayUrl}:`, error);
      throw error;
    }
  }

  // Connection status callbacks
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Global event callbacks
  onEvent(callback: (event: NostrEvent) => void): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  // Private helper to notify connection callbacks
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // Get pool status for debugging
  getPoolStatus(): { initialized: boolean; relayCount: number } {
    return {
      initialized: !!this.pool,
      relayCount: this.relayUrls.length,
    };
  }

  // Public method to force reconnection to all relays
  async reconnectToRelays(): Promise<void> {
    console.log("🔄 Manually reconnecting to all relays...");
    await this.ensureRelayConnections(true);
  }

  // Cleanup - only call when completely shutting down
  async cleanup(): Promise<void> {
    console.log("Cleaning up nostr tools...");

    // Close all subscriptions
    this.subscriptions.forEach((subscription) => {
      const poolSub = (subscription as any).poolSub;
      if (poolSub) {
        poolSub.close();
      }
    });
    this.subscriptions.clear();

    // Clear callbacks
    this.connectionCallbacks = [];
    this.eventCallbacks = [];

    // Delete stored relays
    await removeStoredData(NOSTR_STORAGE_KEYS.RELAYS);

    // Close the pool only if it exists
    if (this.pool) {
      this.pool.close(this.relayUrls);
    }

    this.isInitialized = false;
  }
}

// Create singleton instance
export const nostrTools = new NostrTools();

export { generateSecretKey, getPublicKey, nip04, nip19, nip44 };
