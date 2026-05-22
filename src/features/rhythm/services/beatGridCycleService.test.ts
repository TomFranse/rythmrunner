import { describe, it, expect } from "vitest";
import {
  assignInstruments,
  createCycleConfig,
  getEnvelopeAction,
  mergeCycleInstruments,
} from "./beatGridCycleService";
import { BEAT_GRID_INSTRUMENTS } from "./beatGridCatalog";

describe("beatGridCycleService", () => {
  it("should assign four instruments from catalog", () => {
    const rng = () => 0;
    const assigned = assignInstruments(rng, BEAT_GRID_INSTRUMENTS);
    expect(assigned.L64).toBe(BEAT_GRID_INSTRUMENTS[0]);
    expect(assigned.L32).toBe(BEAT_GRID_INSTRUMENTS[0]);
  });

  it("should roll fade mode ~70% with seeded rng", () => {
    const rng = () => 0.5;
    const config = createCycleConfig(rng);
    expect(config.L64.fadeMode).toBe("fade");
    expect(config.L8.fadeMode).toBe("fade");
  });

  it("should return fadeIn when L32 turns on at beat 16", () => {
    const config = createCycleConfig(() => 0);
    const withFade = mergeCycleInstruments(
      config,
      assignInstruments(() => 0)
    );
    withFade.L32.fadeMode = "fade";
    expect(
      getEnvelopeAction({ layerId: "L32", beatInCycle: 16, prevBeatInCycle: 15, config: withFade })
    ).toBe("fadeIn");
  });

  it("should return cutOn when L32 turns on with cut mode", () => {
    const config = createCycleConfig(() => 0.9);
    const withCut = mergeCycleInstruments(
      config,
      assignInstruments(() => 0)
    );
    withCut.L32.fadeMode = "cut";
    expect(
      getEnvelopeAction({ layerId: "L32", beatInCycle: 16, prevBeatInCycle: 15, config: withCut })
    ).toBe("cutOn");
  });

  it("should return fadeOut when L8 turns off at beat 36", () => {
    const config = createCycleConfig(() => 0);
    const merged = mergeCycleInstruments(
      config,
      assignInstruments(() => 0)
    );
    merged.L8.fadeMode = "fade";
    expect(
      getEnvelopeAction({ layerId: "L8", beatInCycle: 36, prevBeatInCycle: 35, config: merged })
    ).toBe("fadeOut");
  });

  it("should return hold while layer stays active", () => {
    const config = mergeCycleInstruments(
      createCycleConfig(() => 0),
      assignInstruments(() => 0)
    );
    expect(getEnvelopeAction({ layerId: "L64", beatInCycle: 10, prevBeatInCycle: 9, config })).toBe(
      "hold"
    );
  });
});
