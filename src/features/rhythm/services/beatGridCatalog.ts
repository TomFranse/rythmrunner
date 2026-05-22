import type { BeatGridLayerRole } from "@/features/rhythm/types/rhythm.types";

/** Per-role instrument pools for role-separated layering */
export const ROLE_INSTRUMENT_GROUPS: Record<BeatGridLayerRole, readonly string[]> = {
  bass: ["electric_bass_finger", "synth_bass_1", "cello"],
  pad: ["string_ensemble_1", "drawbar_organ", "rock_organ", "cello"],
  harmony: ["acoustic_grand_piano", "bright_acoustic_piano", "electric_piano_1", "harpsichord"],
  lead: ["marimba", "vibraphone", "xylophone", "trumpet", "music_box"],
};

/** Curated FluidR3_GM instruments — mixed percussion and melodic */
export const BEAT_GRID_INSTRUMENTS = [
  "acoustic_grand_piano",
  "bright_acoustic_piano",
  "electric_piano_1",
  "harpsichord",
  "marimba",
  "vibraphone",
  "music_box",
  "xylophone",
  "drawbar_organ",
  "rock_organ",
  "acoustic_guitar_nylon",
  "electric_bass_finger",
  "synth_bass_1",
  "violin",
  "cello",
  "string_ensemble_1",
  "trumpet",
  "trombone",
  "synth_drum",
  "melodic_tom",
] as const;

export type BeatGridInstrumentName = (typeof BEAT_GRID_INSTRUMENTS)[number];
