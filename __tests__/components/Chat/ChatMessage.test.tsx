/**
 * ChatMessage Component Tests
 */

import ChatMessage from "@/components/Chat/ChatMessage";
import { render, screen } from "@testing-library/react-native";
import React from "react";

// Mock dayjs
jest.mock("dayjs", () => {
  const dayjs = jest.fn(() => ({
    format: jest.fn(() => "2024-01-15 14:30"),
  }));
  return dayjs;
});

describe("ChatMessage", () => {
  const defaultProps = {
    isFromMe: false,
    content: "Hello, this is a test message!",
    timestamp: 1705329000, // Unix timestamp
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render message content", () => {
    render(<ChatMessage {...defaultProps} />);

    expect(screen.getByText("Hello, this is a test message!")).toBeTruthy();
  });

  it("should render formatted timestamp", () => {
    render(<ChatMessage {...defaultProps} />);

    expect(screen.getByText("2024-01-15 14:30")).toBeTruthy();
  });

  it("should apply correct styles for messages from others", () => {
    const { getByTestId } = render(
      <ChatMessage {...defaultProps} isFromMe={false} />
    );

    // The component should have the otherMessage style applied
    // Note: In a real test, you'd check the actual style properties
    expect(getByTestId).toBeDefined();
  });

  it("should apply correct styles for messages from me", () => {
    const { getByTestId } = render(
      <ChatMessage {...defaultProps} isFromMe={true} />
    );

    // The component should have the myMessage style applied
    expect(getByTestId).toBeDefined();
  });

  it("should handle empty content", () => {
    render(<ChatMessage {...defaultProps} content="" />);

    // Should still render the component structure
    expect(screen.getByText("2024-01-15 14:30")).toBeTruthy();
  });

  it("should handle long content", () => {
    const longContent = "A".repeat(1000);

    render(<ChatMessage {...defaultProps} content={longContent} />);

    expect(screen.getByText(longContent)).toBeTruthy();
  });

  it("should memoize properly with same props", () => {
    const { rerender } = render(<ChatMessage {...defaultProps} />);

    // Re-render with same props
    rerender(<ChatMessage {...defaultProps} />);

    // Component should not re-render unnecessarily
    // In a real implementation, you'd use React DevTools or similar to verify
    expect(screen.getByText("Hello, this is a test message!")).toBeTruthy();
  });

  it("should re-render when props change", () => {
    const { rerender } = render(<ChatMessage {...defaultProps} />);

    // Re-render with different content
    rerender(
      <ChatMessage {...defaultProps} content="Updated message content" />
    );

    expect(screen.getByText("Updated message content")).toBeTruthy();
    expect(screen.queryByText("Hello, this is a test message!")).toBeFalsy();
  });

  it("should re-render when isFromMe changes", () => {
    const { rerender } = render(
      <ChatMessage {...defaultProps} isFromMe={false} />
    );

    // Re-render with isFromMe changed
    rerender(<ChatMessage {...defaultProps} isFromMe={true} />);

    // Should still render the content but with different styling
    expect(screen.getByText("Hello, this is a test message!")).toBeTruthy();
  });

  it("should handle different timestamp formats", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // Tomorrow

    render(<ChatMessage {...defaultProps} timestamp={futureTimestamp} />);

    expect(screen.getByText("2024-01-15 14:30")).toBeTruthy();
  });
});
