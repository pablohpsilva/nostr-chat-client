# Development Guide

This comprehensive guide covers development practices, tools, and workflows for the Nostream Chat Client project.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Code Quality Tools](#code-quality-tools)
- [Performance Guidelines](#performance-guidelines)
- [Architecture Overview](#architecture-overview)
- [Debugging Guide](#debugging-guide)

## Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Expo CLI
- React Native development environment

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on specific platform
pnpm ios     # iOS simulator
pnpm android # Android emulator
pnpm web     # Web browser
```

### Development Scripts

```bash
# Code quality
pnpm lint       # ESLint check
pnpm lint:fix   # ESLint auto-fix
pnpm type-check # TypeScript check
pnpm format     # Prettier format

# Testing
pnpm test       # Run all tests
pnpm test:watch # Watch mode
pnpm test:coverage # Coverage report

# Performance
pnpm analyze    # Bundle analysis
pnpm perf       # Performance monitoring
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/chat-improvements

# Make changes with proper commits
git add .
git commit -m "feat: add message virtualization for performance"

# Run quality checks
pnpm lint && pnpm type-check && pnpm test

# Push and create PR
git push origin feature/chat-improvements
```

### 2. Code Review Checklist

#### TypeScript

- [ ] No `any` types used
- [ ] Proper interfaces and type guards
- [ ] Branded types for domain values
- [ ] Assertion functions where appropriate

#### React

- [ ] Components properly memoized
- [ ] Hooks follow best practices
- [ ] No memory leaks in useEffect
- [ ] Proper dependency arrays

#### Performance

- [ ] Expensive operations memoized
- [ ] Virtual scrolling for large lists
- [ ] Lazy loading implemented
- [ ] Bundle size impact checked

#### Error Handling

- [ ] Comprehensive error boundaries
- [ ] Proper error types and codes
- [ ] User-friendly error messages
- [ ] Analytics/logging implemented

#### Testing

- [ ] Unit tests for utilities
- [ ] Component tests for UI
- [ ] Integration tests for flows
- [ ] Edge cases covered

## Testing Strategy

### Unit Tests

```typescript
// utils/__tests__/errorHandling.test.ts
describe("errorHandler", () => {
  it("should handle NostrError correctly", () => {
    const error = new NostrError("Test", "CODE", { context: "data" });
    errorHandler.handle(error);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[CODE] Test")
    );
  });
});
```

### Component Tests

```typescript
// components/__tests__/ChatMessage.test.tsx
describe("ChatMessage", () => {
  it("should render message content", () => {
    render(
      <ChatMessage
        content="Hello World"
        timestamp={1234567890}
        isFromMe={false}
      />
    );

    expect(screen.getByText("Hello World")).toBeTruthy();
  });
});
```

### Integration Tests

```typescript
// __tests__/chat-flow.test.tsx
describe("Chat Flow", () => {
  it("should send and receive messages", async () => {
    const { user } = setup(<ChatScreen />);

    await user.type(screen.getByPlaceholderText("Type message"), "Hello");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeTruthy();
    });
  });
});
```

### Performance Tests

```typescript
// __tests__/performance.test.tsx
describe("Performance", () => {
  it("should handle large message lists efficiently", () => {
    const largeMessageList = generateMessages(10000);

    const { renderTime } = measureRenderTime(() => {
      render(<MessageList messages={largeMessageList} />);
    });

    expect(renderTime).toBeLessThan(100); // ms
  });
});
```

## Code Quality Tools

### ESLint Configuration

```javascript
// eslint.config.js
module.exports = {
  extends: [
    "expo",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "error",
    "prefer-const": "error",
  },
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Performance Guidelines

### Component Optimization

```typescript
// ✅ Good: Memoized component
const ChatMessage = React.memo(({ content, timestamp, isFromMe }) => {
  const formattedTime = useMemo(
    () => dayjs(timestamp * 1000).format("HH:mm"),
    [timestamp]
  );

  const containerStyles = useMemo(
    () => [styles.container, isFromMe && styles.myMessage],
    [isFromMe]
  );

  return (
    <View style={containerStyles}>
      <Text>{content}</Text>
      <Text>{formattedTime}</Text>
    </View>
  );
});
```

### Hook Optimization

```typescript
// ✅ Good: Optimized hook
function useNostrSubscription(filters, options) {
  const callbackRef = useRef(options.onEvent);

  // Update ref without triggering re-subscription
  useEffect(() => {
    callbackRef.current = options.onEvent;
  }, [options.onEvent]);

  // Memoize filters to prevent unnecessary re-subscriptions
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Stable subscription
  useEffect(() => {
    const sub = subscribe(memoizedFilters, callbackRef.current);
    return () => sub.unsubscribe();
  }, [memoizedFilters]);
}
```

### Memory Management

```typescript
// ✅ Good: Memory-bounded cache
class MessageCache {
  private cache = new Map();
  private readonly maxSize = 1000;

  set(key: string, value: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────┐
│           App/UI Layer              │ ← React components, screens
├─────────────────────────────────────┤
│          Hooks Layer                │ ← Custom hooks, state logic
├─────────────────────────────────────┤
│         Store Layer                 │ ← Zustand stores, state mgmt
├─────────────────────────────────────┤
│         Utils Layer                 │ ← Utilities, helpers, cache
├─────────────────────────────────────┤
│       Nostr/Core Layer              │ ← NDK, nostr-tools, crypto
└─────────────────────────────────────┘
```

### Data Flow

```
User Action → Component → Hook → Store → Utils → Nostr Layer
     ↑                                              ↓
UI Update ← Component ← Hook ← Store ← Cache ← Event Stream
```

### Key Patterns

1. **Unified Context**: Single source of truth for Nostr functionality
2. **Subscription Caching**: Smart caching to reduce redundant requests
3. **Error Boundaries**: Comprehensive error handling at all levels
4. **Performance Monitoring**: Built-in performance tracking
5. **Type Safety**: Strict TypeScript with branded types

## Debugging Guide

### React DevTools

```bash
# Install React DevTools
npx react-devtools

# Start app with debugging
pnpm dev:debug
```

### Performance Profiling

```typescript
// Use performance monitor
import { performanceMonitor } from "@/utils";

// Time operations
performanceMonitor.timeFunction("renderMessages", () => {
  return renderMessages(messages);
});

// Monitor memory
performanceMonitor.recordMemoryUsage();

// Get metrics
const metrics = performanceMonitor.exportData();
console.log("Performance metrics:", metrics);
```

### Error Debugging

```typescript
// Use error handler
try {
  await publishMessage(message);
} catch (error) {
  errorHandler.handle(error, "MessagePublish");
  // Error is logged with context
}
```

### Network Debugging

```typescript
// Enable Nostr debug logs
localStorage.setItem("debug", "nostr:*");

// Monitor subscription cache
import { subscriptionCache } from "@/utils";
console.log("Cache stats:", subscriptionCache.getStats());
```

### Common Issues

#### Memory Leaks

```typescript
// ❌ Bad: No cleanup
useEffect(() => {
  const subscription = createSubscription();
  // Missing cleanup!
}, []);

// ✅ Good: Proper cleanup
useEffect(() => {
  const subscription = createSubscription();
  return () => subscription.cleanup();
}, []);
```

#### Performance Issues

```typescript
// ❌ Bad: Unnecessary re-renders
const MessageList = ({ messages }) => {
  return messages.map((msg) => <Message key={Math.random()} {...msg} />);
};

// ✅ Good: Stable keys, memoization
const MessageList = React.memo(({ messages }) => {
  return messages.map((msg) => <Message key={msg.id} {...msg} />);
});
```

#### Type Issues

```typescript
// ❌ Bad: Loose typing
function processEvent(event: any) {
  return event.content;
}

// ✅ Good: Strict typing
function processEvent(event: NostrEvent): string {
  assertValidNostrEvent(event);
  return event.content;
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test --coverage
      - run: pnpm build
```

### Pre-commit Hooks

```bash
# Install husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "pnpm lint-staged"
```

This development guide ensures consistent, high-quality development practices across the entire team.
