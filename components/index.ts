/**
 * Component Barrel Exports
 * Provides organized access to all components
 */

// =============================================================================
// CHAT COMPONENTS
// =============================================================================
export { default as ChatHeader } from "./Chat/ChatHeader";
export { default as ChatMessage } from "./Chat/ChatMessage";
export { default as EmptyChat } from "./Chat/EmptyChat";
export { default as MessageInput } from "./Chat/MessageInput";
export { default as MessageList } from "./Chat/MessageList";
export { default as ChatSearch } from "./Chat/Search";
export { default as VirtualizedMessageList } from "./Chat/VirtualizedMessageList";

// =============================================================================
// UI COMPONENTS
// =============================================================================
export { Button, LinkButton } from "./ui/Button";
export { default as CameraScanner } from "./ui/CameraScanner";
export { IconSymbol } from "./ui/IconSymbol";
export { MarkdownRenderer } from "./ui/MarkdownRenderer";
export { default as ProfileListItem } from "./ui/ProfileListItem";
export { TabBarBackground } from "./ui/TabBarBackground";
export { Tag } from "./ui/Tag";
export { TextField } from "./ui/TextField";
export * from "./ui/Typography";

// =============================================================================
// CORE COMPONENTS
// =============================================================================
export { default as Collapsible } from "./Collapsible";
export { default as ExternalLink } from "./ExternalLink";
export { default as FontTest } from "./FontTest";
export { default as HapticTab } from "./HapticTab";
export { default as HelloWave } from "./HelloWave";
export { default as LoginForm } from "./LoginForm";
export { default as Logo } from "./Logo";
export { default as ParallaxScrollView } from "./ParallaxScrollView";
export { ThemedText } from "./ThemedText";
export { ThemedView } from "./ThemedView";

// =============================================================================
// CONTEXT & PROVIDERS
// =============================================================================
export * from "./Context";
export {
  ErrorBoundary,
  useErrorHandler,
  withErrorBoundary,
} from "./ErrorBoundary/ErrorBoundary";

// =============================================================================
// EXAMPLES & DOCUMENTATION
// =============================================================================
export { NostrExample } from "./Examples/NostrExample";

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type { ComponentProps } from "react";
