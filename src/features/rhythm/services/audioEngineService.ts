import * as Tone from "tone";
import {
  getDrumPatternForBpm,
  shouldTriggerKick,
  shouldTriggerSnare,
} from "@/features/rhythm/services/drumPatternService";
import { getPianoLayerForBpm } from "@/features/rhythm/services/pianoLayerService";
import type { AudioLayerState } from "@/features/rhythm/types/rhythm.types";

const DEFAULT_RAMP_SECONDS = 0.3;
const KICK_NOTE = "C1";
const SNARE_NOTE = "16n";
const PIANO_CHORDS = [
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["F3", "A3", "C4"],
];

let kickSynth: Tone.MembraneSynth | null = null;
let snareSynth: Tone.NoiseSynth | null = null;
let pianoSynth: Tone.PolySynth | null = null;
let rhythmScheduleId: number | null = null;
let rhythmTick = 0;
let started = false;
let currentLayerState: AudioLayerState = {
  drumsActive: false,
  pianoVoices: 0,
  masterGain: 0.8,
};

function ensureSynths(): void {
  if (!kickSynth) {
    kickSynth = new Tone.MembraneSynth().toDestination();
    kickSynth.volume.value = -4;
  }
  if (!snareSynth) {
    snareSynth = new Tone.NoiseSynth({
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).toDestination();
    snareSynth.volume.value = -8;
  }
  if (!pianoSynth) {
    pianoSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    pianoSynth.volume.value = -10;
  }
}

export async function startAudioContext(): Promise<void> {
  await Tone.start();
  if (Tone.getContext().state !== "running") {
    await Tone.getContext().resume();
  }
  started = true;
}

export function isAudioStarted(): boolean {
  return started;
}

export function setTransportBpm(bpm: number, rampSeconds = DEFAULT_RAMP_SECONDS): void {
  Tone.Transport.bpm.rampTo(bpm, rampSeconds);
}

export function getTransportBpm(): number {
  return Tone.Transport.bpm.value;
}

export function getAudioLayerState(): AudioLayerState {
  return currentLayerState;
}

function playPianoChord(time: number, voices: number): void {
  if (!pianoSynth || voices <= 0) {
    return;
  }
  const chord = PIANO_CHORDS[rhythmTick % PIANO_CHORDS.length].slice(0, voices);
  pianoSynth.triggerAttackRelease(chord, "2n", time);
}

function scheduleRhythmStep(time: number): void {
  const bpm = Tone.Transport.bpm.value;
  const drumPattern = getDrumPatternForBpm(bpm);
  const pianoLayer = getPianoLayerForBpm(bpm);

  if (shouldTriggerKick(rhythmTick, drumPattern) && kickSynth) {
    kickSynth.triggerAttackRelease(KICK_NOTE, "8n", time);
  }
  if (shouldTriggerSnare(rhythmTick, drumPattern) && snareSynth) {
    snareSynth.triggerAttackRelease(SNARE_NOTE, time);
  }
  if (rhythmTick % pianoLayer.chordEvery === 0) {
    playPianoChord(time, pianoLayer.voices);
  }

  currentLayerState = {
    drumsActive: true,
    pianoVoices: pianoLayer.voices,
    masterGain: currentLayerState.masterGain,
  };
  rhythmTick += 1;
}

export function startRhythmPlayback(initialBpm: number): void {
  ensureSynths();
  rhythmTick = 0;
  Tone.Transport.bpm.value = initialBpm;

  if (rhythmScheduleId !== null) {
    Tone.Transport.clear(rhythmScheduleId);
  }

  rhythmScheduleId = Tone.Transport.scheduleRepeat((time) => {
    scheduleRhythmStep(time);
  }, "8n");

  Tone.Transport.start();
  kickSynth?.triggerAttackRelease(KICK_NOTE, "8n", Tone.now() + 0.05);
}

export function stopRhythmPlayback(): void {
  if (rhythmScheduleId !== null) {
    Tone.Transport.clear(rhythmScheduleId);
    rhythmScheduleId = null;
  }
  Tone.Transport.stop();
  rhythmTick = 0;
  currentLayerState = {
    drumsActive: false,
    pianoVoices: 0,
    masterGain: currentLayerState.masterGain,
  };
}

/** @deprecated Use startRhythmPlayback — kept for tests */
export function startMetronomeClick(): void {
  startRhythmPlayback(getTransportBpm());
}

/** @deprecated Use stopRhythmPlayback */
export function stopMetronomeClick(): void {
  stopRhythmPlayback();
}

export function disposeAudioEngine(): void {
  stopRhythmPlayback();
  kickSynth?.dispose();
  snareSynth?.dispose();
  pianoSynth?.dispose();
  kickSynth = null;
  snareSynth = null;
  pianoSynth = null;
  started = false;
}
