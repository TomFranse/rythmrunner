import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  rampTo,
  scheduleRepeat,
  clear,
  transportStart,
  transportStop,
  toneStart,
  startBeatGridPlayback,
  stopBeatGridPlayback,
  disposeBeatGridAudio,
  getBeatGridLayerState,
} = vi.hoisted(() => ({
  rampTo: vi.fn(),
  scheduleRepeat: vi.fn(() => 42),
  clear: vi.fn(),
  transportStart: vi.fn(),
  transportStop: vi.fn(),
  toneStart: vi.fn().mockResolvedValue(undefined),
  startBeatGridPlayback: vi.fn(),
  stopBeatGridPlayback: vi.fn(),
  disposeBeatGridAudio: vi.fn(),
  getBeatGridLayerState: vi.fn(() => ({
    beatGridLayers: {
      L64: { active: true, gain: 0.25 },
      L32: { active: false, gain: 0 },
      L16: { active: false, gain: 0 },
      L8: { active: false, gain: 0 },
    },
    isPeak: false,
    beatInCycle: 0,
    beatTick: 0,
    masterGain: 0.8,
  })),
}));

vi.mock("tone", () => ({
  start: toneStart,
  getContext: vi.fn(() => ({
    state: "running",
    resume: vi.fn().mockResolvedValue(undefined),
  })),
  Transport: {
    bpm: { value: 60, rampTo },
    scheduleRepeat,
    clear,
    start: transportStart,
    stop: transportStop,
    state: "stopped",
  },
}));

vi.mock("@/features/rhythm/services/beatGridAudioService", () => ({
  startBeatGridPlayback,
  stopBeatGridPlayback,
  disposeBeatGridAudio,
  getBeatGridLayerState,
}));

import * as Tone from "tone";
import {
  disposeAudioEngine,
  getAudioLayerState,
  setTransportBpm,
  startAudioContext,
  startRhythmPlayback,
  stopRhythmPlayback,
} from "./audioEngineService";

describe("audioEngineService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disposeAudioEngine();
  });

  it("should start audio context via Tone.start", async () => {
    await startAudioContext();
    expect(Tone.start).toHaveBeenCalled();
  });

  it("should ramp transport BPM when setting tempo", async () => {
    await startAudioContext();
    setTransportBpm(172, 0.5);
    expect(rampTo).toHaveBeenCalledWith(172, 0.5);
  });

  it("should delegate rhythm playback to beatgrid service", async () => {
    await startAudioContext();
    startRhythmPlayback(120);
    expect(startBeatGridPlayback).toHaveBeenCalledWith(120);
  });

  it("should clear beatgrid on stop", async () => {
    await startAudioContext();
    startRhythmPlayback(120);
    stopRhythmPlayback();
    expect(stopBeatGridPlayback).toHaveBeenCalled();
  });

  it("should expose beatgrid layer state", () => {
    const state = getAudioLayerState();
    expect(state.beatGridLayers.L64.active).toBe(true);
  });
});
