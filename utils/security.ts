/**
 * Security Hardening & Validation Utilities
 * Comprehensive security features for the Nostr chat client
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { analytics } from "./analytics";

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface SecurityConfig {
  enableInputSanitization: boolean;
  enableCSPHeaders: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  enableSecureStorage: boolean;
  sessionTimeout: number;
  enableBiometrics: boolean;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  sanitize?: boolean;
}

interface SecurityEvent {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  details: Record<string, any>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SECURITY_STORAGE_PREFIX = "@nostr_security/";

const DEFAULT_CONFIG: SecurityConfig = {
  enableInputSanitization: true,
  enableCSPHeaders: true,
  enableRateLimiting: true,
  maxRequestsPerMinute: 60,
  enableSecureStorage: true,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  enableBiometrics: false,
};

const NOSTR_VALIDATION_RULES = {
  publicKey: {
    required: true,
    minLength: 64,
    maxLength: 64,
    pattern: /^[0-9a-f]{64}$/i,
    sanitize: true,
  },
  privateKey: {
    required: true,
    minLength: 64,
    maxLength: 64,
    pattern: /^[0-9a-f]{64}$/i,
    sanitize: true,
  },
  eventContent: {
    required: false,
    maxLength: 10000,
    sanitize: true,
    custom: (value: string) => !containsMaliciousContent(value),
  },
  relayUrl: {
    required: true,
    pattern: /^wss?:\/\/[^\s/$.?#].[^\s]*$/i,
    sanitize: true,
    custom: (value: string) => isValidRelayUrl(value),
  },
  eventKind: {
    required: true,
    pattern: /^\d+$/,
    custom: (value: string) => {
      const kind = parseInt(value, 10);
      return kind >= 0 && kind <= 65535;
    },
  },
} as const;

// =============================================================================
// SECURITY MANAGER
// =============================================================================

class SecurityManager {
  private config: SecurityConfig = DEFAULT_CONFIG;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private securityEvents: SecurityEvent[] = [];
  private encryptionKey: string | null = null;

  /**
   * Initialize security manager
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.initializeEncryption();
      this.setupSessionTimeout();

      this.logSecurityEvent("security_initialized", "low", {
        config: this.config,
        platform: Platform.OS,
      });
    } catch (error) {
      this.logSecurityEvent("security_init_failed", "high", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate input according to security rules
   */
  validateInput(
    value: string,
    rules: ValidationRule,
    fieldName?: string
  ): { isValid: boolean; sanitized?: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = value;

    try {
      // Required check
      if (rules.required && (!value || value.trim().length === 0)) {
        errors.push(`${fieldName || "Field"} is required`);
      }

      // Length checks
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(
          `${fieldName || "Field"} must be at least ${
            rules.minLength
          } characters`
        );
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(
          `${fieldName || "Field"} must not exceed ${
            rules.maxLength
          } characters`
        );
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${fieldName || "Field"} has invalid format`);
      }

      // Custom validation
      if (rules.custom && !rules.custom(value)) {
        errors.push(`${fieldName || "Field"} failed custom validation`);
      }

      // Sanitization
      if (rules.sanitize && this.config.enableInputSanitization) {
        sanitized = this.sanitizeInput(value);
      }

      // Log validation attempts for suspicious activity
      if (errors.length > 0) {
        this.logSecurityEvent("input_validation_failed", "medium", {
          fieldName,
          errors,
          valueLength: value.length,
        });
      }

      return {
        isValid: errors.length === 0,
        sanitized,
        errors,
      };
    } catch (error) {
      this.logSecurityEvent("input_validation_error", "high", {
        fieldName,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate Nostr-specific data
   */
  validateNostrData(
    data: Record<string, string>,
    type: keyof typeof NOSTR_VALIDATION_RULES
  ): { isValid: boolean; sanitized: Record<string, string>; errors: string[] } {
    const rules = NOSTR_VALIDATION_RULES[type];
    const result = this.validateInput(data[type], rules, type);

    return {
      isValid: result.isValid,
      sanitized: { [type]: result.sanitized || data[type] },
      errors: result.errors,
    };
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowDuration,
      });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequestsPerMinute) {
      this.logSecurityEvent("rate_limit_exceeded", "medium", {
        identifier,
        count: entry.count,
        limit: this.config.maxRequestsPerMinute,
      });

      return {
        allowed: false,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.rateLimitMap.set(identifier, entry);

    return { allowed: true };
  }

  /**
   * Secure storage operations
   */
  async secureStore(key: string, value: string): Promise<void> {
    try {
      const secureKey = `${SECURITY_STORAGE_PREFIX}${key}`;

      if (this.config.enableSecureStorage && this.encryptionKey) {
        const encrypted = await this.encrypt(value);
        await AsyncStorage.setItem(secureKey, encrypted);
      } else {
        await AsyncStorage.setItem(secureKey, value);
      }
    } catch (error) {
      this.logSecurityEvent("secure_store_failed", "high", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async secureRetrieve(key: string): Promise<string | null> {
    try {
      const secureKey = `${SECURITY_STORAGE_PREFIX}${key}`;
      const value = await AsyncStorage.getItem(secureKey);

      if (!value) return null;

      if (this.config.enableSecureStorage && this.encryptionKey) {
        return await this.decrypt(value);
      }

      return value;
    } catch (error) {
      this.logSecurityEvent("secure_retrieve_failed", "high", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async secureRemove(key: string): Promise<void> {
    try {
      const secureKey = `${SECURITY_STORAGE_PREFIX}${key}`;
      await AsyncStorage.removeItem(secureKey);
    } catch (error) {
      this.logSecurityEvent("secure_remove_failed", "medium", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate secure random values
   */
  generateSecureRandom(length: number = 32): string {
    try {
      return Crypto.getRandomBytes(length).toString();
    } catch (error) {
      // Fallback to less secure method
      this.logSecurityEvent("secure_random_fallback", "medium", {
        error: error instanceof Error ? error.message : String(error),
      });

      return Array.from({ length }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    }
  }

  /**
   * Hash sensitive data
   */
  async hashSensitiveData(data: string, salt?: string): Promise<string> {
    try {
      const saltToUse = salt || this.generateSecureRandom(16);
      const combined = `${data}${saltToUse}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return `${hash}:${saltToUse}`;
    } catch (error) {
      this.logSecurityEvent("hash_failed", "high", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify hashed data
   */
  async verifyHashedData(data: string, hash: string): Promise<boolean> {
    try {
      const [hashedValue, salt] = hash.split(":");
      const computedHash = await this.hashSensitiveData(data, salt);
      const [computedValue] = computedHash.split(":");
      return hashedValue === computedValue;
    } catch (error) {
      this.logSecurityEvent("hash_verification_failed", "medium", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get security events (for monitoring)
   */
  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Clear security events
   */
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Update security configuration
   */
  async updateConfig(updates: Partial<SecurityConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();

    this.logSecurityEvent("config_updated", "low", {
      updates,
    });
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        `${SECURITY_STORAGE_PREFIX}config`
      );
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load security config:", error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${SECURITY_STORAGE_PREFIX}config`,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn("Failed to save security config:", error);
    }
  }

  private async initializeEncryption(): Promise<void> {
    if (!this.config.enableSecureStorage) return;

    try {
      // Try to retrieve existing key
      this.encryptionKey = await AsyncStorage.getItem(
        `${SECURITY_STORAGE_PREFIX}encryption_key`
      );

      if (!this.encryptionKey) {
        // Generate new encryption key
        this.encryptionKey = this.generateSecureRandom(32);
        await AsyncStorage.setItem(
          `${SECURITY_STORAGE_PREFIX}encryption_key`,
          this.encryptionKey
        );
      }
    } catch (error) {
      this.logSecurityEvent("encryption_init_failed", "critical", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not initialized");
    }

    try {
      // Simple XOR encryption (replace with proper encryption in production)
      const encrypted = Array.from(data)
        .map((char, i) =>
          String.fromCharCode(
            char.charCodeAt(0) ^
              this.encryptionKey!.charCodeAt(i % this.encryptionKey!.length)
          )
        )
        .join("");

      return Buffer.from(encrypted).toString("base64");
    } catch (error) {
      this.logSecurityEvent("encryption_failed", "high", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not initialized");
    }

    try {
      const data = Buffer.from(encryptedData, "base64").toString();

      // Reverse XOR encryption
      const decrypted = Array.from(data)
        .map((char, i) =>
          String.fromCharCode(
            char.charCodeAt(0) ^
              this.encryptionKey!.charCodeAt(i % this.encryptionKey!.length)
          )
        )
        .join("");

      return decrypted;
    } catch (error) {
      this.logSecurityEvent("decryption_failed", "high", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();
  }

  private setupSessionTimeout(): void {
    if (this.config.sessionTimeout > 0) {
      setTimeout(() => {
        this.logSecurityEvent("session_timeout", "low", {
          timeout: this.config.sessionTimeout,
        });
        // Implement session cleanup
      }, this.config.sessionTimeout);
    }
  }

  private logSecurityEvent(
    type: string,
    severity: SecurityEvent["severity"],
    details: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      timestamp: Date.now(),
      details,
    };

    this.securityEvents.push(event);

    // Keep only recent events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Report critical events
    if (severity === "critical" || severity === "high") {
      analytics.track("security_event", {
        type,
        severity,
        ...details,
      });
    }

    if (__DEV__) {
      console.warn(
        `Security Event [${severity.toUpperCase()}]: ${type}`,
        details
      );
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function containsMaliciousContent(content: string): boolean {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(content));
}

function isValidRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "ws:" || parsed.protocol === "wss:") &&
      parsed.hostname.length > 0 &&
      !parsed.hostname.includes("localhost") // Restrict localhost in production
    );
  } catch {
    return false;
  }
}

/**
 * Hook for secure form validation
 */
export function useSecureValidation() {
  return useCallback(
    (value: string, rules: ValidationRule, fieldName?: string) => {
      return security.validateInput(value, rules, fieldName);
    },
    []
  );
}

/**
 * Hook for rate limiting
 */
export function useRateLimit(identifier: string) {
  return useCallback(() => {
    return security.checkRateLimit(identifier);
  }, [identifier]);
}

/**
 * Hook for secure storage
 */
export function useSecureStorage() {
  const store = useCallback((key: string, value: string) => {
    return security.secureStore(key, value);
  }, []);

  const retrieve = useCallback((key: string) => {
    return security.secureRetrieve(key);
  }, []);

  const remove = useCallback((key: string) => {
    return security.secureRemove(key);
  }, []);

  return { store, retrieve, remove };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const security = new SecurityManager();

export type { SecurityConfig, SecurityEvent, ValidationRule };

// Hooks and constants are exported above as individual exports
