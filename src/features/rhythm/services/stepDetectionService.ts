import type { StepDetectionResult } from "@/features/rhythm/types/rhythm.types";

/** Oxford-style windowed peak detection (Salvi et al.), tuned for web motion streams. */
export const COLD_START_BPM = 60;
export const FALLBACK_TIMEOUT_MS = 3000;
/** Minimum spacing between confirmed steps (post-processing window). */
export const POST_PROCESS_WINDOW_MS = 200;
/** @deprecated Use POST_PROCESS_WINDOW_MS — kept for existing imports. */
export const DEBOUNCE_MS = POST_PROCESS_WINDOW_MS;
export const ROLLING_INTERVAL_COUNT = 4;

export const TARGET_SAMPLE_RATE_HZ = 50;
export const DETECTION_THRESHOLD_SIGMA = 1.2;
/** ~350 ms scoring window at 50 Hz (Oxford: 35 samples @ 100 Hz). */
export const SCORING_WINDOW_SAMPLES = 18;
export const FIR_HISTORY_LENGTH = 13;
export const MIN_SCORE_SAMPLES = 24;
export const RAW_BUFFER_MAX_MS = 4000;

const SAMPLE_INTERVAL_MS = 1000 / TARGET_SAMPLE_RATE_HZ;

/** Hamming-windowed sinc FIR, 3 Hz cutoff @ 50 Hz (Oxford filtering stage). */
const FIR_TAPS: readonly number[] = [
  0.00209, 0.005482, 0.015739, 0.033141, 0.053628, 0.070291, 0.639259, 0.070291, 0.053628, 0.033141,
  0.015739, 0.005482, 0.00209,
];

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

interface RawSample {
  timestamp: number;
  magnitude: number;
}

interface PeakCandidate {
  timestamp: number;
  score: number;
}

export interface StepDetectorState {
  rawBuffer: RawSample[];
  lastResampledTimestamp: number;
  firHistory: number[];
  filteredHistory: number[];
  scoreMean: number;
  scoreM2: number;
  scoreCount: number;
  candidates: PeakCandidate[];
  lastPeakAt: number | null;
  stepIntervalsMs: number[];
  lastBpm: number;
  isFallback: boolean;
  sampleRateHz: number;
}

export function createStepDetector(): StepDetectorState {
  return {
    rawBuffer: [],
    lastResampledTimestamp: 0,
    firHistory: [],
    filteredHistory: [],
    scoreMean: 0,
    scoreM2: 0,
    scoreCount: 0,
    candidates: [],
    lastPeakAt: null,
    stepIntervalsMs: [],
    lastBpm: COLD_START_BPM,
    isFallback: false,
    sampleRateHz: TARGET_SAMPLE_RATE_HZ,
  };
}

function trimRawBuffer(state: StepDetectorState, now: number): void {
  const cutoff = now - RAW_BUFFER_MAX_MS;
  while (state.rawBuffer.length > 0 && state.rawBuffer[0].timestamp < cutoff) {
    state.rawBuffer.shift();
  }
}

function interpolateMagnitude(buffer: RawSample[], timestamp: number): number | null {
  if (buffer.length === 0) {
    return null;
  }
  const first = buffer[0];
  const last = buffer[buffer.length - 1];
  if (timestamp <= first.timestamp) {
    return first.magnitude;
  }
  if (timestamp >= last.timestamp) {
    return last.magnitude;
  }

  for (let i = 1; i < buffer.length; i += 1) {
    const right = buffer[i];
    if (timestamp > right.timestamp) {
      continue;
    }
    const left = buffer[i - 1];
    const span = right.timestamp - left.timestamp;
    if (span <= 0) {
      return right.magnitude;
    }
    const ratio = (timestamp - left.timestamp) / span;
    return left.magnitude + ratio * (right.magnitude - left.magnitude);
  }

  return last.magnitude;
}

function resampleUniform(
  state: StepDetectorState,
  endTimestamp: number
): { timestamp: number; magnitude: number }[] {
  const { rawBuffer } = state;
  if (rawBuffer.length === 0) {
    return [];
  }

  const start =
    state.lastResampledTimestamp > 0
      ? state.lastResampledTimestamp
      : rawBuffer[0].timestamp - SAMPLE_INTERVAL_MS;

  const out: { timestamp: number; magnitude: number }[] = [];
  for (let t = start + SAMPLE_INTERVAL_MS; t <= endTimestamp; t += SAMPLE_INTERVAL_MS) {
    const magnitude = interpolateMagnitude(rawBuffer, t);
    if (magnitude !== null) {
      out.push({ timestamp: t, magnitude });
    }
  }

  if (out.length > 0) {
    state.lastResampledTimestamp = out[out.length - 1].timestamp;
  }

  return out;
}

function applyFirInPlace(history: number[], sample: number): number {
  history.push(sample);
  if (history.length > FIR_HISTORY_LENGTH) {
    history.shift();
  }

  if (history.length < FIR_TAPS.length) {
    return sample;
  }

  let sum = 0;
  const offset = history.length - FIR_TAPS.length;
  for (let i = 0; i < FIR_TAPS.length; i += 1) {
    sum += FIR_TAPS[i] * history[offset + i];
  }
  return sum;
}

function causalMeanDifferenceScore(history: number[], windowSamples: number): number {
  if (history.length < 2) {
    return 0;
  }
  const xi = history[history.length - 1];
  const lookback = Math.min(windowSamples, history.length - 1);
  let sum = 0;
  for (let k = 1; k <= lookback; k += 1) {
    sum += xi - history[history.length - 1 - k];
  }
  return sum / lookback;
}

function updateScoreStatistics(state: StepDetectorState, score: number): void {
  state.scoreCount += 1;
  const delta = score - state.scoreMean;
  state.scoreMean += delta / state.scoreCount;
  const delta2 = score - state.scoreMean;
  state.scoreM2 += delta * delta2;
}

function scoreStdDev(state: StepDetectorState): number {
  if (state.scoreCount < 2) {
    return 1;
  }
  return Math.sqrt(state.scoreM2 / (state.scoreCount - 1));
}

function recordStep(state: StepDetectorState, stepTime: number): void {
  if (state.lastPeakAt !== null) {
    const interval = stepTime - state.lastPeakAt;
    if (interval >= POST_PROCESS_WINDOW_MS) {
      state.stepIntervalsMs.push(interval);
      if (state.stepIntervalsMs.length > ROLLING_INTERVAL_COUNT) {
        state.stepIntervalsMs.shift();
      }
    }
  }
  state.lastPeakAt = stepTime;
  state.isFallback = false;
}

function flushCompletedPeakWindows(state: StepDetectorState, now: number): boolean {
  let stepDetected = false;

  while (state.candidates.length > 0) {
    const windowStart = state.candidates[0].timestamp;
    const windowEnd = windowStart + POST_PROCESS_WINDOW_MS;
    if (now < windowEnd) {
      break;
    }

    let best = state.candidates[0];
    for (const candidate of state.candidates) {
      if (candidate.timestamp >= windowStart && candidate.timestamp < windowEnd) {
        if (candidate.score > best.score) {
          best = candidate;
        }
      }
    }

    recordStep(state, best.timestamp);
    stepDetected = true;

    state.candidates = state.candidates.filter((c) => c.timestamp >= windowEnd);
  }

  return stepDetected;
}

function processResampledSample(
  state: StepDetectorState,
  magnitude: number,
  timestamp: number
): boolean {
  const filtered = applyFirInPlace(state.firHistory, magnitude);

  state.filteredHistory.push(filtered);
  const maxFilteredHistory = SCORING_WINDOW_SAMPLES + FIR_HISTORY_LENGTH;
  if (state.filteredHistory.length > maxFilteredHistory) {
    state.filteredHistory.splice(0, state.filteredHistory.length - maxFilteredHistory);
  }

  const score = causalMeanDifferenceScore(state.filteredHistory, SCORING_WINDOW_SAMPLES);
  updateScoreStatistics(state, score);

  if (state.filteredHistory.length < MIN_SCORE_SAMPLES) {
    return flushCompletedPeakWindows(state, timestamp);
  }

  const threshold = state.scoreMean + DETECTION_THRESHOLD_SIGMA * scoreStdDev(state);
  if (score > threshold) {
    state.candidates.push({ timestamp, score });
  }

  const windowDetected = flushCompletedPeakWindows(state, timestamp);
  return windowDetected;
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
  const lastRaw = state.rawBuffer[state.rawBuffer.length - 1];
  if (lastRaw === undefined || now > lastRaw.timestamp) {
    state.rawBuffer.push({ timestamp: now, magnitude });
  } else if (now === lastRaw.timestamp) {
    lastRaw.magnitude = magnitude;
  }

  trimRawBuffer(state, now);

  const resampled = resampleUniform(state, now);
  let stepDetected = false;

  for (const sample of resampled) {
    if (processResampledSample(state, sample.magnitude, sample.timestamp)) {
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
