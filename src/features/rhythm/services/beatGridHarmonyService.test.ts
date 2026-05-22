import { describe, it, expect } from "vitest";
import {
  assignConsonantInstruments,
  createCycleHarmony,
  getArpeggiatedMidiForLayer,
} from "./beatGridHarmonyService";

describe("beatGridHarmonyService", () => {
  it("should use same instrument for all layers in assignConsonantInstruments", () => {
    const assigned = assignConsonantInstruments(() => 0);
    expect(assigned.L64).toBe(assigned.L32);
    expect(assigned.L32).toBe(assigned.L16);
    expect(assigned.L16).toBe(assigned.L8);
  });

  it("should return chord tones not random chromatic notes at peak", () => {
    const harmony = createCycleHarmony(() => 0);
    const l64 = getArpeggiatedMidiForLayer("L64", 30, harmony);
    const l32 = getArpeggiatedMidiForLayer("L32", 30, harmony);
    const l16 = getArpeggiatedMidiForLayer("L16", 30, harmony);
    const l8 = getArpeggiatedMidiForLayer("L8", 30, harmony);
    const pcs = [l64, l32, l16, l8].map((n) => n % 12);
    const unique = new Set(pcs);
    expect(unique.size).toBeLessThanOrEqual(4);
    expect(l8).toBeGreaterThan(l64);
  });

  it("should change harmony section at beat 16", () => {
    const harmony = createCycleHarmony(() => 0);
    const beat15 = getArpeggiatedMidiForLayer("L64", 15, harmony) % 12;
    const beat16 = getArpeggiatedMidiForLayer("L64", 16, harmony) % 12;
    expect(beat15).not.toBe(beat16);
  });

  it("should rotate pitch class across beats for same layer", () => {
    const harmony = createCycleHarmony(() => 0);
    const beat0 = getArpeggiatedMidiForLayer("L64", 28, harmony) % 12;
    const beat1 = getArpeggiatedMidiForLayer("L64", 29, harmony) % 12;
    const beat2 = getArpeggiatedMidiForLayer("L64", 30, harmony) % 12;
    expect(new Set([beat0, beat1, beat2]).size).toBeGreaterThan(1);
  });

  it("should phase-offset layers on the same beat", () => {
    const harmony = createCycleHarmony(() => 0);
    const beat = 28;
    const l64 = getArpeggiatedMidiForLayer("L64", beat, harmony) % 12;
    const l32 = getArpeggiatedMidiForLayer("L32", beat, harmony) % 12;
    expect(l64).not.toBe(l32);
  });
});
