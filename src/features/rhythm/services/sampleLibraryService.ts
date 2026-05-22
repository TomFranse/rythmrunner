import Soundfont from "soundfont-player";
import * as Tone from "tone";
import { BEAT_GRID_INSTRUMENTS } from "@/features/rhythm/services/beatGridCatalog";
import type { SoundfontInstrument } from "@/features/rhythm/types/rhythm.types";

const SOUNDFONT_BANK = "FluidR3_GM";
const SOUNDFONT_FORMAT = "mp3";

const instrumentCache = new Map<string, SoundfontInstrument>();

export function pickRandomInstrument(
  rng: () => number = Math.random,
  catalog: readonly string[] = BEAT_GRID_INSTRUMENTS
): string {
  const index = Math.floor(rng() * catalog.length);
  return catalog[index] ?? catalog[0];
}

export async function loadInstrument(
  name: string,
  destination?: AudioNode
): Promise<SoundfontInstrument> {
  const cached = instrumentCache.get(name);
  if (cached) {
    return cached;
  }

  const audioContext = Tone.getContext().rawContext as AudioContext;
  const instrument = (await Soundfont.instrument(
    audioContext,
    name as Parameters<typeof Soundfont.instrument>[1],
    {
      soundfont: SOUNDFONT_BANK,
      format: SOUNDFONT_FORMAT,
      destination: destination ?? audioContext.destination,
    }
  )) as SoundfontInstrument;

  instrumentCache.set(name, instrument);
  return instrument;
}

export interface PlayNoteOptions {
  instrument: SoundfontInstrument;
  midi: number;
  time: number;
  durationSeconds: number;
  gainLinear: number;
}

export function playNote(options: PlayNoteOptions): void {
  const { instrument, midi, time, durationSeconds, gainLinear } = options;
  instrument.play(midi, time, {
    duration: durationSeconds,
    gain: gainLinear,
  });
}

export function clearInstrumentCache(): void {
  instrumentCache.clear();
}
