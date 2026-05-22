import type { BeatGridLayerId } from "@/features/rhythm/types/rhythm.types";

/** Major scale semitone offsets from tonic */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;

/** One chord per 16-beat section: I – IV – I – V (scale degrees 0, 3, 0, 4) */
const SECTION_CHORD_DEGREE = [0, 3, 0, 4] as const;

/** Arpeggio pattern: root, 3rd, 5th, octave (semitones from chord root) */
const ARPEGGIO_SEMITONES = [0, 4, 7, 12] as const;

/** Phase offset so layers interlock on consecutive beats */
const LAYER_ARPEGGIO_PHASE: Record<BeatGridLayerId, number> = {
  L64: 0,
  L32: 1,
  L16: 2,
  L8: 3,
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

function chordRootPcToMidi(chordRootPc: number, baseMidi: number, semitoneOffset: number): number {
  const basePc = baseMidi % 12;
  const targetPc = (chordRootPc + semitoneOffset) % 12;
  const interval = (targetPc - basePc + 12) % 12;
  return baseMidi + interval;
}

/**
 * MIDI note for a layer: arpeggiated chord tone with per-layer phase offset.
 */
export function getArpeggiatedMidiForLayer(
  layerId: BeatGridLayerId,
  beatInCycle: number,
  harmony: CycleHarmony
): number {
  const chordRootPc = getSectionChordRootPc(harmony, beatInCycle);
  const baseMidi = LAYER_BASE_MIDI[layerId];
  const arpIndex = (beatInCycle % 4) + (LAYER_ARPEGGIO_PHASE[layerId] % ARPEGGIO_SEMITONES.length);
  const semitoneOffset = ARPEGGIO_SEMITONES[arpIndex % ARPEGGIO_SEMITONES.length] ?? 0;
  return chordRootPcToMidi(chordRootPc, baseMidi, semitoneOffset);
}

/**
 * @deprecated Use getArpeggiatedMidiForLayer for playback.
 */
export function getHarmonicMidiForLayer(
  layerId: BeatGridLayerId,
  beatInCycle: number,
  harmony: CycleHarmony
): number {
  return getArpeggiatedMidiForLayer(layerId, beatInCycle, harmony);
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
