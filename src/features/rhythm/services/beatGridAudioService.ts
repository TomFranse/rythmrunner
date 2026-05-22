import * as Tone from "tone";
import {
  createCycleConfig,
  getEnvelopeAction,
  mergeCycleInstruments,
  type BeatGridCycleConfig,
} from "@/features/rhythm/services/beatGridCycleService";
import { shouldTriggerLayer } from "@/features/rhythm/services/beatGridArrangementService";
import {
  createCycleHarmony,
  getArpeggiatedMidiForLayer,
  type CycleHarmony,
} from "@/features/rhythm/services/beatGridHarmonyService";
import {
  assignRoleInstruments,
  getNoteDurationRatio,
} from "@/features/rhythm/services/beatGridRoleService";
import {
  BEAT_GRID_LAYER_IDS,
  computeHumanizeSeconds,
  dbToLinearGain,
  getBeatDurationSeconds,
  getFadeDurationSeconds,
  getTargetGainDb,
  isLayerActive,
  isPeakOverlap,
} from "@/features/rhythm/services/beatGridLayerService";
import { loadInstrument, playNote } from "@/features/rhythm/services/sampleLibraryService";
import type {
  AudioLayerState,
  BeatGridLayerId,
  BeatGridLayerUiState,
  SoundfontInstrument,
} from "@/features/rhythm/types/rhythm.types";

let scheduleId: number | null = null;
let globalBeatIndex = 0;
let cycleConfig: BeatGridCycleConfig | null = null;
let cycleHarmony: CycleHarmony | null = null;
let layerGains: Record<BeatGridLayerId, Tone.Gain> | null = null;
let limiter: Tone.Limiter | null = null;
let layerInstruments: Record<BeatGridLayerId, SoundfontInstrument | null> = {
  L64: null,
  L32: null,
  L16: null,
  L8: null,
};

let currentLayerState: AudioLayerState = createDefaultAudioLayerState();
const layerStateListeners = new Set<(state: AudioLayerState) => void>();

export function subscribeBeatGridLayerState(
  listener: (state: AudioLayerState) => void
): () => void {
  layerStateListeners.add(listener);
  listener(currentLayerState);
  return () => {
    layerStateListeners.delete(listener);
  };
}

function notifyLayerStateListeners(): void {
  for (const listener of layerStateListeners) {
    listener(currentLayerState);
  }
}

function createDefaultAudioLayerState(): AudioLayerState {
  const beatGridLayers = {} as Record<BeatGridLayerId, BeatGridLayerUiState>;
  for (const layerId of BEAT_GRID_LAYER_IDS) {
    beatGridLayers[layerId] = { active: false, gain: 0 };
  }
  return {
    beatGridLayers,
    isPeak: false,
    beatInCycle: 0,
    beatTick: 0,
    masterGain: 0.8,
  };
}

function ensureAudioGraph(): void {
  if (layerGains && limiter) {
    return;
  }
  limiter = new Tone.Limiter(-1).toDestination();
  const gains = {} as Record<BeatGridLayerId, Tone.Gain>;
  for (const layerId of BEAT_GRID_LAYER_IDS) {
    const gain = new Tone.Gain(0);
    gain.connect(limiter);
    gains[layerId] = gain;
  }
  layerGains = gains;
}

function getLayerGainNode(layerId: BeatGridLayerId): Tone.Gain {
  ensureAudioGraph();
  return layerGains![layerId];
}

interface ApplyEnvelopeParams {
  layerId: BeatGridLayerId;
  action: ReturnType<typeof getEnvelopeAction>;
  time: number;
  bpm: number;
}

function applyEnvelopeToGain(params: ApplyEnvelopeParams): void {
  const { layerId, action, time, bpm } = params;
  const gainNode = getLayerGainNode(layerId);
  const targetLinear = dbToLinearGain(getTargetGainDb(layerId));
  const fadeSeconds = getFadeDurationSeconds(bpm);

  switch (action) {
    case "fadeIn":
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(targetLinear, time + fadeSeconds);
      break;
    case "fadeOut":
      gainNode.gain.linearRampToValueAtTime(0, time + fadeSeconds);
      break;
    case "cutOn":
      gainNode.gain.setValueAtTime(targetLinear, time);
      break;
    case "cutOff":
      gainNode.gain.setValueAtTime(0, time);
      break;
    case "hold":
      gainNode.gain.setValueAtTime(targetLinear, time);
      break;
    case "silent":
      gainNode.gain.setValueAtTime(0, time);
      break;
    default:
      break;
  }
}

async function loadLayerInstruments(instruments: Record<BeatGridLayerId, string>): Promise<void> {
  await Promise.all(
    BEAT_GRID_LAYER_IDS.map(async (layerId) => {
      const name = instruments[layerId];
      try {
        const gainNode = getLayerGainNode(layerId);
        const loaded = await loadInstrument(name, gainNode.input as unknown as AudioNode);
        layerInstruments[layerId] = loaded;
      } catch {
        // Keep previous instrument on failure
      }
    })
  );
}

function startNewCycle(beatInCycle: number): void {
  if (beatInCycle !== 0) {
    return;
  }
  const instruments = assignRoleInstruments();
  cycleHarmony = createCycleHarmony();
  cycleConfig = mergeCycleInstruments(createCycleConfig(), instruments);
  void loadLayerInstruments(instruments);
}

function updateUiLayerState(beatInCycle: number): void {
  const beatGridLayers = {} as Record<BeatGridLayerId, BeatGridLayerUiState>;
  for (const layerId of BEAT_GRID_LAYER_IDS) {
    const active = isLayerActive(layerId, beatInCycle);
    const gainDb = active ? getTargetGainDb(layerId) : -Infinity;
    beatGridLayers[layerId] = {
      active,
      gain: active ? dbToLinearGain(gainDb) : 0,
    };
  }
  currentLayerState = {
    beatGridLayers,
    isPeak: isPeakOverlap(beatInCycle),
    beatInCycle,
    beatTick: currentLayerState.beatTick + 1,
    masterGain: currentLayerState.masterGain,
  };
  notifyLayerStateListeners();
}

function triggerActiveLayers(time: number, beatInCycle: number, bpm: number): void {
  if (!cycleConfig || !cycleHarmony) {
    return;
  }
  const beatSeconds = getBeatDurationSeconds(bpm);

  for (const layerId of BEAT_GRID_LAYER_IDS) {
    if (!shouldTriggerLayer({ layerId, beatInCycle })) {
      continue;
    }
    const instrument = layerInstruments[layerId];
    if (!instrument) {
      continue;
    }
    const humanize = computeHumanizeSeconds(bpm);
    const midi = getArpeggiatedMidiForLayer(layerId, beatInCycle, cycleHarmony);
    const linearGain = dbToLinearGain(getTargetGainDb(layerId));
    const noteDuration = beatSeconds * getNoteDurationRatio(layerId);
    playNote({
      instrument,
      midi,
      time: time + humanize,
      durationSeconds: noteDuration,
      gainLinear: linearGain,
    });
  }
}

function onBeat(time: number): void {
  const bpm = Tone.Transport.bpm.value;
  const beatInCycle = globalBeatIndex % 64;
  const prevBeatInCycle = globalBeatIndex === 0 ? -1 : beatInCycle === 0 ? 63 : beatInCycle - 1;

  if (!cycleConfig) {
    startNewCycle(0);
  } else if (beatInCycle === 0 && globalBeatIndex > 0) {
    startNewCycle(0);
  }

  if (cycleConfig) {
    for (const layerId of BEAT_GRID_LAYER_IDS) {
      const action = getEnvelopeAction({
        layerId,
        beatInCycle,
        prevBeatInCycle,
        config: cycleConfig,
      });
      applyEnvelopeToGain({ layerId, action, time, bpm });
    }
  }

  triggerActiveLayers(time, beatInCycle, bpm);
  updateUiLayerState(beatInCycle);
  globalBeatIndex += 1;
}

export function getBeatGridLayerState(): AudioLayerState {
  return currentLayerState;
}

export function startBeatGridPlayback(initialBpm: number): void {
  ensureAudioGraph();
  globalBeatIndex = 0;
  cycleConfig = null;
  cycleHarmony = null;
  layerInstruments = { L64: null, L32: null, L16: null, L8: null };
  currentLayerState = createDefaultAudioLayerState();

  Tone.Transport.bpm.value = initialBpm;

  if (scheduleId !== null) {
    Tone.Transport.clear(scheduleId);
  }

  scheduleId = Tone.Transport.scheduleRepeat((time) => {
    onBeat(time);
  }, "4n");

  Tone.Transport.start();
  startNewCycle(0);
}

export function stopBeatGridPlayback(): void {
  if (scheduleId !== null) {
    Tone.Transport.clear(scheduleId);
    scheduleId = null;
  }
  Tone.Transport.stop();
  globalBeatIndex = 0;
  cycleConfig = null;
  cycleHarmony = null;
  currentLayerState = createDefaultAudioLayerState();
}

export function disposeBeatGridAudio(): void {
  stopBeatGridPlayback();
  if (layerGains) {
    for (const layerId of BEAT_GRID_LAYER_IDS) {
      layerGains[layerId].dispose();
    }
    layerGains = null;
  }
  limiter?.dispose();
  limiter = null;
  layerInstruments = { L64: null, L32: null, L16: null, L8: null };
}
