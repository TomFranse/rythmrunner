import type { StepDetectionResult } from "@/features/rhythm/types/rhythm.types";

export const COLD_START_BPM = 60;
export const FALLBACK_TIMEOUT_MS = 3000;
export const DEBOUNCE_MS = 200;
export const ROLLING_INTERVAL_COUNT = 4;
export const LOW_PASS_ALPHA = 0.2;
export const PEAK_THRESHOLD_MULTIPLIER = 1.4;
export const MIN_PEAK_DELTA = 0.15;

export function computeMagnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

export function computeBpmFromIntervals(intervalsMs: number[]): number | null {
  if (intervalsMs.length < ROLLING_INTERVAL_COUNT) {
    return null;
  }
  const recent = intervalsMs.slice(-ROLLING_INTERVAL_COUNT);
  const averageSeconds = recent.reduce((sum, ms) => sum + ms, 0) / recent.length / 1000;
  if (averageSeconds <= 0) {
    return null;
  }
  return Math.round(60 / averageSeconds);
}

export interface StepDetectorState {
  filteredMagnitude: number;
  baseline: number;
  lastPeakAt: number | null;
  stepIntervalsMs: number[];
  lastBpm: number;
  isFallback: boolean;
}

export function createStepDetector(): StepDetectorState {
  return {
    filteredMagnitude: 0,
    baseline: 1,
    lastPeakAt: null,
    stepIntervalsMs: [],
    lastBpm: COLD_START_BPM,
    isFallback: false,
  };
}

function applyLowPass(state: StepDetectorState, magnitude: number): number {
  const filtered = LOW_PASS_ALPHA * magnitude + (1 - LOW_PASS_ALPHA) * state.filteredMagnitude;
  state.filteredMagnitude = filtered;
  return filtered;
}

function updateBaseline(state: StepDetectorState, filtered: number): void {
  const threshold = state.baseline * PEAK_THRESHOLD_MULTIPLIER + MIN_PEAK_DELTA;
  if (filtered < threshold) {
    state.baseline = LOW_PASS_ALPHA * filtered + (1 - LOW_PASS_ALPHA) * state.baseline;
  }
}

function isPeak(filtered: number, baseline: number): boolean {
  const threshold = baseline * PEAK_THRESHOLD_MULTIPLIER + MIN_PEAK_DELTA;
  return filtered > threshold && filtered - baseline > MIN_PEAK_DELTA;
}

function recordStep(state: StepDetectorState, now: number): void {
  if (state.lastPeakAt !== null) {
    const interval = now - state.lastPeakAt;
    if (interval > DEBOUNCE_MS) {
      state.stepIntervalsMs.push(interval);
      if (state.stepIntervalsMs.length > ROLLING_INTERVAL_COUNT) {
        state.stepIntervalsMs.shift();
      }
    }
  }
  state.lastPeakAt = now;
  state.isFallback = false;
}

function resolveBpm(state: StepDetectorState, now: number): number {
  const silenceMs = state.lastPeakAt === null ? Number.POSITIVE_INFINITY : now - state.lastPeakAt;

  if (silenceMs > FALLBACK_TIMEOUT_MS) {
    state.isFallback = true;
    return state.lastBpm;
  }

  state.isFallback = false;
  const measured = computeBpmFromIntervals(state.stepIntervalsMs);
  if (measured !== null) {
    state.lastBpm = measured;
  }
  return state.lastBpm;
}

export function processMotionSample(
  state: StepDetectorState,
  magnitude: number,
  now: number
): StepDetectionResult {
  const filtered = applyLowPass(state, magnitude);
  updateBaseline(state, filtered);
  let stepDetected = false;

  if (isPeak(filtered, state.baseline)) {
    if (state.lastPeakAt === null || now - state.lastPeakAt >= DEBOUNCE_MS) {
      recordStep(state, now);
      stepDetected = true;
    }
  }

  const bpm = resolveBpm(state, now);

  return {
    bpm,
    stepDetected,
    isFallback: state.isFallback,
  };
}
