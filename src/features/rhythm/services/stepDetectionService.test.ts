import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  COLD_START_BPM,
  computeBpmFromIntervals,
  computeMagnitude,
  createStepDetector,
  processMotionSample,
  POST_PROCESS_WINDOW_MS,
  TARGET_SAMPLE_RATE_HZ,
} from "./stepDetectionService";

/** Feed a synthetic stride at 50 Hz so the Oxford pipeline can lock tempo. */
function feedStride(
  state: ReturnType<typeof createStepDetector>,
  peakTime: number,
  peakMagnitude = 5,
  valleyMagnitude = 0.5
): ReturnType<typeof processMotionSample> {
  let last = processMotionSample(state, valleyMagnitude, peakTime - 120);
  for (let t = peakTime - 100; t <= peakTime + 100; t += 1000 / TARGET_SAMPLE_RATE_HZ) {
    const magnitude = Math.abs(t - peakTime) < 15 ? peakMagnitude : valleyMagnitude;
    last = processMotionSample(state, magnitude, t);
  }
  return last;
}

describe("stepDetectionService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should compute magnitude from x y z", () => {
    expect(computeMagnitude(3, 4, 0)).toBe(5);
  });

  it("should return null BPM when fewer than four intervals exist", () => {
    expect(computeBpmFromIntervals([400, 400, 400])).toBeNull();
  });

  it("should compute 180 BPM from four intervals at 333ms", () => {
    const intervalMs = (60 / 180) * 1000;
    const bpm = computeBpmFromIntervals([intervalMs, intervalMs, intervalMs, intervalMs]);
    expect(bpm).toBe(180);
  });

  it("should start at cold start BPM before steps", () => {
    const state = createStepDetector();
    const result = processMotionSample(state, 1, 100);
    expect(result.bpm).toBe(COLD_START_BPM);
    expect(result.stepDetected).toBe(false);
  });

  it("should converge near 180 BPM from synthetic peak train", () => {
    const state = createStepDetector();
    const intervalMs = Math.round((60 / 180) * 1000);
    let now = 500;
    let lastBpm = COLD_START_BPM;

    for (let step = 0; step < 14; step += 1) {
      now += intervalMs;
      const result = feedStride(state, now);
      lastBpm = result.bpm;
      vi.advanceTimersByTime(intervalMs);
    }

    expect(lastBpm).toBeGreaterThanOrEqual(177);
    expect(lastBpm).toBeLessThanOrEqual(183);
  });

  it("should merge heel-toe double peaks within 200ms into one step", () => {
    const state = createStepDetector();
    feedStride(state, 0);
    feedStride(state, POST_PROCESS_WINDOW_MS - 20, 4.5, 0.5);
    expect(state.stepIntervalsMs).toHaveLength(0);
  });

  it("should enter fallback after 3s without peaks", () => {
    const state = createStepDetector();
    const intervalMs = 400;
    let now = 500;

    for (let i = 0; i < 8; i += 1) {
      now += intervalMs;
      feedStride(state, now);
    }

    const heldBpm = state.lastBpm;
    for (let t = now + 100; t < now + 3200; t += 100) {
      processMotionSample(state, 0.5, t);
    }
    const afterSilence = processMotionSample(state, 0.5, now + 3500);

    expect(afterSilence.isFallback).toBe(true);
    expect(afterSilence.bpm).toBe(heldBpm);
  });
});
