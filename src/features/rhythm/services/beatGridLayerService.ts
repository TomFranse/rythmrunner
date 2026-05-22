import type { BeatGridLayerId } from "@/features/rhythm/types/rhythm.types";

export const CYCLE_LENGTH = 64;
export const HUMANIZE_MS = 25;
export const HUMANIZE_CAP_RATIO = 0.12;
export const FADE_BEATS = 4;
export const BEAT_GRID_LAYER_IDS: BeatGridLayerId[] = ["L64", "L32", "L16", "L8"];

const LAYER_GAIN_DB: Record<BeatGridLayerId, number> = {
  L64: -3,
  L32: -2,
  L16: -1,
  L8: 0,
};

function isInRange(beat: number, start: number, end: number): boolean {
  return beat >= start && beat <= end;
}

export function isLayerActive(layerId: BeatGridLayerId, beatInCycle: number): boolean {
  if (beatInCycle < 0 || beatInCycle >= CYCLE_LENGTH) {
    return false;
  }
  switch (layerId) {
    case "L64":
      return true;
    case "L32":
      return isInRange(beatInCycle, 16, 47);
    case "L16":
      return isInRange(beatInCycle, 24, 39);
    case "L8":
      return isInRange(beatInCycle, 28, 35);
    default:
      return false;
  }
}

export function isPeakOverlap(beatInCycle: number): boolean {
  return beatInCycle >= 28 && beatInCycle <= 35;
}

export function getTargetGainDb(layerId: BeatGridLayerId): number {
  return LAYER_GAIN_DB[layerId];
}

export function dbToLinearGain(db: number): number {
  return Math.pow(10, db / 20);
}

export function computeHumanizeSeconds(bpm: number, rng: () => number = Math.random): number {
  const beatSeconds = 60 / Math.max(bpm, 1);
  const maxOffset = Math.min(HUMANIZE_MS / 1000, beatSeconds * HUMANIZE_CAP_RATIO);
  return (rng() * 2 - 1) * maxOffset;
}

export function getBeatDurationSeconds(bpm: number): number {
  return 60 / Math.max(bpm, 1);
}

export function getFadeDurationSeconds(bpm: number): number {
  return getBeatDurationSeconds(bpm) * FADE_BEATS;
}
