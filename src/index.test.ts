import { describe, expect, test } from "bun:test";
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToHex,
  generateVariations,
} from "./index";

describe("normalizeHex", () => {
  test("returns null for invalid hex codes", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("GGG")).toBeNull();
    expect(normalizeHex("12")).toBeNull();
    expect(normalizeHex("12345")).toBeNull();
    expect(normalizeHex("1234567")).toBeNull();
    expect(normalizeHex("xyz")).toBeNull();
  });

  test("normalizes 3-character hex to 6-character", () => {
    expect(normalizeHex("abc")).toBe("AABBCC");
    expect(normalizeHex("123")).toBe("112233");
    expect(normalizeHex("fff")).toBe("FFFFFF");
    expect(normalizeHex("000")).toBe("000000");
  });

  test("handles 6-character hex codes", () => {
    expect(normalizeHex("aabbcc")).toBe("AABBCC");
    expect(normalizeHex("112233")).toBe("112233");
    expect(normalizeHex("FFFFFF")).toBe("FFFFFF");
    expect(normalizeHex("000000")).toBe("000000");
  });

  test("strips # prefix", () => {
    expect(normalizeHex("#abc")).toBe("AABBCC");
    expect(normalizeHex("#aabbcc")).toBe("AABBCC");
  });

  test("trims whitespace", () => {
    expect(normalizeHex("  abc  ")).toBe("AABBCC");
    expect(normalizeHex("  #abc  ")).toBe("AABBCC");
  });
});

describe("hexToRgb", () => {
  test("converts hex to RGB values", () => {
    expect(hexToRgb("000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("FFFFFF")).toEqual([255, 255, 255]);
    expect(hexToRgb("FF0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("00FF00")).toEqual([0, 255, 0]);
    expect(hexToRgb("0000FF")).toEqual([0, 0, 255]);
    expect(hexToRgb("FF5500")).toEqual([255, 85, 0]);
  });
});

describe("rgbToHex", () => {
  test("converts RGB to hex string", () => {
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(255, 255, 255)).toBe("#FFFFFF");
    expect(rgbToHex(255, 0, 0)).toBe("#FF0000");
    expect(rgbToHex(0, 255, 0)).toBe("#00FF00");
    expect(rgbToHex(0, 0, 255)).toBe("#0000FF");
  });

  test("clamps values outside 0-255 range", () => {
    expect(rgbToHex(-10, 0, 0)).toBe("#000000");
    expect(rgbToHex(300, 0, 0)).toBe("#FF0000");
    expect(rgbToHex(0, -50, 300)).toBe("#0000FF");
  });

  test("rounds fractional values", () => {
    expect(rgbToHex(127.4, 127.6, 0)).toBe("#7F8000");
  });
});

describe("rgbToHsl", () => {
  test("converts black", () => {
    const [h, s, l] = rgbToHsl(0, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBe(0);
  });

  test("converts white", () => {
    const [h, s, l] = rgbToHsl(255, 255, 255);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBe(1);
  });

  test("converts pure red", () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  test("converts pure green", () => {
    const [h, s, l] = rgbToHsl(0, 255, 0);
    expect(h).toBeCloseTo(1 / 3, 5);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  test("converts pure blue", () => {
    const [h, s, l] = rgbToHsl(0, 0, 255);
    expect(h).toBeCloseTo(2 / 3, 5);
    expect(s).toBe(1);
    expect(l).toBe(0.5);
  });

  test("converts gray (no saturation)", () => {
    const [h, s, l] = rgbToHsl(128, 128, 128);
    expect(h).toBe(0);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(0.502, 2);
  });
});

describe("hslToHex", () => {
  test("converts black", () => {
    expect(hslToHex(0, 0, 0)).toBe("#000000");
  });

  test("converts white", () => {
    expect(hslToHex(0, 0, 1)).toBe("#FFFFFF");
  });

  test("converts pure red", () => {
    expect(hslToHex(0, 1, 0.5)).toBe("#FF0000");
  });

  test("converts pure green", () => {
    expect(hslToHex(1 / 3, 1, 0.5)).toBe("#00FF00");
  });

  test("converts pure blue", () => {
    expect(hslToHex(2 / 3, 1, 0.5)).toBe("#0000FF");
  });

  test("handles hue wrapping (negative values)", () => {
    // -0.5 should wrap to 0.5 (cyan area)
    const hex = hslToHex(-0.5, 1, 0.5);
    expect(hex).toBe("#00FFFF");
  });

  test("handles hue wrapping (values > 1)", () => {
    // 1.5 should wrap to 0.5 (cyan area)
    const hex = hslToHex(1.5, 1, 0.5);
    expect(hex).toBe("#00FFFF");
  });
});

describe("generateVariations", () => {
  test("returns 9 variations", () => {
    const variations = generateVariations("FF5500");
    expect(variations).toHaveLength(9);
  });

  test("includes original color at index 4", () => {
    const variations = generateVariations("FF5500");
    expect(variations[4].name).toBe("ORIGINAL");
    expect(variations[4].hex).toBe("#FF5500");
  });

  test("all variations have name and hex properties", () => {
    const variations = generateVariations("FF5500");
    for (const v of variations) {
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("hex");
      expect(v.hex).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  test("variation names are correct", () => {
    const variations = generateVariations("FF5500");
    const names = variations.map((v) => v.name);
    expect(names).toEqual([
      "Lighter Tint",
      "Analogous Left",
      "Darker Shade",
      "Muted/Desaturated",
      "ORIGINAL",
      "Vibrant/Saturated",
      "Triadic Shift",
      "Analogous Right",
      "Complement",
    ]);
  });

  test("lighter tint is lighter than original", () => {
    const variations = generateVariations("808080");
    const originalRgb = hexToRgb(variations[4].hex.slice(1));
    const lighterRgb = hexToRgb(variations[0].hex.slice(1));
    const originalLuminance = (originalRgb[0] + originalRgb[1] + originalRgb[2]) / 3;
    const lighterLuminance = (lighterRgb[0] + lighterRgb[1] + lighterRgb[2]) / 3;
    expect(lighterLuminance).toBeGreaterThan(originalLuminance);
  });

  test("darker shade is darker than original", () => {
    const variations = generateVariations("808080");
    const originalRgb = hexToRgb(variations[4].hex.slice(1));
    const darkerRgb = hexToRgb(variations[2].hex.slice(1));
    const originalLuminance = (originalRgb[0] + originalRgb[1] + originalRgb[2]) / 3;
    const darkerLuminance = (darkerRgb[0] + darkerRgb[1] + darkerRgb[2]) / 3;
    expect(darkerLuminance).toBeLessThan(originalLuminance);
  });
});

describe("roundtrip conversions", () => {
  test("RGB -> HSL -> RGB roundtrip", () => {
    const testCases = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 128, 64],
      [100, 150, 200],
    ];

    for (const [r, g, b] of testCases) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const hex = hslToHex(h, s, l);
      const [r2, g2, b2] = hexToRgb(hex.slice(1));
      // Allow 1 unit tolerance due to rounding
      expect(Math.abs(r - r2)).toBeLessThanOrEqual(1);
      expect(Math.abs(g - g2)).toBeLessThanOrEqual(1);
      expect(Math.abs(b - b2)).toBeLessThanOrEqual(1);
    }
  });
});
