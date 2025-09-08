/**
 * Type Utilities Tests
 */

import {
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
} from "@/types/utilities";

describe("Type Guards", () => {
  describe("isDefined", () => {
    it("should return true for defined values", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it("should return false for null and undefined", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe("isString", () => {
    it("should return true for strings", () => {
      expect(isString("")).toBe(true);
      expect(isString("hello")).toBe(true);
      expect(isString(String(123))).toBe(true);
    });

    it("should return false for non-strings", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("should return true for valid numbers", () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("should return false for NaN and non-numbers", () => {
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber({})).toBe(false);
    });
  });

  describe("isObject", () => {
    it("should return true for plain objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
    });

    it("should return false for non-objects", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject("string")).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array(5))).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray({})).toBe(false);
      expect(isArray("string")).toBe(false);
      expect(isArray(null)).toBe(false);
    });
  });

  describe("isValidNostrPublicKey", () => {
    it("should return true for valid public keys", () => {
      const validKey = "0".repeat(64);
      expect(isValidNostrPublicKey(validKey)).toBe(true);

      const hexKey = "a1b2c3d4e5f6".repeat(10) + "abcd";
      expect(isValidNostrPublicKey(hexKey)).toBe(true);
    });

    it("should return false for invalid public keys", () => {
      expect(isValidNostrPublicKey("")).toBe(false);
      expect(isValidNostrPublicKey("invalid")).toBe(false);
      expect(isValidNostrPublicKey("0".repeat(63))).toBe(false); // Too short
      expect(isValidNostrPublicKey("0".repeat(65))).toBe(false); // Too long
      expect(isValidNostrPublicKey("g".repeat(64))).toBe(false); // Invalid hex
    });
  });

  describe("isValidNostrPrivateKey", () => {
    it("should return true for valid private keys", () => {
      const validKey = "0".repeat(64);
      expect(isValidNostrPrivateKey(validKey)).toBe(true);
    });

    it("should return false for invalid private keys", () => {
      expect(isValidNostrPrivateKey("")).toBe(false);
      expect(isValidNostrPrivateKey("invalid")).toBe(false);
      expect(isValidNostrPrivateKey("0".repeat(63))).toBe(false);
    });
  });

  describe("isValidUnixTimestamp", () => {
    it("should return true for valid timestamps", () => {
      expect(isValidUnixTimestamp(1705329000)).toBe(true);
      expect(isValidUnixTimestamp(1)).toBe(true);
      expect(isValidUnixTimestamp(2000000000)).toBe(true);
    });

    it("should return false for invalid timestamps", () => {
      expect(isValidUnixTimestamp(0)).toBe(false);
      expect(isValidUnixTimestamp(-1)).toBe(false);
      expect(isValidUnixTimestamp(2147483648)).toBe(false); // Too large
    });
  });
});

describe("Assertion Functions", () => {
  describe("assertDefined", () => {
    it("should not throw for defined values", () => {
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined("")).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
    });

    it("should throw for null and undefined", () => {
      expect(() => assertDefined(null)).toThrow("Value must be defined");
      expect(() => assertDefined(undefined)).toThrow("Value must be defined");
    });

    it("should throw custom message", () => {
      expect(() => assertDefined(null, "Custom error")).toThrow("Custom error");
    });
  });

  describe("assertString", () => {
    it("should not throw for strings", () => {
      expect(() => assertString("hello")).not.toThrow();
    });

    it("should throw for non-strings", () => {
      expect(() => assertString(123)).toThrow("Value must be a string");
    });
  });

  describe("assertNumber", () => {
    it("should not throw for numbers", () => {
      expect(() => assertNumber(123)).not.toThrow();
    });

    it("should throw for non-numbers", () => {
      expect(() => assertNumber("123")).toThrow("Value must be a number");
    });
  });

  describe("assertValidNostrPublicKey", () => {
    it("should not throw for valid keys", () => {
      const validKey = "0".repeat(64);
      expect(() => assertValidNostrPublicKey(validKey)).not.toThrow();
    });

    it("should throw for invalid keys", () => {
      expect(() => assertValidNostrPublicKey("invalid")).toThrow(
        "Value must be a valid Nostr public key"
      );
    });
  });
});

describe("Utility Functions", () => {
  describe("createBrand and removeBrand", () => {
    it("should create and remove brand", () => {
      const original = "test-string";
      const branded = createBrand<string, "TestBrand">(original);
      const unbranded = removeBrand(branded);

      expect(unbranded).toBe(original);
    });
  });

  describe("typedKeys", () => {
    it("should return typed keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const keys = typedKeys(obj);

      expect(keys).toEqual(["a", "b", "c"]);
    });
  });

  describe("typedEntries", () => {
    it("should return typed entries", () => {
      const obj = { a: 1, b: 2 };
      const entries = typedEntries(obj);

      expect(entries).toEqual([
        ["a", 1],
        ["b", 2],
      ]);
    });
  });

  describe("filterDefined", () => {
    it("should filter out null and undefined", () => {
      const array = [1, null, 2, undefined, 3];
      const filtered = filterDefined(array);

      expect(filtered).toEqual([1, 2, 3]);
    });

    it("should preserve other falsy values", () => {
      const array = [0, false, "", null, undefined];
      const filtered = filterDefined(array);

      expect(filtered).toEqual([0, false, ""]);
    });
  });

  describe("assertNever", () => {
    it("should throw with value information", () => {
      const value = "unexpected" as never;

      expect(() => assertNever(value)).toThrow(
        'Unhandled discriminated union member: "unexpected"'
      );
    });
  });
});
