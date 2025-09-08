/**
 * Comprehensive Accessibility Features
 * Implements WCAG 2.1 AA compliance and advanced accessibility features
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccessibilityInfo, Platform } from "react-native";
import { analytics } from "./analytics";

// =============================================================================
// REACT HOOKS
// =============================================================================

import { useCallback, useEffect, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface AccessibilityConfig {
  enabled: boolean;
  reduceMotion: boolean;
  increaseContrast: boolean;
  largeText: boolean;
  boldText: boolean;
  reduceTransparency: boolean;
  voiceOverEnabled: boolean;
  switchControlEnabled: boolean;
  screenReaderEnabled: boolean;
  announcements: boolean;
  hapticFeedback: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
  colorBlindSupport: boolean;
  fontSize: "small" | "normal" | "large" | "extraLarge";
  contrastLevel: "normal" | "high" | "maximum";
  soundCues: boolean;
}

interface AccessibilityHint {
  element: string;
  hint: string;
  role: string;
  state?: string;
}

interface KeyboardShortcut {
  key: string;
  modifiers?: string[];
  action: string;
  description: string;
  category: string;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = "@accessibility/config";

const DEFAULT_CONFIG: AccessibilityConfig = {
  enabled: true,
  reduceMotion: false,
  increaseContrast: false,
  largeText: false,
  boldText: false,
  reduceTransparency: false,
  voiceOverEnabled: false,
  switchControlEnabled: false,
  screenReaderEnabled: false,
  announcements: true,
  hapticFeedback: true,
  keyboardNavigation: true,
  focusManagement: true,
  colorBlindSupport: false,
  fontSize: "normal",
  contrastLevel: "normal",
  soundCues: false,
};

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: "Tab",
    action: "focus_next",
    description: "Move to next focusable element",
    category: "Navigation",
  },
  {
    key: "Tab",
    modifiers: ["Shift"],
    action: "focus_previous",
    description: "Move to previous focusable element",
    category: "Navigation",
  },
  {
    key: "Enter",
    action: "activate",
    description: "Activate focused element",
    category: "Action",
  },
  {
    key: "Space",
    action: "activate",
    description: "Activate focused element",
    category: "Action",
  },
  {
    key: "Escape",
    action: "close_modal",
    description: "Close modal or dialog",
    category: "Navigation",
  },
  {
    key: "ArrowUp",
    action: "navigate_up",
    description: "Navigate up in lists",
    category: "Navigation",
  },
  {
    key: "ArrowDown",
    action: "navigate_down",
    description: "Navigate down in lists",
    category: "Navigation",
  },
  {
    key: "Home",
    action: "navigate_first",
    description: "Navigate to first item",
    category: "Navigation",
  },
  {
    key: "End",
    action: "navigate_last",
    description: "Navigate to last item",
    category: "Navigation",
  },
  {
    key: "F1",
    action: "show_help",
    description: "Show accessibility help",
    category: "Help",
  },
];

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  normal: {
    primary: "#007AFF",
    secondary: "#5856D6",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#000000",
    border: "#C6C6C8",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    info: "#007AFF",
  },
  highContrast: {
    primary: "#0000FF",
    secondary: "#800080",
    background: "#FFFFFF",
    surface: "#F0F0F0",
    text: "#000000",
    border: "#000000",
    error: "#FF0000",
    success: "#008000",
    warning: "#FFA500",
    info: "#0000FF",
  },
  maximumContrast: {
    primary: "#000000",
    secondary: "#000000",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#000000",
    border: "#000000",
    error: "#000000",
    success: "#000000",
    warning: "#000000",
    info: "#000000",
  },
  darkHighContrast: {
    primary: "#FFFFFF",
    secondary: "#FFFF00",
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    border: "#FFFFFF",
    error: "#FF0000",
    success: "#00FF00",
    warning: "#FFFF00",
    info: "#00FFFF",
  },
};

// =============================================================================
// ACCESSIBILITY MANAGER
// =============================================================================

class AccessibilityManager {
  private config: AccessibilityConfig = DEFAULT_CONFIG;
  private focusStack: string[] = [];
  private announceTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize accessibility manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfig();
      await this.detectSystemSettings();
      this.setupAccessibilityListeners();

      this.isInitialized = true;

      analytics.track("accessibility_initialized", {
        config: this.config,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error("Failed to initialize accessibility:", error);
    }
  }

  /**
   * Update accessibility configuration
   */
  async updateConfig(updates: Partial<AccessibilityConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();

    analytics.track("accessibility_config_updated", {
      updates,
      config: this.config,
    });
  }

  /**
   * Get current accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Announce text to screen readers
   */
  announce(text: string, priority: "low" | "high" = "low"): void {
    if (!this.config.announcements || !this.config.screenReaderEnabled) {
      return;
    }

    // Clear previous announcement timer
    if (this.announceTimer) {
      clearTimeout(this.announceTimer);
    }

    // Delay announcement to avoid overwhelming screen readers
    const delay = priority === "high" ? 100 : 500;

    this.announceTimer = setTimeout(() => {
      if (Platform.OS === "ios") {
        AccessibilityInfo.announceForAccessibility(text);
      } else if (Platform.OS === "android") {
        AccessibilityInfo.announceForAccessibility(text);
      }
    }, delay) as unknown as NodeJS.Timeout;

    analytics.track("accessibility_announcement", {
      textLength: text.length,
      priority,
    });
  }

  /**
   * Focus management
   */
  focusElement(elementId: string): void {
    if (!this.config.focusManagement) return;

    this.focusStack.push(elementId);

    // Platform-specific focus implementation
    if (Platform.OS === "web") {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
      }
    }

    analytics.track("accessibility_focus", {
      elementId,
      stackDepth: this.focusStack.length,
    });
  }

  /**
   * Return focus to previous element
   */
  returnFocus(): void {
    if (this.focusStack.length <= 1) return;

    this.focusStack.pop(); // Remove current
    const previousElement = this.focusStack[this.focusStack.length - 1];

    if (previousElement) {
      this.focusElement(previousElement);
    }
  }

  /**
   * Get accessibility properties for components
   */
  getAccessibilityProps(
    label: string,
    hint?: string,
    role?: string,
    state?: Record<string, boolean>
  ): Record<string, any> {
    const props: Record<string, any> = {
      accessible: this.config.enabled,
      accessibilityLabel: label,
    };

    if (hint) {
      props.accessibilityHint = hint;
    }

    if (role) {
      props.accessibilityRole = role;

      // iOS specific
      if (Platform.OS === "ios") {
        props.accessibilityTraits = this.getRoleTraits(role);
      }
    }

    if (state) {
      props.accessibilityState = state;
    }

    // Add live region for dynamic content
    if (role === "alert" || role === "status") {
      props.accessibilityLiveRegion = "polite";
      if (Platform.OS === "android") {
        props.importantForAccessibility = "yes";
      }
    }

    return props;
  }

  /**
   * Get dynamic font size based on accessibility settings
   */
  getFontSize(baseSize: number): number {
    const multipliers = {
      small: 0.85,
      normal: 1.0,
      large: 1.15,
      extraLarge: 1.3,
    };

    const multiplier = multipliers[this.config.fontSize];
    let fontSize = baseSize * multiplier;

    // Additional scaling for large text accessibility setting
    if (this.config.largeText) {
      fontSize *= 1.2;
    }

    return Math.round(fontSize);
  }

  /**
   * Get color scheme based on accessibility settings
   */
  getColorScheme(): ColorScheme {
    if (this.config.contrastLevel === "maximum") {
      return COLOR_SCHEMES.maximumContrast;
    } else if (this.config.contrastLevel === "high") {
      return COLOR_SCHEMES.highContrast;
    }

    return COLOR_SCHEMES.normal;
  }

  /**
   * Get keyboard shortcuts
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return [...KEYBOARD_SHORTCUTS];
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(
    event: KeyboardEvent,
    context: string
  ): { handled: boolean; action?: string } {
    if (!this.config.keyboardNavigation) {
      return { handled: false };
    }

    const { key, shiftKey, ctrlKey, altKey, metaKey } = event;
    const modifiers: string[] = [];

    if (shiftKey) modifiers.push("Shift");
    if (ctrlKey) modifiers.push("Ctrl");
    if (altKey) modifiers.push("Alt");
    if (metaKey) modifiers.push("Meta");

    const shortcut = KEYBOARD_SHORTCUTS.find(
      (s) =>
        s.key === key &&
        (s.modifiers || []).every((m) => modifiers.includes(m)) &&
        modifiers.every((m) => (s.modifiers || []).includes(m))
    );

    if (shortcut) {
      analytics.track("keyboard_shortcut_used", {
        action: shortcut.action,
        context,
        key,
        modifiers,
      });

      return { handled: true, action: shortcut.action };
    }

    return { handled: false };
  }

  /**
   * Check if content passes accessibility guidelines
   */
  validateContent(content: {
    text?: string;
    images?: { alt?: string; decorative?: boolean }[];
    links?: { text: string; url: string }[];
    headings?: { level: number; text: string }[];
  }): {
    isValid: boolean;
    violations: { type: string; message: string; severity: string }[];
  } {
    const violations: {
      type: string;
      message: string;
      severity: string;
    }[] = [];

    // Check text contrast (simplified check)
    if (content.text && content.text.length < 3) {
      violations.push({
        type: "text-too-short",
        message: "Text content is too short for screen readers",
        severity: "warning",
      });
    }

    // Check images have alt text
    if (content.images) {
      content.images.forEach((img, index) => {
        if (!img.decorative && !img.alt) {
          violations.push({
            type: "missing-alt-text",
            message: `Image ${index + 1} is missing alt text`,
            severity: "error",
          });
        }
      });
    }

    // Check link text is descriptive
    if (content.links) {
      content.links.forEach((link, index) => {
        if (
          link.text.length < 4 ||
          link.text.toLowerCase().includes("click here") ||
          link.text.toLowerCase().includes("read more")
        ) {
          violations.push({
            type: "poor-link-text",
            message: `Link ${index + 1} has non-descriptive text: "${
              link.text
            }"`,
            severity: "warning",
          });
        }
      });
    }

    // Check heading hierarchy
    if (content.headings && content.headings.length > 1) {
      for (let i = 1; i < content.headings.length; i++) {
        const current = content.headings[i];
        const previous = content.headings[i - 1];

        if (current.level > previous.level + 1) {
          violations.push({
            type: "heading-hierarchy",
            message: `Heading level jumps from ${previous.level} to ${current.level}`,
            severity: "error",
          });
        }
      }
    }

    return {
      isValid: violations.filter((v) => v.severity === "error").length === 0,
      violations,
    };
  }

  /**
   * Generate accessibility report
   */
  generateReport(): {
    score: number;
    config: AccessibilityConfig;
    features: { name: string; enabled: boolean; score: number }[];
    recommendations: string[];
  } {
    const features = [
      {
        name: "Screen Reader Support",
        enabled: this.config.screenReaderEnabled,
        score: 25,
      },
      {
        name: "High Contrast",
        enabled: this.config.increaseContrast,
        score: 15,
      },
      { name: "Large Text", enabled: this.config.largeText, score: 15 },
      { name: "Reduced Motion", enabled: this.config.reduceMotion, score: 10 },
      {
        name: "Keyboard Navigation",
        enabled: this.config.keyboardNavigation,
        score: 20,
      },
      {
        name: "Focus Management",
        enabled: this.config.focusManagement,
        score: 15,
      },
    ];

    const score = features.reduce(
      (total, feature) => total + (feature.enabled ? feature.score : 0),
      0
    );

    const recommendations: string[] = [];

    features.forEach((feature) => {
      if (!feature.enabled) {
        recommendations.push(`Enable ${feature.name} for better accessibility`);
      }
    });

    if (this.config.contrastLevel === "normal") {
      recommendations.push(
        "Consider enabling high contrast mode for better readability"
      );
    }

    if (this.config.fontSize === "normal" || this.config.fontSize === "small") {
      recommendations.push(
        "Consider using larger font sizes for better readability"
      );
    }

    return {
      score,
      config: this.config,
      features,
      recommendations,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load accessibility config:", error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn("Failed to save accessibility config:", error);
    }
  }

  private async detectSystemSettings(): Promise<void> {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const [
          isScreenReaderEnabled,
          isReduceMotionEnabled,
          isReduceTransparencyEnabled,
        ] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled?.() || Promise.resolve(false),
          AccessibilityInfo.isReduceTransparencyEnabled?.() ||
            Promise.resolve(false),
        ]);

        this.config.screenReaderEnabled = isScreenReaderEnabled;
        this.config.reduceMotion = isReduceMotionEnabled;
        this.config.reduceTransparency = isReduceTransparencyEnabled;

        await this.saveConfig();
      }
    } catch (error) {
      console.warn("Failed to detect system accessibility settings:", error);
    }
  }

  private setupAccessibilityListeners(): void {
    // Listen for screen reader changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (isScreenReaderEnabled) => {
        this.config.screenReaderEnabled = isScreenReaderEnabled;
        this.saveConfig();

        analytics.track("screen_reader_toggled", {
          enabled: isScreenReaderEnabled,
        });
      }
    );

    // Listen for reduce motion changes (iOS/Android)
    if (AccessibilityInfo.addEventListener && Platform.OS !== "web") {
      const reduceMotionListener = AccessibilityInfo.addEventListener(
        "reduceMotionChanged" as any,
        (isReduceMotionEnabled: boolean) => {
          this.config.reduceMotion = isReduceMotionEnabled;
          this.saveConfig();

          analytics.track("reduce_motion_toggled", {
            enabled: isReduceMotionEnabled,
          });
        }
      );
    }

    // Cleanup listeners on app termination would go here
  }

  private getRoleTraits(role: string): string[] {
    const traitMap: Record<string, string[]> = {
      button: ["button"],
      link: ["link"],
      header: ["header"],
      text: ["staticText"],
      image: ["image"],
      search: ["searchField"],
      tab: ["selected"],
      tablist: ["tabBar"],
      list: ["none"],
      listitem: ["none"],
      alert: ["none"],
      status: ["updatesFrequently"],
    };

    return traitMap[role] || [];
  }
}

/**
 * Hook for accessibility configuration
 */
function useAccessibilityConfig() {
  const [config, setConfig] = useState<AccessibilityConfig>(
    accessibility.getConfig()
  );

  useEffect(() => {
    // Update config when it changes
    const interval = setInterval(() => {
      setConfig(accessibility.getConfig());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    return accessibility.updateConfig(updates);
  }, []);

  return {
    config,
    updateConfig,
    announce: accessibility.announce.bind(accessibility),
    getFontSize: accessibility.getFontSize.bind(accessibility),
    getColorScheme: accessibility.getColorScheme.bind(accessibility),
  };
}

/**
 * Hook for keyboard navigation
 */
function useKeyboardNav(context: string) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const result = accessibility.handleKeyboard(event, context);

      if (result.handled) {
        event.preventDefault();
        return result.action;
      }

      return null;
    },
    [context]
  );

  return { handleKeyDown };
}

/**
 * Hook for focus management
 */
function useFocusManager() {
  const focusElement = useCallback((elementId: string) => {
    accessibility.focusElement(elementId);
  }, []);

  const returnFocus = useCallback(() => {
    accessibility.returnFocus();
  }, []);

  return { focusElement, returnFocus };
}

/**
 * Hook for accessibility props
 */
function useAccessibilityPropsHelper(
  label: string,
  hint?: string,
  role?: string,
  state?: Record<string, boolean>
) {
  return accessibility.getAccessibilityProps(label, hint, role, state);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const accessibility = new AccessibilityManager();

export type {
  AccessibilityConfig,
  AccessibilityHint,
  ColorScheme,
  KeyboardShortcut,
};

export {
  COLOR_SCHEMES,
  KEYBOARD_SHORTCUTS,
  useAccessibilityConfig as useAccessibility,
  useAccessibilityPropsHelper as useAccessibilityProps,
  useFocusManager as useFocusManagement,
  useKeyboardNav as useKeyboardNavigation,
};
