import type { MotionSample } from "@/features/rhythm/types/rhythm.types";

export const DEFAULT_SIMULATOR_BPM = 160;

export function intervalMsForBpm(bpm: number): number {
  if (bpm <= 0) {
    return 500;
  }
  return Math.round((60 / bpm) * 1000);
}

export function createSimulatorPeaks(bpm: number, count: number, startTime = 0): MotionSample[] {
  const intervalMs = intervalMsForBpm(bpm);
  const samples: MotionSample[] = [];

  for (let i = 0; i < count; i += 1) {
    const timestamp = startTime + i * intervalMs;
    samples.push({ x: 0, y: 5, z: 0, timestamp });
    samples.push({ x: 0, y: 0.5, z: 0, timestamp: timestamp + 40 });
  }

  return samples;
}

export function magnitudeForSimulatorPeak(): number {
  return 5;
}

export function magnitudeForSimulatorValley(): number {
  return 0.5;
}
