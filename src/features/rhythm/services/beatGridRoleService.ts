import { ROLE_INSTRUMENT_GROUPS } from "@/features/rhythm/services/beatGridCatalog";
import type { BeatGridLayerId, BeatGridLayerRole } from "@/features/rhythm/types/rhythm.types";

export const LAYER_ROLE: Record<BeatGridLayerId, BeatGridLayerRole> = {
  L64: "bass",
  L32: "pad",
  L16: "harmony",
  L8: "lead",
};

const NOTE_DURATION_RATIO_BY_ROLE: Record<BeatGridLayerRole, number> = {
  bass: 2.0,
  pad: 4.0,
  harmony: 0.75,
  lead: 0.5,
};

export function getLayerRole(layerId: BeatGridLayerId): BeatGridLayerRole {
  return LAYER_ROLE[layerId];
}

export function getNoteDurationRatio(layerId: BeatGridLayerId): number {
  return NOTE_DURATION_RATIO_BY_ROLE[getLayerRole(layerId)];
}

/** Pad triggers every 4th beat; other roles trigger every beat when otherwise allowed. */
export function shouldTriggerByRoleDensity(layerId: BeatGridLayerId, beatInCycle: number): boolean {
  if (getLayerRole(layerId) === "pad") {
    return beatInCycle % 4 === 0;
  }
  return true;
}

export function assignRoleInstruments(
  rng: () => number = Math.random
): Record<BeatGridLayerId, string> {
  const pick = (role: BeatGridLayerRole): string => {
    const group = ROLE_INSTRUMENT_GROUPS[role];
    const index = Math.floor(rng() * group.length);
    return group[index] ?? group[0];
  };
  return {
    L64: pick("bass"),
    L32: pick("pad"),
    L16: pick("harmony"),
    L8: pick("lead"),
  };
}
