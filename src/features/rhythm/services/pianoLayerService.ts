export interface PianoLayerConfig {
  voices: number;
  chordEvery: number;
}

const BPM_BANDS: { maxBpm: number; config: PianoLayerConfig }[] = [
  { maxBpm: 120, config: { voices: 1, chordEvery: 4 } },
  { maxBpm: 150, config: { voices: 2, chordEvery: 2 } },
  { maxBpm: Infinity, config: { voices: 3, chordEvery: 1 } },
];

export function getPianoLayerForBpm(bpm: number): PianoLayerConfig {
  const band = BPM_BANDS.find((entry) => bpm <= entry.maxBpm);
  return band?.config ?? BPM_BANDS[0].config;
}
