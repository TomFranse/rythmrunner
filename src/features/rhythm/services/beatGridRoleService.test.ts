import { describe, it, expect } from "vitest";
import { BEAT_GRID_PERCUSSION_INSTRUMENTS } from "./beatGridCatalog";
import {
  assignRoleInstruments,
  getLayerRole,
  getNoteDurationRatio,
  shouldTriggerByRoleDensity,
} from "./beatGridRoleService";

describe("beatGridRoleService", () => {
  it("should assign a role per layer", () => {
    expect(getLayerRole("L64")).toBe("bass");
    expect(getLayerRole("L32")).toBe("pad");
    expect(getLayerRole("L16")).toBe("harmony");
    expect(getLayerRole("L8")).toBe("lead");
  });

  it("should use longer durations for bass and pad", () => {
    expect(getNoteDurationRatio("L64")).toBe(2.0);
    expect(getNoteDurationRatio("L32")).toBe(4.0);
    expect(getNoteDurationRatio("L16")).toBe(0.75);
    expect(getNoteDurationRatio("L8")).toBe(0.5);
  });

  it("should trigger pad only on every fourth beat", () => {
    expect(shouldTriggerByRoleDensity("L32", 0)).toBe(true);
    expect(shouldTriggerByRoleDensity("L32", 4)).toBe(true);
    expect(shouldTriggerByRoleDensity("L32", 1)).toBe(false);
    expect(shouldTriggerByRoleDensity("L64", 1)).toBe(true);
  });

  it("should draw from percussion-capable role pools", () => {
    const percussionSet = new Set<string>(BEAT_GRID_PERCUSSION_INSTRUMENTS);
    let hits = 0;
    for (let trial = 0; trial < 40; trial += 1) {
      const assigned = assignRoleInstruments();
      const names = [assigned.L64, assigned.L32, assigned.L16, assigned.L8];
      if (names.some((name) => percussionSet.has(name))) {
        hits += 1;
      }
    }
    expect(hits).toBeGreaterThan(0);
  });
});
