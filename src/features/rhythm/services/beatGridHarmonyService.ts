import type { BeatGridLayerId } from "@/features/rhythm/types/rhythm.types";

/** Major scale semitone offsets from tonic */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;

/** One chord per 16-beat section: I – IV – I – V (scale degrees 0, 3, 0, 4) */
const SECTION_CHORD_DEGREE = [0, 3, 0, 4] as const;

/** Layer role: chord tone offset in semitones from section root (within octave) */
const LAYER_CHORD_SEMITONES: Record<BeatGridLayerId, number> = {
  L64: 0,
  L32: 7,
  L16: 4,
  L8: 12,
};

/** Base octave MIDI (C3) — layers stay in complementary registers */
const LAYER_BASE_MIDI: Record<BeatGridLayerId, number> = {
  L64: 48,
  L32: 55,
  L16: 60,
  L8: 72,
};

const ROOT_PITCH_CLASSES = [0, 2, 4, 5, 7, 9] as const;

/** Same timbre per cycle — avoids clashing families */
export const HARMONIC_INSTRUMENT_GROUPS: readonly (readonly string[])[] = [
  ["marimba", "vibraphone", "xylophone"],
  ["acoustic_grand_piano", "bright_acoustic_piano", "electric_piano_1"],
  ["string_ensemble_1", "violin", "cello"],
  ["acoustic_guitar_nylon", "harpsichord", "music_box"],
] as const;

export interface CycleHarmony {
  tonicPitchClass: number;
  sectionChordDegree: readonly number[];
}

export function createCycleHarmony(rng: () => number = Math.random): CycleHarmony {
  const tonicIndex = Math.floor(rng() * ROOT_PITCH_CLASSES.length);
  return {
    tonicPitchClass: ROOT_PITCH_CLASSES[tonicIndex] ?? 0,
    sectionChordDegree: SECTION_CHORD_DEGREE,
  };
}

function scaleDegreeToSemitones(tonicPc: number, degree: number): number {
  const wrapped = ((degree % 7) + 7) % 7;
  return (tonicPc + MAJOR_SCALE[wrapped]) % 12;
}

function getSectionChordRootPc(harmony: CycleHarmony, beatInCycle: number): number {
  const section = Math.floor(beatInCycle / 16) % 4;
  const chordDegree = harmony.sectionChordDegree[section] ?? 0;
  return scaleDegreeToSemitones(harmony.tonicPitchClass, chordDegree);
}

/**
 * MIDI note for a layer: chord tone in a fixed register (consonant when layers stack).
 */
export function getHarmonicMidiForLayer(
  layerId: BeatGridLayerId,
  beatInCycle: number,
  harmony: CycleHarmony
): number {
  const chordRootPc = getSectionChordRootPc(harmony, beatInCycle);
  const baseMidi = LAYER_BASE_MIDI[layerId];
  const basePc = baseMidi % 12;
  const targetPc = (chordRootPc + LAYER_CHORD_SEMITONES[layerId]) % 12;
  const interval = (targetPc - basePc + 12) % 12;
  return baseMidi + interval;
}

export function assignConsonantInstruments(
  rng: () => number = Math.random
): Record<BeatGridLayerId, string> {
  const groupIndex = Math.floor(rng() * HARMONIC_INSTRUMENT_GROUPS.length);
  const group = HARMONIC_INSTRUMENT_GROUPS[groupIndex] ?? HARMONIC_INSTRUMENT_GROUPS[0];
  const name = group[0] ?? "marimba";
  return {
    L64: name,
    L32: name,
    L16: name,
    L8: name,
  };
}
