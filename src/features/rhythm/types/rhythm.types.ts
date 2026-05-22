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

export interface AudioLayerState {
  drumsActive: boolean;
  pianoVoices: number;
  masterGain: number;
}

export interface StepDetectionResult {
  bpm: number;
  stepDetected: boolean;
  isFallback: boolean;
}
