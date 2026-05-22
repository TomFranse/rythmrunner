import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPlay, mockInstrument } = vi.hoisted(() => {
  const play = vi.fn();
  return {
    mockPlay: play,
    mockInstrument: vi.fn().mockResolvedValue({ play }),
  };
});

vi.mock("soundfont-player", () => ({
  default: {
    instrument: mockInstrument,
  },
}));

vi.mock("tone", () => ({
  getContext: vi.fn(() => ({
    rawContext: { destination: {} },
  })),
}));

import { pickRandomInstrument, playNote, clearInstrumentCache } from "./sampleLibraryService";
import { BEAT_GRID_INSTRUMENTS } from "./beatGridCatalog";

describe("sampleLibraryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearInstrumentCache();
  });

  it("should pick from catalog", () => {
    expect(pickRandomInstrument(() => 0, BEAT_GRID_INSTRUMENTS)).toBe(BEAT_GRID_INSTRUMENTS[0]);
  });

  it("should play note via instrument", () => {
    const instrument = { play: mockPlay };
    playNote({
      instrument,
      midi: 60,
      time: 1,
      durationSeconds: 0.5,
      gainLinear: 0.8,
    });
    expect(mockPlay).toHaveBeenCalledWith(60, 1, { duration: 0.5, gain: 0.8 });
  });
});
