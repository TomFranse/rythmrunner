export type SessionPhase = "idle" | "arming" | "running" | "stopping";

export type MotionPermissionStatus = "unknown" | "granted" | "denied" | "unsupported";

export interface MotionSample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface StepDetectionState {
  bpm: number;
  lastStepAt: number | null;
  isFallback: boolean;
  sampleRate: number;
}

export type BeatGridLayerId = "L64" | "L32" | "L16" | "L8";

export type BeatGridFadeMode = "fade" | "cut";

export type BeatGridEnvelopeAction = "fadeIn" | "fadeOut" | "hold" | "cutOn" | "cutOff" | "silent";

export interface BeatGridLayerUiState {
  active: boolean;
  gain: number;
}

export interface AudioLayerState {
  beatGridLayers: Record<BeatGridLayerId, BeatGridLayerUiState>;
  isPeak: boolean;
  beatInCycle: number;
  /** Monotonic counter incremented each transport beat — drives visual pulse phase. */
  beatTick: number;
  masterGain: number;
}

export interface StepDetectionResult {
  bpm: number;
  stepDetected: boolean;
  isFallback: boolean;
}

/** soundfont-player instrument handle */
export interface SoundfontInstrument {
  play: (
    note: number | string,
    when?: number,
    options?: { duration?: number; gain?: number }
  ) => { stop: (when?: number) => void };
}
