# Code Style Guide

This document outlines the coding standards and best practices for the Nostream Chat Client project.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [React Guidelines](#react-guidelines)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Documentation Standards](#documentation-standards)
- [Error Handling](#error-handling)
- [Performance Guidelines](#performance-guidelines)

## General Principles

### 1. Code Clarity

- Write self-documenting code
- Use descriptive variable and function names
- Prefer explicit over implicit
- Keep functions small and focused

### 2. Consistency

- Follow established patterns within the codebase
- Use consistent formatting and style
- Apply the same architectural patterns across similar features

### 3. Type Safety

- Leverage TypeScript's type system
- Avoid `any` types
- Use branded types for domain-specific values
- Implement proper type guards and assertions

## TypeScript Guidelines

### Type Definitions

```typescript
// ✅ Good: Use branded types for domain values
type NostrPublicKey = Brand<string, "NostrPublicKey">;
type UnixTimestamp = Brand<number, "UnixTimestamp">;

// ✅ Good: Use strict interfaces
interface StrictNostrEvent {
  readonly id: NostrEventId;
  readonly pubkey: NostrPublicKey;
  readonly created_at: UnixTimestamp;
  readonly kind: NostrKind;
  readonly tags: readonly string[][];
  readonly content: string;
  readonly sig: NostrSignature;
}

// ❌ Avoid: Loose typing
interface LooseEvent {
  id?: string;
  pubkey?: string;
  created_at?: number;
  [key: string]: any;
}
```

### Type Guards

```typescript
// ✅ Good: Implement proper type guards
function isValidNostrPublicKey(value: string): value is NostrPublicKey {
  return /^[0-9a-f]{64}$/i.test(value);
}

// ✅ Good: Use assertion functions
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value must be defined");
  }
}
```

### Utility Types

```typescript
// ✅ Good: Use advanced utility types
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Example usage
type PartialNostrEvent = OptionalFields<NostrEvent, "id" | "sig">;
```

## React Guidelines

### Component Structure

```typescript
// ✅ Good: Proper component structure with TypeScript
interface MessageListProps {
  readonly messages: NostrEvent[];
  readonly isLoading?: boolean;
  readonly onLoadMore: () => void;
}

const MessageList = React.memo<MessageListProps>(
  ({ messages, isLoading = false, onLoadMore }) => {
    // Hooks first
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Memoized values
    const sortedMessages = useMemo(
      () => messages.sort((a, b) => b.created_at - a.created_at),
      [messages]
    );

    // Callbacks
    const handleSelect = useCallback((id: string) => {
      setSelectedId(id);
    }, []);

    // Effects
    useEffect(
      () => {
        // Effect logic
      },
      [
        /* dependencies */
      ]
    );

    // Render
    return <div>{/* JSX */}</div>;
  }
);

MessageList.displayName = "MessageList";
```

### Performance Optimization

```typescript
// ✅ Good: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick]
);

// ✅ Good: Use React.memo for components
const OptimizedComponent = React.memo(Component, (prevProps, nextProps) => {
  // Custom comparison logic if needed
  return prevProps.id === nextProps.id;
});
```

### Hook Guidelines

```typescript
// ✅ Good: Custom hook structure
function useNostrSubscription(
  filters: NostrFilter[],
  options: SubscriptionOptions = {}
): SubscriptionResult {
  // State
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for avoiding re-subscriptions
  const callbackRef = useRef(options.onEvent);

  // Update ref without triggering re-subscription
  useEffect(() => {
    callbackRef.current = options.onEvent;
  }, [options.onEvent]);

  // Main effect
  useEffect(
    () => {
      // Subscription logic
    },
    [
      /* minimal dependencies */
    ]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      // Cleanup logic
    };
  }, []);

  return {
    events,
    isLoading,
    error,
    refetch: useCallback(() => {
      // Refetch logic
    }, []),
  };
}
```

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives
│   ├── Chat/            # Chat-specific components
│   └── ErrorBoundary/   # Error handling components
├── hooks/               # Custom React hooks
│   ├── nostr/          # Nostr-specific hooks
│   └── index.ts        # Hook barrel exports
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # Application constants
├── store/              # State management (Zustand)
└── app/                # Route components (Expo Router)
```

### File Naming

- **Components**: PascalCase (`MessageList.tsx`)
- **Hooks**: camelCase with `use` prefix (`useNostrSubscription.ts`)
- **Types**: camelCase (`nostrTypes.ts`)
- **Utils**: camelCase (`errorHandling.ts`)
- **Constants**: camelCase (`nostrConstants.ts`)

## Naming Conventions

### Variables and Functions

```typescript
// ✅ Good: Descriptive names
const currentUserPublicKey = user.pubkey;
const isMessageFromCurrentUser = message.pubkey === currentUserPublicKey;

function validateNostrEvent(event: NostrEvent): boolean {
  return (
    isValidNostrPublicKey(event.pubkey) &&
    isValidUnixTimestamp(event.created_at)
  );
}

// ❌ Avoid: Abbreviated or unclear names
const usr = user.pubkey;
const isMsg = msg.pubkey === usr;

function validate(e: any): boolean {
  return check(e.pubkey) && check2(e.created_at);
}
```

### Constants

```typescript
// ✅ Good: Descriptive constant names
const DEFAULT_MESSAGE_HISTORY_DAYS = 10;
const MAX_EVENTS_IN_MEMORY = 100;
const SUBSCRIPTION_TIMEOUT_MS = 10000;

// Group related constants
export const NOSTR_LIMITS = {
  MAX_EVENTS_IN_MEMORY: 100,
  DEFAULT_MESSAGE_HISTORY_DAYS: 10,
  MESSAGE_PER_PAGE: 30,
} as const;
```

## Documentation Standards

### JSDoc Comments

````typescript
/**
 * Subscribes to Nostr events matching the provided filters
 *
 * @param filters - Array of Nostr filters to subscribe to
 * @param options - Subscription configuration options
 * @returns Subscription result with events and control methods
 *
 * @example
 * ```typescript
 * const { events, isLoading } = useNostrSubscription([
 *   { kinds: [1], authors: [userPubkey] }
 * ], {
 *   enabled: true,
 *   onEvent: (event) => console.log('New event:', event)
 * });
 * ```
 */
function useNostrSubscription(
  filters: NostrFilter[],
  options: SubscriptionOptions = {}
): SubscriptionResult {
  // Implementation
}
````

### Interface Documentation

```typescript
/**
 * Configuration options for Nostr event subscriptions
 */
interface SubscriptionOptions {
  /** Whether the subscription is enabled */
  readonly enabled?: boolean;

  /** Specific relay URLs to subscribe to */
  readonly relayUrls?: readonly string[];

  /** Callback fired when a new event is received */
  readonly onEvent?: (event: NostrEvent) => void;

  /** Callback fired when end-of-stored-events is reached */
  readonly onEose?: () => void;

  /** Timeout in milliseconds for the subscription */
  readonly timeoutMs?: number;
}
```

## Error Handling

### Error Types

```typescript
// ✅ Good: Structured error handling
class NostrError extends Error {
  constructor(
    message: string,
    public readonly code: NostrErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "NostrError";
  }
}

// ✅ Good: Type-safe error codes
export const NOSTR_ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  PUBLISH_FAILED: "PUBLISH_FAILED",
  SUBSCRIPTION_FAILED: "SUBSCRIPTION_FAILED",
} as const;

export type NostrErrorCode =
  (typeof NOSTR_ERROR_CODES)[keyof typeof NOSTR_ERROR_CODES];
```

### Error Boundaries

```typescript
// ✅ Good: Comprehensive error boundaries
<ErrorBoundary
  fallback={(error, errorInfo) => <CustomErrorUI error={error} />}
  onError={(error, errorInfo) => {
    // Log to analytics
    analytics.recordError(error, errorInfo);
  }}
  resetKeys={[userId]} // Reset when user changes
>
  <ChatApplication />
</ErrorBoundary>
```

## Performance Guidelines

### Memory Management

```typescript
// ✅ Good: Proper cleanup
useEffect(() => {
  const subscription = createSubscription();

  return () => {
    subscription.cleanup();
  };
}, []);

// ✅ Good: Memory-bounded caches
const MAX_CACHE_SIZE = 100;

function addToCache(item: CacheItem) {
  cache.set(item.id, item);

  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}
```

### Optimization

```typescript
// ✅ Good: Debounced operations
const debouncedSave = useMemo(() => debounce(saveToStorage, 1000), []);

// ✅ Good: Virtualization for large lists
const shouldUseVirtualization = items.length > VIRTUALIZATION_THRESHOLD;

return shouldUseVirtualization ? (
  <VirtualizedList items={items} />
) : (
  <RegularList items={items} />
);
```

## Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Components are properly memoized
- [ ] Error handling is comprehensive
- [ ] Memory leaks are prevented
- [ ] Performance optimizations are applied
- [ ] Code is well-documented
- [ ] Naming conventions are followed
- [ ] Tests are written (when applicable)

## Tools and Automation

- **Prettier**: Code formatting
- **ESLint**: Code quality and style enforcement
- **TypeScript**: Type checking
- **Husky**: Git hooks for quality gates
- **Jest**: Unit testing (when implemented)

This style guide ensures consistent, maintainable, and performant code across the entire project.
