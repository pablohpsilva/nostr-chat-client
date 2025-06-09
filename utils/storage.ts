// Storage adapter that works across web and React Native
interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

class WebStorage implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage not available:", error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage setItem failed:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("localStorage removeItem failed:", error);
      throw error;
    }
  }
}

class ReactNativeStorage implements StorageAdapter {
  private AsyncStorage: any;

  constructor() {
    try {
      // Dynamic import to avoid errors in web environments
      this.AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
    } catch (error) {
      console.warn("AsyncStorage not available:", error);
      this.AsyncStorage = null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.AsyncStorage) return null;
    try {
      return await this.AsyncStorage.getItem(key);
    } catch (error) {
      console.warn("AsyncStorage getItem failed:", error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.AsyncStorage) {
      throw new Error("AsyncStorage not available");
    }
    try {
      await this.AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn("AsyncStorage setItem failed:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.AsyncStorage) {
      throw new Error("AsyncStorage not available");
    }
    try {
      await this.AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn("AsyncStorage removeItem failed:", error);
      throw error;
    }
  }
}

// Fallback storage that doesn't persist (in-memory only)
class MemoryStorage implements StorageAdapter {
  private storage = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

// Detect environment and create appropriate storage
function createStorage(): StorageAdapter {
  // Check if we're in a React Native environment
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return new ReactNativeStorage();
  }

  // Check if we're in a browser environment with localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    return new WebStorage();
  }

  // Fallback to memory storage
  console.warn("No persistent storage available, using memory storage");
  return new MemoryStorage();
}

export const storage = createStorage();

// Helper functions for common storage operations
export async function getStoredData<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const stored = await storage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to get stored data for key ${key}:`, error);
  }
  return defaultValue;
}

export async function setStoredData<T>(key: string, data: T): Promise<void> {
  try {
    // Handle circular references by using a replacer function
    const seen = new WeakSet();
    const json = JSON.stringify(data, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }
      return value;
    });
    await storage.setItem(key, json);
  } catch (error) {
    console.warn(`Failed to store data for key ${key}:`, error);
    throw error;
  }
}

export async function removeStoredData(key: string): Promise<void> {
  try {
    await storage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove stored data for key ${key}:`, error);
    throw error;
  }
}
