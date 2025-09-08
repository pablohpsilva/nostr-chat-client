/**
 * Advanced TypeScript utilities for type safety and developer experience
 */

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Make certain properties required while keeping others optional
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make certain properties optional while keeping others required
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Extract function parameters as a tuple type
 */
export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * Extract function return type
 */
export type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

/**
 * Create a type that requires at least one property from T
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Create a type that allows exactly one property from T
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[P] extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Branded type for better type safety
 */
export type Brand<T, K> = T & { readonly __brand: K };

/**
 * Create a union type from array values
 */
export type ArrayElement<T extends readonly unknown[]> =
  T extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Create a type with snake_case property names
 */
export type SnakeCase<T extends string> = T extends `${infer A}${infer B}`
  ? B extends Uncapitalize<B>
    ? `${Lowercase<A>}${SnakeCase<B>}`
    : `${Lowercase<A>}_${SnakeCase<Uncapitalize<B>>}`
  : Lowercase<T>;

/**
 * Create a type with camelCase property names
 */
export type CamelCase<T extends string> = T extends `${infer A}_${infer B}`
  ? `${A}${Capitalize<CamelCase<B>>}`
  : T;

// =============================================================================
// NOSTR-SPECIFIC TYPES
// =============================================================================

/**
 * Branded types for Nostr entities
 */
export type NostrPublicKey = Brand<string, "NostrPublicKey">;
export type NostrPrivateKey = Brand<string, "NostrPrivateKey">;
export type NostrEventId = Brand<string, "NostrEventId">;
export type NostrSignature = Brand<string, "NostrSignature">;
export type UnixTimestamp = Brand<number, "UnixTimestamp">;
export type NostrKind = Brand<number, "NostrKind">;

/**
 * Type-safe Nostr event structure
 */
export interface StrictNostrEvent {
  readonly id: NostrEventId;
  readonly pubkey: NostrPublicKey;
  readonly created_at: UnixTimestamp;
  readonly kind: NostrKind;
  readonly tags: readonly string[][];
  readonly content: string;
  readonly sig: NostrSignature;
}

/**
 * Nostr filter with proper typing
 */
export interface StrictNostrFilter {
  readonly ids?: readonly NostrEventId[];
  readonly authors?: readonly NostrPublicKey[];
  readonly kinds?: readonly NostrKind[];
  readonly "#e"?: readonly NostrEventId[];
  readonly "#p"?: readonly NostrPublicKey[];
  readonly "#d"?: readonly string[];
  readonly since?: UnixTimestamp;
  readonly until?: UnixTimestamp;
  readonly limit?: number;
  readonly search?: string;
}

// =============================================================================
// REACT-SPECIFIC TYPES
// =============================================================================

/**
 * Extract props from a React component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P>
  ? P
  : never;

/**
 * React component with strict children typing
 */
export type StrictComponent<P = {}> = React.FC<
  P & {
    children?: React.ReactNode;
  }
>;

/**
 * React component that requires children
 */
export type ComponentWithChildren<P = {}> = React.FC<
  P & {
    children: React.ReactNode;
  }
>;

/**
 * Hook return type utility
 */
export type HookReturnType<T> = T extends (...args: any[]) => infer R
  ? R
  : never;

// =============================================================================
// API TYPES
// =============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<TData = unknown> {
  readonly data: TData;
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly timestamp: UnixTimestamp;
}

/**
 * API error response
 */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: UnixTimestamp;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<TData = unknown> {
  readonly data: readonly TData[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Check if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if value is a valid Nostr public key
 */
export function isValidNostrPublicKey(value: string): value is NostrPublicKey {
  return /^[0-9a-f]{64}$/i.test(value);
}

/**
 * Check if value is a valid Nostr private key
 */
export function isValidNostrPrivateKey(
  value: string
): value is NostrPrivateKey {
  return /^[0-9a-f]{64}$/i.test(value);
}

/**
 * Check if value is a valid Unix timestamp
 */
export function isValidUnixTimestamp(value: number): value is UnixTimestamp {
  return isNumber(value) && value > 0 && value < 2147483647; // Max 32-bit timestamp
}

// =============================================================================
// ASSERTION FUNCTIONS
// =============================================================================

/**
 * Assert that value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message || "Value must be defined");
  }
}

/**
 * Assert that value is a string
 */
export function assertString(
  value: unknown,
  message?: string
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || "Value must be a string");
  }
}

/**
 * Assert that value is a number
 */
export function assertNumber(
  value: unknown,
  message?: string
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message || "Value must be a number");
  }
}

/**
 * Assert that value is a valid Nostr public key
 */
export function assertValidNostrPublicKey(
  value: string,
  message?: string
): asserts value is NostrPublicKey {
  if (!isValidNostrPublicKey(value)) {
    throw new Error(message || "Value must be a valid Nostr public key");
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a branded value
 */
export function createBrand<T, K>(value: T): Brand<T, K> {
  return value as Brand<T, K>;
}

/**
 * Remove brand from branded type
 */
export function removeBrand<T, K>(value: Brand<T, K>): T {
  return value as T;
}

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Type-safe array filter with type predicate
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Exhaustive check for switch statements
 */
export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}

export type {
  StrictNostrEvent as NostrEvent,
  StrictNostrFilter as NostrFilter,
} from "./utilities";
