import { describe, it, expect } from "vitest";
import { getDrumPatternForBpm } from "./drumPatternService";

describe("drumPatternService", () => {
  it("should use sparse pattern below 120 BPM", () => {
    expect(getDrumPatternForBpm(100).density).toBe("sparse");
  });

  it("should use medium pattern between 120 and 150 BPM", () => {
    expect(getDrumPatternForBpm(140).density).toBe("medium");
  });

  it("should use dense pattern above 150 BPM", () => {
    expect(getDrumPatternForBpm(170).density).toBe("dense");
  });
});
