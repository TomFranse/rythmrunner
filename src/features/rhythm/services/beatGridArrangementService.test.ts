import { describe, it, expect } from "vitest";
import { getSectionMode, isPhraseRestBeat, shouldTriggerLayer } from "./beatGridArrangementService";

describe("beatGridArrangementService", () => {
  it("should map beat ranges to section modes", () => {
    expect(getSectionMode(0)).toBe("intro");
    expect(getSectionMode(15)).toBe("intro");
    expect(getSectionMode(16)).toBe("groove");
    expect(getSectionMode(23)).toBe("groove");
    expect(getSectionMode(24)).toBe("build");
    expect(getSectionMode(27)).toBe("build");
    expect(getSectionMode(28)).toBe("peak");
    expect(getSectionMode(39)).toBe("peak");
    expect(getSectionMode(40)).toBe("cooldown");
    expect(getSectionMode(63)).toBe("cooldown");
  });

  it("should mark phrase rest beats", () => {
    expect(isPhraseRestBeat(15)).toBe(true);
    expect(isPhraseRestBeat(31)).toBe(true);
    expect(isPhraseRestBeat(47)).toBe(true);
    expect(isPhraseRestBeat(63)).toBe(true);
    expect(isPhraseRestBeat(16)).toBe(false);
  });

  it("should allow only L64 in intro", () => {
    expect(shouldTriggerLayer({ layerId: "L64", beatInCycle: 8 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 8 })).toBe(false);
  });

  it("should allow L64 and L32 in groove when on downbeat for pad", () => {
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 16 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 17 })).toBe(false);
  });

  it("should allow all layers at peak on non-rest beats", () => {
    expect(shouldTriggerLayer({ layerId: "L8", beatInCycle: 28 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L16", beatInCycle: 30 })).toBe(true);
  });

  it("should block upper layers on phrase rest beats", () => {
    expect(shouldTriggerLayer({ layerId: "L64", beatInCycle: 15 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 15 })).toBe(false);
    expect(shouldTriggerLayer({ layerId: "L16", beatInCycle: 31 })).toBe(false);
    expect(shouldTriggerLayer({ layerId: "L8", beatInCycle: 63 })).toBe(false);
  });

  it("should block L16 and L8 in cooldown after their windows", () => {
    expect(shouldTriggerLayer({ layerId: "L16", beatInCycle: 48 })).toBe(false);
    expect(shouldTriggerLayer({ layerId: "L8", beatInCycle: 48 })).toBe(false);
    expect(shouldTriggerLayer({ layerId: "L64", beatInCycle: 50 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 44 })).toBe(true);
    expect(shouldTriggerLayer({ layerId: "L32", beatInCycle: 48 })).toBe(false);
  });
});
