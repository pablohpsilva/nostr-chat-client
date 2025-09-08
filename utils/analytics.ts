/**
 * Privacy-Respecting Analytics & Crash Reporting
 * Implements local-first analytics with optional remote reporting
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { errorHandler } from "./errorHandling";
import { performanceMonitor } from "./performanceMonitor";

// =============================================================================
// REACT HOOKS
// =============================================================================

import React, { useEffect, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface AnalyticsConfig {
  enabled: boolean;
  localOnly: boolean;
  maxStorageSize: number;
  batchSize: number;
  flushInterval: number;
  anonymizeData: boolean;
}

interface AnalyticsEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string; // Optional, hashed if provided
  platform: string;
  version: string;
}

interface CrashReport {
  id: string;
  error: Error;
  errorInfo?: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
  platform: string;
  version: string;
  stackTrace: string;
  breadcrumbs: string[];
  userAgent?: string;
  memoryUsage?: any;
}

interface UserMetrics {
  sessionDuration: number;
  screenViews: Record<string, number>;
  interactions: Record<string, number>;
  errors: number;
  crashes: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  ANALYTICS_CONFIG: "@nostr_chat/analytics_config",
  ANALYTICS_EVENTS: "@nostr_chat/analytics_events",
  CRASH_REPORTS: "@nostr_chat/crash_reports",
  SESSION_ID: "@nostr_chat/session_id",
  USER_METRICS: "@nostr_chat/user_metrics",
  BREADCRUMBS: "@nostr_chat/breadcrumbs",
} as const;

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  localOnly: true, // Privacy-first: local only by default
  maxStorageSize: 1000, // Max events to store
  batchSize: 50,
  flushInterval: 60000, // 1 minute
  anonymizeData: true,
};

const MAX_BREADCRUMBS = 20;

// =============================================================================
// ANALYTICS MANAGER
// =============================================================================

class AnalyticsManager {
  private config: AnalyticsConfig = DEFAULT_CONFIG;
  private sessionId: string = "";
  private breadcrumbs: string[] = [];
  private eventQueue: AnalyticsEvent[] = [];
  private crashQueue: CrashReport[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  /**
   * Initialize analytics system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load configuration
      await this.loadConfig();

      // Generate session ID
      this.sessionId = this.generateSessionId();
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);

      // Load existing data
      await this.loadStoredData();

      // Setup flush timer
      this.setupFlushTimer();

      // Setup error boundary integration
      this.setupErrorBoundaryIntegration();

      this.initialized = true;

      this.track("analytics_initialized", {
        config: this.config,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error("Failed to initialize analytics:", error);
    }
  }

  /**
   * Track an analytics event
   */
  async track(
    eventType: string,
    data: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        type: eventType,
        data: this.config.anonymizeData ? this.anonymizeData(data) : data,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: userId ? this.hashUserId(userId) : undefined,
        platform: Platform.OS,
        version: this.getAppVersion(),
      };

      this.eventQueue.push(event);
      this.addBreadcrumb(`Event: ${eventType}`);

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }

      await this.saveEventQueue();
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(
    screenName: string,
    params?: Record<string, any>
  ): Promise<void> {
    await this.track("screen_view", {
      screen: screenName,
      ...params,
    });

    // Update user metrics
    await this.updateUserMetrics("screenViews", screenName);
  }

  /**
   * Track user interaction
   */
  async trackInteraction(
    element: string,
    action: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.track("user_interaction", {
      element,
      action,
      ...context,
    });

    await this.updateUserMetrics("interactions", `${element}_${action}`);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    metric: string,
    value: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.track("performance_metric", {
      metric,
      value,
      ...context,
    });
  }

  /**
   * Report a crash
   */
  async reportCrash(
    error: Error,
    errorInfo?: any,
    userId?: string
  ): Promise<void> {
    try {
      const memoryUsage = performanceMonitor.getMemoryUsage();

      const crashReport: CrashReport = {
        id: this.generateEventId(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } as Error,
        errorInfo,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: userId ? this.hashUserId(userId) : undefined,
        platform: Platform.OS,
        version: this.getAppVersion(),
        stackTrace: error.stack || "",
        breadcrumbs: [...this.breadcrumbs],
        userAgent: this.getUserAgent(),
        memoryUsage,
      };

      this.crashQueue.push(crashReport);
      await this.saveCrashQueue();

      // Update user metrics
      await this.updateUserMetrics("crashes");

      // Immediate flush for crashes
      await this.flushCrashes();

      this.addBreadcrumb(`Crash: ${error.message}`);
    } catch (reportError) {
      console.error("Failed to report crash:", reportError);
    }
  }

  /**
   * Set user consent for analytics
   */
  async setConsent(enabled: boolean, localOnly: boolean = true): Promise<void> {
    this.config.enabled = enabled;
    this.config.localOnly = localOnly;
    await this.saveConfig();

    this.track("consent_updated", {
      enabled,
      localOnly,
    });
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<{
    events: number;
    crashes: number;
    sessions: number;
    metrics: UserMetrics;
  }> {
    const events = this.eventQueue.length;
    const crashes = this.crashQueue.length;
    const metrics = await this.getUserMetrics();

    return {
      events,
      crashes,
      sessions: 1, // Current session
      metrics,
    };
  }

  /**
   * Export analytics data (for user privacy requests)
   */
  async exportData(): Promise<{
    events: AnalyticsEvent[];
    crashes: CrashReport[];
    metrics: UserMetrics;
    config: AnalyticsConfig;
  }> {
    const metrics = await this.getUserMetrics();

    return {
      events: this.eventQueue,
      crashes: this.crashQueue,
      metrics,
      config: this.config,
    };
  }

  /**
   * Clear all analytics data
   */
  async clearData(): Promise<void> {
    this.eventQueue = [];
    this.crashQueue = [];
    this.breadcrumbs = [];

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ANALYTICS_EVENTS),
      AsyncStorage.removeItem(STORAGE_KEYS.CRASH_REPORTS),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_METRICS),
      AsyncStorage.removeItem(STORAGE_KEYS.BREADCRUMBS),
    ]);

    this.track("data_cleared");
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_CONFIG);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load analytics config:", error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ANALYTICS_CONFIG,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn("Failed to save analytics config:", error);
    }
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [events, crashes, breadcrumbs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_EVENTS),
        AsyncStorage.getItem(STORAGE_KEYS.CRASH_REPORTS),
        AsyncStorage.getItem(STORAGE_KEYS.BREADCRUMBS),
      ]);

      if (events) {
        this.eventQueue = JSON.parse(events);
      }

      if (crashes) {
        this.crashQueue = JSON.parse(crashes);
      }

      if (breadcrumbs) {
        this.breadcrumbs = JSON.parse(breadcrumbs);
      }
    } catch (error) {
      console.warn("Failed to load stored analytics data:", error);
    }
  }

  private async saveEventQueue(): Promise<void> {
    try {
      // Limit storage size
      if (this.eventQueue.length > this.config.maxStorageSize) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxStorageSize);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.ANALYTICS_EVENTS,
        JSON.stringify(this.eventQueue)
      );
    } catch (error) {
      console.warn("Failed to save event queue:", error);
    }
  }

  private async saveCrashQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CRASH_REPORTS,
        JSON.stringify(this.crashQueue)
      );
    } catch (error) {
      console.warn("Failed to save crash queue:", error);
    }
  }

  private addBreadcrumb(message: string): void {
    this.breadcrumbs.push(`${new Date().toISOString()}: ${message}`);

    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-MAX_BREADCRUMBS);
    }

    // Save breadcrumbs
    AsyncStorage.setItem(
      STORAGE_KEYS.BREADCRUMBS,
      JSON.stringify(this.breadcrumbs)
    ).catch(() => {});
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval) as unknown as NodeJS.Timeout;
  }

  private setupErrorBoundaryIntegration(): void {
    // Integrate with error handler
    const originalHandle = errorHandler.handle;
    errorHandler.handle = (error: Error, context?: string) => {
      // Call original handler
      originalHandle.call(errorHandler, error, context);

      // Report to analytics
      this.reportCrash(error, { context });
    };
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      if (!this.config.localOnly) {
        // Send to remote analytics service (if user consented)
        await this.sendEventsToRemote(this.eventQueue);
      }

      // Clear sent events
      this.eventQueue = [];
      await this.saveEventQueue();
    } catch (error) {
      console.warn("Failed to flush analytics:", error);
    }
  }

  private async flushCrashes(): Promise<void> {
    if (this.crashQueue.length === 0) return;

    try {
      if (!this.config.localOnly) {
        // Send crash reports to remote service
        await this.sendCrashesToRemote(this.crashQueue);
      }

      // Keep crash reports locally for debugging
      // Don't clear immediately
    } catch (error) {
      console.warn("Failed to flush crashes:", error);
    }
  }

  private async sendEventsToRemote(events: AnalyticsEvent[]): Promise<void> {
    // Implement remote analytics service integration
    // e.g., send to privacy-respecting analytics service
    console.log("Sending events to remote:", events.length);
  }

  private async sendCrashesToRemote(crashes: CrashReport[]): Promise<void> {
    // Implement remote crash reporting service integration
    console.log("Sending crashes to remote:", crashes.length);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashUserId(userId: string): string {
    if (!this.config.anonymizeData) return userId;

    // Simple hash for anonymization
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  private anonymizeData(data: Record<string, any>): Record<string, any> {
    const anonymized = { ...data };

    // Remove potentially sensitive fields
    const sensitiveFields = [
      "email",
      "phone",
      "address",
      "privateKey",
      "secretKey",
      "password",
      "token",
    ];

    sensitiveFields.forEach((field) => {
      if (anonymized[field]) {
        anonymized[field] = "[REDACTED]";
      }
    });

    return anonymized;
  }

  private getAppVersion(): string {
    // Get from app.json or package.json
    return "1.0.0"; // Replace with actual version
  }

  private getUserAgent(): string {
    return `NostrChatClient/${this.getAppVersion()} (${Platform.OS} ${
      Platform.Version
    })`;
  }

  private async updateUserMetrics(
    category: keyof UserMetrics,
    key?: string
  ): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_METRICS);
      let metrics: UserMetrics = stored
        ? JSON.parse(stored)
        : {
            sessionDuration: 0,
            screenViews: {},
            interactions: {},
            errors: 0,
            crashes: 0,
          };

      if (key) {
        if (category === "screenViews" || category === "interactions") {
          metrics[category][key] = (metrics[category][key] || 0) + 1;
        }
      } else {
        if (category === "errors" || category === "crashes") {
          metrics[category]++;
        }
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_METRICS,
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.warn("Failed to update user metrics:", error);
    }
  }

  private async getUserMetrics(): Promise<UserMetrics> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_METRICS);
      return stored
        ? JSON.parse(stored)
        : {
            sessionDuration: 0,
            screenViews: {},
            interactions: {},
            errors: 0,
            crashes: 0,
          };
    } catch (error) {
      return {
        sessionDuration: 0,
        screenViews: {},
        interactions: {},
        errors: 0,
        crashes: 0,
      };
    }
  }
}

/**
 * Hook for tracking screen views automatically
 */
export function useAnalyticsScreenView(
  screenName: string,
  params?: Record<string, any>
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      analytics.trackScreenView(screenName, params);
      hasTracked.current = true;
    }
  }, [screenName, params]);
}

/**
 * Hook for tracking user interactions
 */
export function useAnalyticsInteraction() {
  return React.useCallback(
    (element: string, action: string, context?: Record<string, any>) => {
      analytics.trackInteraction(element, action, context);
    },
    []
  );
}

/**
 * Hook for performance tracking
 */
export function useAnalyticsPerformance() {
  return React.useCallback(
    (metric: string, value: number, context?: Record<string, any>) => {
      analytics.trackPerformance(metric, value, context);
    },
    []
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export const analytics = new AnalyticsManager();

export type { AnalyticsConfig, AnalyticsEvent, CrashReport, UserMetrics };

// Hooks are exported above as individual function exports
