/**
 * Jest setup file
 * Global configuration and mocks for testing
 */

// Import Jest DOM matchers
import "@testing-library/jest-dom";

// Mock react-native modules
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");

  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: "ios",
      select: jest.fn((platforms) => platforms.ios || platforms.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
  };
});

// Mock Expo modules
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }) => children,
  },
  Link: ({ children }) => children,
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

// Mock React Navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock Zustand stores
jest.mock("@/store/chat", () => ({
  useChatStore: () => ({
    messages: [],
    isLoading: false,
    addMessage: jest.fn(),
    getMessages: jest.fn(() => []),
    clearMessages: jest.fn(),
  }),
}));

jest.mock("@/store/chatlist", () => ({
  useChatListStore: () => ({
    chatRooms: [],
    isLoading: false,
    addChatRoom: jest.fn(),
  }),
}));

// Mock Nostr libraries
jest.mock("nostr-tools", () => ({
  generateSecretKey: jest.fn(() => new Uint8Array(32)),
  getPublicKey: jest.fn(() => "mock-public-key"),
  nip04: {
    encrypt: jest.fn(() => "encrypted-content"),
    decrypt: jest.fn(() => "decrypted-content"),
  },
  nip17: {
    unwrapEvent: jest.fn(() => ({
      id: "mock-event-id",
      content: "mock-content",
      created_at: Date.now() / 1000,
    })),
  },
  validateEvent: jest.fn(() => true),
  verifyEvent: jest.fn(() => true),
}));

jest.mock("@nostr-dev-kit/ndk", () => ({
  default: jest.fn(() => ({
    connect: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
  })),
  NDKEvent: jest.fn(() => ({
    id: "mock-event-id",
    content: "mock-content",
    created_at: Date.now() / 1000,
  })),
  NDKPrivateKeySigner: jest.fn(),
  NDKNip07Signer: jest.fn(),
  NDKNip46Signer: jest.fn(),
}));

// Mock performance monitoring
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  memory: {
    usedJSHeapSize: 1024 * 1024,
    totalJSHeapSize: 1024 * 1024 * 2,
  },
};

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Mock timers
jest.useFakeTimers();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
