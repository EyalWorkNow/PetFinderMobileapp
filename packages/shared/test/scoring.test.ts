import { describe, expect, it } from "vitest";
import { attributeScore, cosineSimilarity, haversineKm, scoreMatch } from "../src/scoring";

describe("scoring", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it("returns lower score for different attributes", () => {
    const a = {
      size: "M" as const,
      colors: ["brown", "white"],
      collar: true,
      collarColor: "red",
      breed: "beagle",
      marksText: "small spot"
    };
    const b = {
      size: "L" as const,
      colors: ["black"],
      collar: false,
      collarColor: null,
      breed: "unknown",
      marksText: "scar"
    };

    expect(attributeScore(a, b)).toBeLessThan(0.4);
  });

  it("computes geographic distance in km", () => {
    const distance = haversineKm(32.0853, 34.7818, 32.794, 34.9896);
    expect(distance).toBeGreaterThan(75);
    expect(distance).toBeLessThan(90);
  });

  it("applies weighted total score", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const scored = scoreMatch({
      vectorA: [0.9, 0.2, 0.3],
      vectorB: [0.88, 0.21, 0.29],
      attributesA: {
        size: "M",
        colors: ["brown"],
        collar: true,
        collarColor: "red",
        breed: "mixed",
        marksText: "white spot"
      },
      attributesB: {
        size: "M",
        colors: ["brown", "white"],
        collar: true,
        collarColor: "red",
        breed: "mixed",
        marksText: "white spot"
      },
      locationA: { lat: 40.7128, lng: -74.006 },
      locationB: { lat: 40.7135, lng: -74.0049 },
      seenAtA: new Date("2026-01-15T06:00:00Z"),
      seenAtB: new Date("2026-01-15T05:00:00Z"),
      radiusKmA: 5,
      radiusKmB: 5,
      now
    });

    expect(scored.visual).toBeGreaterThan(0.99);
    expect(scored.total).toBeGreaterThan(0.85);
  });
});
