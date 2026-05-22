import { describe, it, expect } from "vitest";
import {
  computeHumanizeSeconds,
  getTargetGainDb,
  isLayerActive,
  isPeakOverlap,
} from "./beatGridLayerService";

describe("beatGridLayerService", () => {
  it("should keep L64 active for entire cycle", () => {
    expect(isLayerActive("L64", 0)).toBe(true);
    expect(isLayerActive("L64", 63)).toBe(true);
  });

  it("should toggle L32 at boundaries 15/16 and 47/48", () => {
    expect(isLayerActive("L32", 15)).toBe(false);
    expect(isLayerActive("L32", 16)).toBe(true);
    expect(isLayerActive("L32", 47)).toBe(true);
    expect(isLayerActive("L32", 48)).toBe(false);
  });

  it("should toggle L16 at boundaries 23/24 and 39/40", () => {
    expect(isLayerActive("L16", 23)).toBe(false);
    expect(isLayerActive("L16", 24)).toBe(true);
    expect(isLayerActive("L16", 39)).toBe(true);
    expect(isLayerActive("L16", 40)).toBe(false);
  });

  it("should toggle L8 at boundaries 27/28 and 35/36", () => {
    expect(isLayerActive("L8", 27)).toBe(false);
    expect(isLayerActive("L8", 28)).toBe(true);
    expect(isLayerActive("L8", 35)).toBe(true);
    expect(isLayerActive("L8", 36)).toBe(false);
  });

  it("should detect peak overlap on beats 28-35", () => {
    expect(isPeakOverlap(27)).toBe(false);
    expect(isPeakOverlap(28)).toBe(true);
    expect(isPeakOverlap(35)).toBe(true);
    expect(isPeakOverlap(36)).toBe(false);
  });

  it("should apply similar layer gains in dB", () => {
    expect(getTargetGainDb("L64")).toBe(-3);
    expect(getTargetGainDb("L32")).toBe(-2);
    expect(getTargetGainDb("L16")).toBe(-1);
    expect(getTargetGainDb("L8")).toBe(0);
  });

  it("should clamp humanize within beat cap", () => {
    const offset = computeHumanizeSeconds(120, () => 1);
    expect(Math.abs(offset)).toBeLessThanOrEqual((60 / 120) * 0.12);
  });
});
