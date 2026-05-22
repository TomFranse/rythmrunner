import * as Tone from "tone";
import {
  disposeBeatGridAudio,
  getBeatGridLayerState,
  startBeatGridPlayback,
  stopBeatGridPlayback,
  subscribeBeatGridLayerState,
} from "@/features/rhythm/services/beatGridAudioService";
import type { AudioLayerState } from "@/features/rhythm/types/rhythm.types";

const DEFAULT_RAMP_SECONDS = 0.3;
let started = false;

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
  return getBeatGridLayerState();
}

export function subscribeAudioLayerState(listener: (state: AudioLayerState) => void): () => void {
  return subscribeBeatGridLayerState(listener);
}

export function startRhythmPlayback(initialBpm: number): void {
  startBeatGridPlayback(initialBpm);
}

export function stopRhythmPlayback(): void {
  stopBeatGridPlayback();
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
  disposeBeatGridAudio();
  started = false;
}
