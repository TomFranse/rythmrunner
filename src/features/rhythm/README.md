# Rhythm

Beat generation from device motion (accelerometer via `DeviceMotionEvent`). Core running session: step detection, Tone.js transport, beatgrid soundfont layering, and synesthetic UI.

## Purpose

Synchronize generated music with the runner's cadence (BPM) using a **64-beat mathematical beatgrid** (four duration layers: 64 / 32 / 16 / 8 quarter-note beats). Client-only; no backend. Desktop development uses an optional motion simulator (`import.meta.env.DEV`).

## Beatgrid layering

| Layer | ON beats (in 64-beat cycle) | Relative gain |
|-------|------------------------------|---------------|
| L64 | 0–63 | −3 dB |
| L32 | 16–47 | −2 dB |
| L16 | 24–39 | −1 dB |
| L8 | 28–35 (peak overlap) | 0 dB |

- **Transport:** `Tone.Transport.scheduleRepeat` at `"4n"` (one callback per beat).
- **Samples:** gleitz FluidR3_GM via `soundfont-player`; **one instrument per role** per cycle (bass / pad / harmony / lead).
- **Harmony:** major-key chord progression (I–IV–I–V per 16-beat section); **arpeggiated** chord tones (root, 3rd, 5th, octave) with per-layer phase offsets.
- **Arrangement:** section modes (intro → groove → build → peak → cooldown) gate which layers may trigger; phrase rests on beats 15, 31, 47, 63.
- **Roles:** bass (long notes), pad (every 4th beat, sustained), harmony (short), lead (staccato).
- **Envelope:** 70% fade / 30% hard-cut per layer per cycle; 4-beat fades when fading.
- **Humanize:** ±25 ms per hit (capped at 12% of beat length).

## Musical arrangement

| Section mode | Beats | Layers that may trigger |
|--------------|-------|-------------------------|
| intro | 0–15 | L64 |
| groove | 16–23 | L64, L32 |
| build | 24–27 | L64, L32, L16 |
| peak | 28–39 | all four |
| cooldown | 40–63 | L64; L32 while window ON (40–47) |

Phrase rests suppress L32, L16, and L8 on beats 15, 31, 47, 63 (L64 keeps the bass anchor). UI envelopes still follow `isLayerActive`; only note triggers use `shouldTriggerLayer`.

Services: `beatGridArrangementService`, `beatGridRoleService`, `getArpeggiatedMidiForLayer` in `beatGridHarmonyService`.

## Visual sync

- **`PulsingCircles`**: One pulse per transport beat for active layers; duration matches `Tone.Transport` BPM.
- **`useRhythmAudio`**: Subscribes to `subscribeBeatGridLayerState` on each scheduled beat so layer opacity/active state updates with audio.
- **`beatTick`**: Monotonic beat counter in `AudioLayerState` restarts the pulse animation phase on every beat.

## Structure

```
rhythm/
├── components/       # Session UI, permission gate, dev simulator panel
├── hooks/            # useDeviceMotion, useStepDetection, useRhythmAudio
├── services/         # Steps, beatgrid math, sample library, audio engine
├── types/            # rhythm.types.ts
└── README.md
```

## Dependencies

- **tone** — Web Audio transport and per-layer gain/limiter
- **soundfont-player** — gleitz FluidR3_GM sample loading
- **@mui/material** — session UI
- **Browser APIs** — `DeviceMotionEvent`, Web Audio user activation on Start

## Development

- Unit tests: `pnpm test:run -- src/features/rhythm`
- Dev simulator: enable on Home when motion is unavailable or for desktop testing
- Design reference: `documentation/DOC_SDD_RHYTHM_RUNNER.md`
- Implementation plan: `documentation/jobs/temp_job_beatgrid-layering/DEVELOPMENT_PLAN.md`
- Musical arrangement: `documentation/jobs/temp_job_musical-arrangement/DEVELOPMENT_PLAN.md`
