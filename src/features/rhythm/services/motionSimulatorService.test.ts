import { describe, it, expect } from "vitest";
import {
  createSimulatorPeaks,
  intervalMsForBpm,
  magnitudeForSimulatorPeak,
} from "./motionSimulatorService";

describe("motionSimulatorService", () => {
  it("should compute interval for 120 BPM", () => {
    expect(intervalMsForBpm(120)).toBe(500);
  });

  it("should compute interval for 180 BPM", () => {
    expect(intervalMsForBpm(180)).toBe(333);
  });

  it("should create peak samples at target cadence", () => {
    const peaks = createSimulatorPeaks(180, 4, 1000);
    expect(peaks[0].timestamp).toBe(1000);
    expect(peaks[2].timestamp).toBe(1000 + intervalMsForBpm(180));
    expect(magnitudeForSimulatorPeak()).toBe(5);
  });
});
