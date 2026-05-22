import { isLayerActive } from "@/features/rhythm/services/beatGridLayerService";
import { shouldTriggerByRoleDensity } from "@/features/rhythm/services/beatGridRoleService";
import type { BeatGridLayerId, BeatGridSectionMode } from "@/features/rhythm/types/rhythm.types";

/** Last beat of each 16-beat harmony section — upper layers rest. */
export const PHRASE_REST_BEATS = [15, 31, 47, 63] as const;

const SECTION_ALLOWED_LAYERS: Record<BeatGridSectionMode, readonly BeatGridLayerId[]> = {
  intro: ["L64"],
  groove: ["L64", "L32"],
  build: ["L64", "L32", "L16"],
  peak: ["L64", "L32", "L16", "L8"],
  cooldown: ["L64", "L32"],
};

export function getSectionMode(beatInCycle: number): BeatGridSectionMode {
  if (beatInCycle < 0 || beatInCycle >= 64) {
    return "intro";
  }
  if (beatInCycle <= 15) {
    return "intro";
  }
  if (beatInCycle <= 23) {
    return "groove";
  }
  if (beatInCycle <= 27) {
    return "build";
  }
  if (beatInCycle <= 39) {
    return "peak";
  }
  return "cooldown";
}

export function isPhraseRestBeat(beatInCycle: number): boolean {
  return (PHRASE_REST_BEATS as readonly number[]).includes(beatInCycle);
}

function isLayerAllowedInSection(
  layerId: BeatGridLayerId,
  sectionMode: BeatGridSectionMode
): boolean {
  return SECTION_ALLOWED_LAYERS[sectionMode].includes(layerId);
}

export interface ShouldTriggerLayerParams {
  layerId: BeatGridLayerId;
  beatInCycle: number;
  sectionMode?: BeatGridSectionMode;
}

/**
 * Gate note triggers: layer window, section mode, phrase rest, role density.
 * UI/envelope still uses isLayerActive independently.
 */
export function shouldTriggerLayer(params: ShouldTriggerLayerParams): boolean {
  const { layerId, beatInCycle } = params;
  const sectionMode = params.sectionMode ?? getSectionMode(beatInCycle);

  if (!isLayerActive(layerId, beatInCycle)) {
    return false;
  }
  if (!isLayerAllowedInSection(layerId, sectionMode)) {
    return false;
  }
  if (isPhraseRestBeat(beatInCycle) && layerId !== "L64") {
    return false;
  }
  if (!shouldTriggerByRoleDensity(layerId, beatInCycle)) {
    return false;
  }
  return true;
}
