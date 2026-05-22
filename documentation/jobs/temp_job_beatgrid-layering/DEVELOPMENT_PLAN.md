# Beatgrid Layering — Development Plan

## Summary

Replace the current BPM-band drum/piano schedule with a **64-beat mathematical beatgrid** driving four duration layers (**64 / 32 / 16 / 8** quarter-note beats). Each layer plays **its own soundfont sample** from the gleitz library, with **random layer assignment each cycle**, **70/30 fade vs hard-cut** (per layer per cycle), **4-beat fades**, **inverse volume pyramid** (8 loudest), **humanized hit timing**, and **intentional climax at beats 28–35** when all layers overlap.

**Why:** User workflow mirrors Rekordbox beatgrid thinking, but the app uses **pure beat math** (not Rekordbox import). Audio is the deliverable first (`audio_engine`); UI follows the same layer model.

**BPM source:** Live step-detection BPM → `Tone.Transport.bpm.rampTo`. **Beat 0** of the 64-beat cycle starts on **session start** (first `startRhythmPlayback`).

**Out of scope (this job):**

- Shifting offsets for variety (future task; must stay grid-quantized when added).
- Rekordbox file import / metadata.
- “Slow intro” as a separate mode (user: ignore).
- Custom user audio drop folder (future).

---

## Locked specification (no ambiguity)

### Time base

| Term | Definition |
|------|------------|
| **Beat** | One quarter note at current Transport BPM (4/4 mental model). |
| **Cycle** | 64 beats, index `beatInCycle = globalBeatIndex % 64`. |
| **Global beat index** | `0` at session start; increments every quarter note from Transport. |

### Layer windows (`beatInCycle`, 0-based)

| Layer ID | Duration label | ON range (inclusive) | OFF ranges |
|----------|----------------|----------------------|------------|
| `L64` | 64 | `0–63` | none |
| `L32` | 32 | `16–47` | `0–15`, `48–63` |
| `L16` | 16 | `24–39` | `0–23`, `40–63` |
| `L8` | 8 | `28–35` | `0–27`, `36–63` |

**Peak overlap:** beats **28–35** — all four layers ON; treat as intentional musical climax (UI may emphasize later).

**Original “13”:** typo for **32** — not used anywhere.

### Playback rules

| Rule | Behavior |
|------|----------|
| **Overlap** | All layers whose window is ON play together (no ducking). |
| **OFF window** | No new triggers. Layer fully silent (gain → 0). |
| **Hits in ON** | One trigger per quarter beat while ON. |
| **Humanize** | Random time offset within the beat: uniform **±`HUMANIZE_MS`** (default **25 ms**), clamped to **±12% of beat duration**. Constant in config; tunable without spec change. |
| **Note pitch** | Per-layer random MIDI note from configured range (default **48–72**) each trigger, so timbre varies without extra samples. |
| **Fade vs cut** | Per layer, per 64-beat cycle: **70%** fade path, **30%** hard-cut path (independent random). |
| **Fade path** | **4 beats** fade-in at ON boundary, **4 beats** fade-out at OFF boundary; then **mute** (0 gain). |
| **Cut path** | **Instant mute** at OFF boundary; **instant full target gain** at ON boundary (no fade-in). |
| **Cycle boundary** | At `beatInCycle === 0`: assign new random instrument per layer from library; re-roll fade/cut per layer. |
| **Sample assignment** | Each of the four layers draws **independently** from the catalog (duplicates allowed). |
| **Library** | gleitz **FluidR3_GM** via `soundfont-player` (see Options). Mixed families allowed (any catalog instrument). |

### Gain (inverse pyramid)

Relative layer gain when ON (before master limiter):

| Layer | Gain (dB) |
|-------|-----------|
| `L64` | −12 |
| `L32` | −8 |
| `L16` | −4 |
| `L8` | 0 (reference) |

**Master:** `Tone.Limiter(-1)` on bus + `masterGain` 0.8 default (existing). If peak still clips, reduce all layer gains proportionally in service (no user setting in v1).

### Cycle math reference (top layer)

Symmetric 8-beat window centered in 64: **X = 28** → pattern `[silent 28][on 8][silent 28]`.

---

## Options researched

### Sample library + playback

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **A. `soundfont-player` + gleitz CDN** | Matches SDD + user choice; loads FluidR3_GM/MusyngKite; small API; works with shared `AudioContext` | Parallel to Tone instruments; need bridge for Transport `time` | **Selected** |
| **B. `Tone.Sampler` + manual gleitz `-mp3.js` parse** | Pure Tone graph | Heavy loader; decode base64 from MIDI.js JS files | Rejected |
| **C. Keep Tone synths (current)** | Already shipped | Not sample library; user rejected | Rejected |
| **D. `@magenta/music` SoundFontPlayer** | Tone-aware | Large dependency; NoteSequence-oriented | Rejected |
| **E. Self-hosted `public/soundfonts/` subset** | Offline, faster repeat visits | Repo size + maintenance; CDN fine for v1 | **Phase 2 optional** |

**Integration pattern (A):**

- `Soundfont.instrument(Tone.getContext().rawContext, name, { soundfont: 'FluidR3_GM', format: 'mp3' })`.
- Schedule: `instrument.play(midiNote, time + humanizeSeconds, { duration, gain })` inside `Tone.Transport.scheduleRepeat(..., '4n')`.
- Per-layer volume automation: **`Tone.Gain`** nodes; soundfont routed through layer gain → limiter → destination.
- Cache loaded instruments in memory for the session; at cycle 0 load up to four new names (async; if not ready by beat 0, **hold previous** instrument until load completes).

### Scheduling

| Option | Decision |
|--------|----------|
| `setInterval` / `setTimeout` for beats | **Forbidden** (SDD) |
| `Tone.Transport.scheduleRepeat` @ `'4n'` | **Selected** — one callback per quarter note |
| Step event drives each beat | Rejected — drift vs Transport |

### Catalog

- Source: [FluidR3_GM instrument list](https://github.com/gleitz/midi-js-soundfonts/blob/gh-pages/FluidR3_GM/instrument_names.json) (or curated subset in repo).
- v1 catalog: **~20 instruments** (mix of percussion + melodic), hardcoded in `beatGridCatalog.ts` to avoid fetching 100+ MB of names.
- Expand later without changing grid logic.

---

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 0 | Foundation POC: one soundfont + one Transport hit | Sound heard on desktop simulator | Done |
| 1 | Pure beatgrid math + tests | Vitest green for all window/fade logic | Done |
| 2 | Sample library service + cycle assignment | 4 instruments load; random assign at cycle 0 | Done |
| 3 | Audio engine integration | Beatgrid drives session; old BPM-band schedule removed | Done |
| 4 | UI layer state (4 circles) | RTL + desktop: 4 circles reflect L64–L8 activity | Done |
| 5 | Docs + quality gate | CI + feature README updated | Done |

---

## Conflict & compliance

| Rule | Application |
|------|-------------|
| `.cursor/rules/architecture/RULE.md` | Logic in `services/`; scheduling stays in `audioEngineService`; hooks only orchestrate BPM/phase. |
| `.cursor/rules/file-placement/RULE.md` | New files under `src/features/rhythm/services/` and `types/`; catalog as `beatGridCatalog.ts`. |
| `.cursor/rules/code-style/RULE.md` | Extract helpers if functions exceed limits; cyclomatic ≤10 per function. |
| `.cursor/rules/testing/RULE.md` | TDD for `beatGridLayerService`, `beatGridCycleService`, `sampleLibraryService` (mock soundfont). |
| `projectStructure.config.cjs` | No config change expected (feature services already allowed). |
| Dependency | Add `soundfont-player` (+ types if needed); keep `tone@15.1.22`. Run `pnpm arch:check` after imports. |

**Risks:**

- CDN latency on first cycle — mitigate with loading spinner state optional; hold previous samples until ready.
- soundfont-player uses Web Audio API — must use `Tone.getContext().rawContext` (same context after `Tone.start()`).
- Mobile: test on device before claiming success (user rule).

**Deprecations:**

- `pianoLayerService` BPM-band voices — superseded by beatgrid layers for session playback (remove usage from `audioEngineService`; keep file only if tests/docs need migration note, else delete in Phase 3).
- `drumPatternService` kick/snare schedule — superseded by sample triggers (remove from engine in Phase 3).

---

## Existing functionality to reuse

- `audioEngineService.ts` — Transport lifecycle, `startAudioContext`, BPM ramp.
- `useRhythmAudio` / `useRhythmSession` — session phase + BPM feed.
- `stepDetectionService` + simulator — BPM source on desktop.
- `PulsingCircles.tsx` — extend to four layers (not three piano voices).

---

## Phase 0 — Foundation POC

### Goal

Prove gleitz soundfonts play in sync with `Tone.Transport` before building grid logic.

### Steps

1. Add dependency: `soundfont-player` (pin version in `package.json`).
2. In a throwaway test or minimal `sampleLibraryService.poc.ts` path: load one instrument (`acoustic_grand_piano` or `marimba`) after `Tone.start()`.
3. `Transport.scheduleRepeat` @ `'4n'`: `play(60, time)` with humanize 0.
4. Manual gate: desktop dev + motion simulator → hear quarter-note samples at 60 BPM.

### Gate

- One instrument audible, no drift over 30 s, no console errors.
- `pnpm type-check` passes.

---

## Phase 1 — Beatgrid math (TDD)

### Goal

Pure, testable layer window and envelope logic with zero audio I/O.

### Steps

1. Add types in `src/features/rhythm/types/rhythm.types.ts`:
   - `BeatGridLayerId = 'L64' | 'L32' | 'L16' | 'L8'`
   - `BeatGridLayerState` (active, gainDb, fadeMode, instrumentName, beatInCycle)
   - Extend `AudioLayerState` → `beatGridLayers: Record<BeatGridLayerId, { active: boolean; gain: number }>` (keep backward fields deprecated or remove in Phase 3).
2. Create `src/features/rhythm/services/beatGridLayerService.ts`:
   - `isLayerActive(layerId, beatInCycle): boolean` — table-driven from Locked spec.
   - `isPeakOverlap(beatInCycle): boolean` — `beatInCycle >= 28 && beatInCycle <= 35`.
   - `getTargetGainDb(layerId): number` — inverse pyramid table.
   - `computeHumanizeSeconds(bpm, random): number` — ±25 ms clamp.
3. Create `src/features/rhythm/services/beatGridCycleService.ts`:
   - `createCycleConfig(random)`: per-layer `fadeMode: 'fade' | 'cut'` (70/30).
   - `assignInstruments(catalog, random)`: four independent picks.
   - `getEnvelopeAction(layer, beatInCycle, prevBeat, config)`: returns `fadeIn` | `fadeOut` | `hold` | `cutOn` | `cutOff` for gain automation.
4. Tests first: `beatGridLayerService.test.ts`, `beatGridCycleService.test.ts` — cover boundaries 15/16, 23/24, 27/28, 35/36, 47/48, cycle 0 assignment.

### Gate

- `pnpm test:run` green for new tests.
- Boundary table matches Locked spec (automated assertions).

---

## Phase 2 — Sample library service

### Goal

Load and cache soundfont instruments; expose play API for scheduler.

### Steps

1. `src/features/rhythm/services/beatGridCatalog.ts` — export `BEAT_GRID_INSTRUMENTS: string[]` (~20 names).
2. `src/features/rhythm/services/sampleLibraryService.ts`:
   - `loadInstrument(name): Promise<SoundfontInstrument>`
   - `pickRandomInstrument(rng): string`
   - `playNote(instrument, midi, time, duration, gain)` — wraps `instrument.play`
   - Session cache `Map<string, SoundfontInstrument>`
3. Mock soundfont in tests (vi.fn play).
4. On cycle 0: `assignInstruments` triggers parallel `loadInstrument` for four names; store in `BeatGridRuntimeState`.

### Gate

- Unit tests: assignment returns four strings from catalog; cache does not refetch same name.
- Desktop: log shows four instrument names at each cycle boundary.

---

## Phase 3 — Audio engine integration

### Goal

`audioEngineService` schedules beatgrid layers; removes old drum/piano tick schedule.

### Steps

1. `src/features/rhythm/services/beatGridAudioService.ts` (or extend `audioEngineService.ts` if ≤100 lines per function after extract):
   - Init four `Tone.Gain` nodes + limiter.
   - `scheduleRepeat` @ `'4n'`: increment `globalBeatIndex`, compute `beatInCycle`, update gains from envelope service, trigger samples for active layers.
   - Gain ramps: **4 beats** = `4 * (60/bpm)` seconds linear ramp on `Tone.Gain`.
   - Cut path: `gain.rampTo(0, 0)` at OFF, `gain.rampTo(target, 0)` at ON.
2. Wire `startRhythmPlayback` / `stopRhythmPlayback` / `disposeAudioEngine`.
3. Update `getAudioLayerState()` for UI consumption.
4. Remove `getPianoLayerForBpm` / `getDrumPatternForBpm` usage from playback path.
5. Update `audioEngineService.test.ts` — mock beatgrid scheduler.

### Gate

- Desktop simulator session: hear layered entries at beats 16, 24, 28; climax denser at 28–35; new instruments every 64 beats.
- Fade vs cut audibly distinct over multiple cycles.
- `pnpm test:run`, `pnpm lint`, `pnpm arch:check` pass.

---

## Phase 4 — UI sync

### Goal

Four pulsing circles map to L64–L8 activity and peak emphasis.

### Steps

1. `PulsingCircles.tsx`: render 4 circles fixed order [L64, L32, L16, L8]; opacity/scale from `beatGridLayers[].active` and gain.
2. Optional: stronger pulse when `isPeakOverlap(beatInCycle)` (read from state flag `isPeak` exported by engine).
3. `RhythmSessionView` — pass updated `AudioLayerState`.

### Gate

- Desktop: four circles visible; peak beats visually strongest.
- RTL test: renders 4 circles when mock state has four actives.

---

## Phase 5 — Docs & CI

### Steps

1. Update `src/features/rhythm/README.md` — beatgrid layering, cycle behavior, catalog.
2. Update `documentation/DOC_SDD_RHYTHM_RUNNER.md` §4.2–4.3 — reference implemented beatgrid (not only planned piano/drum bands).
3. Add row to `documentation/jobs/temp_job_beatgrid-layering/` cross-link from DOC index if required by structure validator.

### Gate

- `pnpm validate:feature-docs:strict`, `pnpm build`, full `pnpm test:run`.

---

## File plan

| File | Action |
|------|--------|
| `src/features/rhythm/types/rhythm.types.ts` | Extend types |
| `src/features/rhythm/services/beatGridCatalog.ts` | New |
| `src/features/rhythm/services/beatGridLayerService.ts` | New |
| `src/features/rhythm/services/beatGridCycleService.ts` | New |
| `src/features/rhythm/services/sampleLibraryService.ts` | New |
| `src/features/rhythm/services/beatGridAudioService.ts` | New (or merge into audioEngine) |
| `src/features/rhythm/services/audioEngineService.ts` | Refactor to delegate |
| `src/features/rhythm/services/pianoLayerService.ts` | Remove from playback or delete |
| `src/features/rhythm/services/drumPatternService.ts` | Remove from playback or delete |
| `src/features/rhythm/components/PulsingCircles.tsx` | Update |
| `package.json` | Add `soundfont-player` |

---

## Defaults deferred in interview (locked here)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `HUMANIZE_MS` | 25 | User did not answer; subtle groove |
| Humanize cap | 12% of beat period | Scales with BPM |
| MIDI note range | 48–72 | Random pitch per hit |
| Catalog size | 20 instruments | Balance variety vs load time |
| Soundfont bank | `FluidR3_GM` | SDD + user |
| Instrument load failure | Keep previous sample | Avoid silence gap |
| Duplicate instruments across layers | Allowed | User: mixed, random mapping |

---

## Notes during development

- [Phase 0–3] Integrated soundfont-player directly into `sampleLibraryService` (no throwaway POC file).
- [Phase 3] Removed `pianoLayerService` and `drumPatternService`; playback is beatgrid-only at `"4n"`.
- [Phase 3] `getEnvelopeAction` / `playNote` / `applyEnvelopeToGain` use options objects for ESLint `max-params`.
- [Phase 4] PulsingCircles uses fixed layer order L64→L8; peak scale when `isPeak`.
- [Gate] User must confirm audio on desktop/mobile per test plan below.

---

## Decisions made

| Decision | Context | Outcome | User asked? |
|----------|---------|---------|-------------|
| Sample backend | User + SDD | `soundfont-player` + gleitz FluidR3_GM | Yes (interview) |
| Grid math | Interview | Locked windows + X=28 | Yes |
| Overlap / peak | Interview | All play; 28–35 climax | Yes |
| Fade/cut | Interview | 70/30 per layer per cycle; 4-beat fades | Yes |
| Library scope | Interview | Mixed; random per layer per cycle | Yes |
| Variety shifts | Interview | Out of scope | Yes |
| Humanize / gain dB | Not answered | Defaults in table above | No (plan lock) |
| Envelope API shape | ESLint max-params | Options-object params | No |
| soundfont-player import | ESM default export | `import Soundfont from "soundfont-player"` | No |

---

## Test plan (for user verification)

After Phase 3+4, user validates on desktop with motion simulator:

1. Start session — beat 0 aligns with start; base layer audible immediately.
2. At beat 16 — second layer enters (fade or cut audible).
3. At beat 24 — third layer enters.
4. At beats 28–35 — densest mix (climax).
5. After 64 beats — timbre changes (new random instruments).
6. Run 3+ cycles — observe both smooth 4-beat fades and instant cuts.
7. BPM change via simulator — grid stays musically aligned (Transport ramps).

Success is **user-confirmed** hearing and feel, not agent-only tests.
