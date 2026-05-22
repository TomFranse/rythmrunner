import { BEAT_GRID_INSTRUMENTS } from "@/features/rhythm/services/beatGridCatalog";
import { isLayerActive } from "@/features/rhythm/services/beatGridLayerService";
import type {
  BeatGridEnvelopeAction,
  BeatGridFadeMode,
  BeatGridLayerId,
} from "@/features/rhythm/types/rhythm.types";
import { BEAT_GRID_LAYER_IDS } from "@/features/rhythm/services/beatGridLayerService";

const FADE_PROBABILITY = 0.7;

export interface BeatGridLayerCycleConfig {
  fadeMode: BeatGridFadeMode;
  instrumentName: string;
}

export type BeatGridCycleConfig = Record<BeatGridLayerId, BeatGridLayerCycleConfig>;

export function createCycleConfig(rng: () => number = Math.random): BeatGridCycleConfig {
  const config = {} as BeatGridCycleConfig;
  for (const layerId of BEAT_GRID_LAYER_IDS) {
    config[layerId] = {
      fadeMode: rng() < FADE_PROBABILITY ? "fade" : "cut",
      instrumentName: "",
    };
  }
  return config;
}

export function assignInstruments(
  rng: () => number = Math.random,
  catalog: readonly string[] = BEAT_GRID_INSTRUMENTS
): Record<BeatGridLayerId, string> {
  const pick = (): string => {
    const index = Math.floor(rng() * catalog.length);
    return catalog[index] ?? catalog[0];
  };
  return {
    L64: pick(),
    L32: pick(),
    L16: pick(),
    L8: pick(),
  };
}

export function mergeCycleInstruments(
  config: BeatGridCycleConfig,
  instruments: Record<BeatGridLayerId, string>
): BeatGridCycleConfig {
  const merged = { ...config };
  for (const layerId of BEAT_GRID_LAYER_IDS) {
    merged[layerId] = {
      ...merged[layerId],
      instrumentName: instruments[layerId],
    };
  }
  return merged;
}

export interface EnvelopeActionParams {
  layerId: BeatGridLayerId;
  beatInCycle: number;
  prevBeatInCycle: number;
  config: BeatGridCycleConfig;
}

export function getEnvelopeAction(params: EnvelopeActionParams): BeatGridEnvelopeAction {
  const { layerId, beatInCycle, prevBeatInCycle, config } = params;
  const wasActive = prevBeatInCycle >= 0 && isLayerActive(layerId, prevBeatInCycle);
  const nowActive = isLayerActive(layerId, beatInCycle);
  const fadeMode = config[layerId].fadeMode;

  if (!wasActive && nowActive) {
    return fadeMode === "fade" ? "fadeIn" : "cutOn";
  }
  if (wasActive && !nowActive) {
    return fadeMode === "fade" ? "fadeOut" : "cutOff";
  }
  if (nowActive) {
    return "hold";
  }
  return "silent";
}
