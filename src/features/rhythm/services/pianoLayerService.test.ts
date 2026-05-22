import { describe, it, expect } from "vitest";
import { getPianoLayerForBpm } from "./pianoLayerService";

describe("pianoLayerService", () => {
  it("should expose one voice below 120 BPM", () => {
    expect(getPianoLayerForBpm(90).voices).toBe(1);
  });

  it("should expose two voices mid tempo", () => {
    expect(getPianoLayerForBpm(140).voices).toBe(2);
  });

  it("should expose three voices at high tempo", () => {
    expect(getPianoLayerForBpm(175).voices).toBe(3);
  });
});
