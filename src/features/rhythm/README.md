# Rhythm

Beat generation from device motion (accelerometer via `DeviceMotionEvent`). Core running session: step detection, Tone.js transport, and synesthetic UI.

## Purpose

Synchronize generated music (drums + piano layers) with the runner's cadence (BPM). Client-only; no backend. Desktop development uses an optional motion simulator (`import.meta.env.DEV`).

## Structure

```
rhythm/
├── components/       # Session UI, permission gate, dev simulator panel
├── hooks/            # useDeviceMotion, useStepDetection, useRhythmAudio
├── services/         # Pure logic: steps, audio, patterns, permissions, simulator
├── types/            # rhythm.types.ts
└── README.md
```

## Dependencies

- **tone** — Web Audio transport and synths
- **@mui/material** — session UI
- **Browser APIs** — `DeviceMotionEvent`, Web Audio user activation on Start

## Development

- Unit tests: `pnpm test:run -- src/features/rhythm`
- Dev simulator: enable on Home when motion is unavailable or for desktop testing
- Design reference: `documentation/DOC_SDD_RHYTHM_RUNNER.md`
