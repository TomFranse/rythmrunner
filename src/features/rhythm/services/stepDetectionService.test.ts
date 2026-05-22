import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  COLD_START_BPM,
  computeBpmFromIntervals,
  computeMagnitude,
  createStepDetector,
  processMotionSample,
  DEBOUNCE_MS,
} from "./stepDetectionService";

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
    let now = 0;
    let lastBpm = COLD_START_BPM;

    for (let step = 0; step < 12; step += 1) {
      now += intervalMs;
      for (let i = 0; i < 5; i += 1) {
        processMotionSample(state, 0.6, now - 80 + i * 10);
      }
      const peak = processMotionSample(state, 5, now);
      lastBpm = peak.bpm;
      for (let i = 0; i < 8; i += 1) {
        processMotionSample(state, 0.5, now + 20 + i * 15);
      }
      vi.advanceTimersByTime(intervalMs);
    }

    expect(lastBpm).toBeGreaterThanOrEqual(177);
    expect(lastBpm).toBeLessThanOrEqual(183);
  });

  it("should debounce peaks within 200ms", () => {
    const state = createStepDetector();
    processMotionSample(state, 4.5, 0);
    processMotionSample(state, 4.5, DEBOUNCE_MS - 1);
    expect(state.stepIntervalsMs).toHaveLength(0);
  });

  it("should enter fallback after 3s without peaks", () => {
    const state = createStepDetector();
    const intervalMs = 400;
    let now = 0;

    for (let i = 0; i < 6; i += 1) {
      now += intervalMs;
      processMotionSample(state, 4.5, now);
      processMotionSample(state, 0.5, now + 30);
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
