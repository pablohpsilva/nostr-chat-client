/**
 * Error Handling Utilities Tests
 */

import { NOSTR_ERROR_CODES } from "@/constants/nostr";
import { errorHandler, NostrError, withRetry } from "@/utils/errorHandling";

describe("errorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handle", () => {
    it("should log error with context", () => {
      const error = new Error("Test error");
      const context = "TestContext";

      errorHandler.handle(error, context);

      expect(console.error).toHaveBeenCalledWith("[TestContext]", "Test error");
    });

    it("should handle NostrError with code", () => {
      const error = new NostrError(
        "Connection failed",
        NOSTR_ERROR_CODES.CONNECTION_FAILED,
        { relayUrl: "wss://test.relay" }
      );

      errorHandler.handle(error, "NostrTest");

      expect(console.error).toHaveBeenCalledWith(
        "[NostrTest]",
        "[CONNECTION_FAILED] Connection failed"
      );
      expect(console.error).toHaveBeenCalledWith("Error context:", {
        relayUrl: "wss://test.relay",
      });
    });
  });

  describe("createError", () => {
    it("should create NostrError with correct properties", () => {
      const error = errorHandler.createError(
        NOSTR_ERROR_CODES.PUBLISH_FAILED,
        "Failed to publish event",
        { eventId: "test-event-id" }
      );

      expect(error).toBeInstanceOf(NostrError);
      expect(error.message).toBe("Failed to publish event");
      expect(error.code).toBe(NOSTR_ERROR_CODES.PUBLISH_FAILED);
      expect(error.context).toEqual({ eventId: "test-event-id" });
    });
  });

  describe("predefined errors", () => {
    it("should create connection error", () => {
      const error = errorHandler.connectionError("wss://test.relay");

      expect(error.code).toBe(NOSTR_ERROR_CODES.CONNECTION_FAILED);
      expect(error.message).toBe(
        "Failed to connect to relay: wss://test.relay"
      );
      expect(error.context).toEqual({ relayUrl: "wss://test.relay" });
    });

    it("should create publish error", () => {
      const error = errorHandler.publishError("Invalid signature");

      expect(error.code).toBe(NOSTR_ERROR_CODES.PUBLISH_FAILED);
      expect(error.message).toBe("Failed to publish event: Invalid signature");
      expect(error.context).toEqual({ reason: "Invalid signature" });
    });

    it("should create authentication error", () => {
      const error = errorHandler.authenticationError("Invalid key");

      expect(error.code).toBe(NOSTR_ERROR_CODES.AUTHENTICATION_FAILED);
      expect(error.message).toBe("Authentication failed: Invalid key");
      expect(error.context).toEqual({ reason: "Invalid key" });
    });
  });
});

describe("NostrError", () => {
  it("should create error with correct properties", () => {
    const error = new NostrError(
      "Test message",
      NOSTR_ERROR_CODES.ENCRYPTION_FAILED,
      { key: "value" }
    );

    expect(error.name).toBe("NostrError");
    expect(error.message).toBe("Test message");
    expect(error.code).toBe(NOSTR_ERROR_CODES.ENCRYPTION_FAILED);
    expect(error.context).toEqual({ key: "value" });
    expect(error).toBeInstanceOf(Error);
  });
});

describe("withRetry", () => {
  it("should succeed on first attempt", async () => {
    const successFn = jest.fn().mockResolvedValue("success");

    const result = await withRetry(successFn, 3, 100);

    expect(result).toBe("success");
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const retryFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Attempt 1"))
      .mockRejectedValueOnce(new Error("Attempt 2"))
      .mockResolvedValue("success");

    const result = await withRetry(retryFn, 3, 10);

    expect(result).toBe("success");
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it("should throw last error after max retries", async () => {
    const failFn = jest.fn().mockRejectedValue(new Error("Always fails"));

    await expect(withRetry(failFn, 2, 10)).rejects.toThrow("Always fails");
    expect(failFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should wait between retries with exponential backoff", async () => {
    const failFn = jest.fn().mockRejectedValue(new Error("Fail"));
    const startTime = Date.now();

    await expect(withRetry(failFn, 2, 100)).rejects.toThrow("Fail");

    // Should have waited approximately 100ms + 200ms = 300ms
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThan(250); // Allow some tolerance
  });
});
