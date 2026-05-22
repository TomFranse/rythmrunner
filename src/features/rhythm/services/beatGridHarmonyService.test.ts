import { describe, it, expect } from "vitest";
import {
  assignConsonantInstruments,
  createCycleHarmony,
  getHarmonicMidiForLayer,
} from "./beatGridHarmonyService";

describe("beatGridHarmonyService", () => {
  it("should use same instrument for all layers in a cycle", () => {
    const assigned = assignConsonantInstruments(() => 0);
    expect(assigned.L64).toBe(assigned.L32);
    expect(assigned.L32).toBe(assigned.L16);
    expect(assigned.L16).toBe(assigned.L8);
  });

  it("should return chord tones not random chromatic notes at peak", () => {
    const harmony = createCycleHarmony(() => 0);
    const l64 = getHarmonicMidiForLayer("L64", 30, harmony);
    const l32 = getHarmonicMidiForLayer("L32", 30, harmony);
    const l16 = getHarmonicMidiForLayer("L16", 30, harmony);
    const l8 = getHarmonicMidiForLayer("L8", 30, harmony);
    const pcs = [l64, l32, l16, l8].map((n) => n % 12);
    const unique = new Set(pcs);
    expect(unique.size).toBeLessThanOrEqual(4);
    expect(l8).toBeGreaterThan(l64);
  });

  it("should change harmony section at beat 16", () => {
    const harmony = createCycleHarmony(() => 0);
    const beat15 = getHarmonicMidiForLayer("L64", 15, harmony) % 12;
    const beat16 = getHarmonicMidiForLayer("L64", 16, harmony) % 12;
    expect(beat15).not.toBe(beat16);
  });
});
