import type { BeatGridLayerRole } from "@/features/rhythm/types/rhythm.types";

/** GM drum/percussion names (FluidR3_GM via gleitz) */
export const BEAT_GRID_PERCUSSION_INSTRUMENTS = [
  "acoustic_bass_drum",
  "electric_snare",
  "closed_hi_hat",
  "open_hi_hat",
  "crash_cymbal_1",
  "ride_cymbal_1",
  "tambourine",
  "taiko_drum",
  "synth_drum",
  "melodic_tom",
] as const;

/** Per-role instrument pools for role-separated layering */
export const ROLE_INSTRUMENT_GROUPS: Record<BeatGridLayerRole, readonly string[]> = {
  bass: ["electric_bass_finger", "synth_bass_1", "acoustic_bass_drum", "synth_drum"],
  pad: [
    "synth_drum",
    "melodic_tom",
    "taiko_drum",
    "closed_hi_hat",
    "string_ensemble_1",
    "drawbar_organ",
  ],
  harmony: [
    "synth_drum",
    "melodic_tom",
    "electric_snare",
    "marimba",
    "vibraphone",
    "acoustic_grand_piano",
    "electric_piano_1",
  ],
  lead: [
    "synth_drum",
    "melodic_tom",
    "acoustic_bass_drum",
    "electric_snare",
    "xylophone",
    "marimba",
    "trumpet",
  ],
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
  ...BEAT_GRID_PERCUSSION_INSTRUMENTS,
] as const;

export type BeatGridInstrumentName = (typeof BEAT_GRID_INSTRUMENTS)[number];
