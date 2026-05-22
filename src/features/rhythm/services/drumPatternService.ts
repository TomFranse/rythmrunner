export type DrumDensity = "sparse" | "medium" | "dense";

export interface DrumPatternConfig {
  density: DrumDensity;
  kickEvery: number;
  snareEvery: number;
}

const BPM_BANDS: { maxBpm: number; config: DrumPatternConfig }[] = [
  { maxBpm: 120, config: { density: "sparse", kickEvery: 2, snareEvery: 4 } },
  { maxBpm: 150, config: { density: "medium", kickEvery: 1, snareEvery: 2 } },
  { maxBpm: Infinity, config: { density: "dense", kickEvery: 1, snareEvery: 1 } },
];

export function getDrumPatternForBpm(bpm: number): DrumPatternConfig {
  const band = BPM_BANDS.find((entry) => bpm <= entry.maxBpm);
  return band?.config ?? BPM_BANDS[0].config;
}

export function shouldTriggerKick(tick: number, config: DrumPatternConfig): boolean {
  return tick % config.kickEvery === 0;
}

export function shouldTriggerSnare(tick: number, config: DrumPatternConfig): boolean {
  return tick % config.snareEvery === 0;
}
