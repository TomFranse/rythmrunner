import { describe, it, expect, vi, beforeEach } from "vitest";

const { rampTo, scheduleRepeat, clear, transportStart, transportStop, toneStart, MockSynth } =
  vi.hoisted(() => {
    class MockSynthClass {
      volume = { value: 0 };
      toDestination() {
        return this;
      }
      triggerAttackRelease() {}
      dispose() {}
    }
    return {
      rampTo: vi.fn(),
      scheduleRepeat: vi.fn(() => 42),
      clear: vi.fn(),
      transportStart: vi.fn(),
      transportStop: vi.fn(),
      toneStart: vi.fn().mockResolvedValue(undefined),
      MockSynth: MockSynthClass,
    };
  });

vi.mock("tone", () => ({
  start: toneStart,
  now: vi.fn(() => 0),
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
  MembraneSynth: MockSynth,
  NoiseSynth: MockSynth,
  PolySynth: MockSynth,
  Synth: MockSynth,
}));

import * as Tone from "tone";
import {
  disposeAudioEngine,
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

  it("should schedule rhythm playback on transport", async () => {
    await startAudioContext();
    startRhythmPlayback(120);
    expect(scheduleRepeat).toHaveBeenCalled();
    expect(transportStart).toHaveBeenCalled();
  });

  it("should clear schedule on stop", async () => {
    await startAudioContext();
    startRhythmPlayback(120);
    stopRhythmPlayback();
    expect(clear).toHaveBeenCalledWith(42);
    expect(transportStop).toHaveBeenCalled();
  });

  it("should start rhythm after audio context unlock", async () => {
    await startAudioContext();
    startRhythmPlayback(90);
    expect(toneStart).toHaveBeenCalled();
    expect(scheduleRepeat).toHaveBeenCalled();
    expect(transportStart).toHaveBeenCalled();
  });
});
