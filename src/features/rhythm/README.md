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
- **Samples:** gleitz FluidR3_GM via `soundfont-player`; one consonant timbre per cycle (shared across layers).
- **Harmony:** major-key chord progression (I–IV–I–V per 16-beat section); layers play root, fifth, third, and octave — not random chromatic pitches.
- **Envelope:** 70% fade / 30% hard-cut per layer per cycle; 4-beat fades when fading.
- **Humanize:** ±25 ms per hit (capped at 12% of beat length).

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
