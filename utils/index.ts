/**
 * Utilities Barrel Exports
 * Provides organized access to all utility functions
 */

// =============================================================================
// ERROR HANDLING
// =============================================================================
export { NostrError, errorHandler, withRetry } from "./errorHandling";

// =============================================================================
// PERFORMANCE & MONITORING
// =============================================================================
export {
  measureAsyncPerformance,
  measurePerformance,
  performanceMonitor,
  usePerformanceMonitor,
} from "./performanceMonitor";
export type { MemoryUsage, PerformanceMetric } from "./performanceMonitor";

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================
export {
  DebouncedSubscriptionManager,
  generateSubscriptionId,
  useSubscriptionManager,
} from "./subscriptionManager";

// =============================================================================
// CACHING
// =============================================================================
export { SubscriptionCache, subscriptionCache } from "./subscriptionCache";
export type { SubscriptionCacheOptions } from "./subscriptionCache";

// =============================================================================
// LAZY LOADING
// =============================================================================
export {
  LazyComponents,
  default as LoadingFallback,
  createLazyComponent,
  withLazyLoading,
} from "./lazyLoading";

// =============================================================================
// STORAGE
// =============================================================================
export { getStoredData, removeStoredData, setStoredData } from "./storage";

// =============================================================================
// TYPE UTILITIES
// =============================================================================
export type * from "../types/utilities";
export {
  assertDefined,
  assertNever,
  assertNumber,
  assertString,
  assertValidNostrPublicKey,
  createBrand,
  filterDefined,
  isArray,
  isDefined,
  isNumber,
  isObject,
  isString,
  isValidNostrPrivateKey,
  isValidNostrPublicKey,
  isValidUnixTimestamp,
  removeBrand,
  typedEntries,
  typedKeys,
} from "../types/utilities";
