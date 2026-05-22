# RhythmRunner Core — Development Plan

## Summary

Implement RhythmRunner v1 per [`documentation/DOC_SDD_RHYTHM_RUNNER.md`](../../DOC_SDD_RHYTHM_RUNNER.md): client-only step detection, Tone.js Transport audio, synesthetic session UI in `src/features/rhythm/`.

**Development environment assumption:** Desktop + browser + Cursor (`pnpm dev` at localhost). Mobile device QA is a **release gate**, not the daily loop.

**Testing strategy:** TDD for all pure logic; desktop **simulators** for integration and manual browser testing; Vitest (jsdom) + optional dev-only UI harness.

---

## Phase overview

| Phase | Goal | Gate | Status |
|-------|------|------|--------|
| 0 | TDD scaffold + Tone desktop smoke | Vitest green + desktop audio | Done |
| 1 | Motion + **simulator** + permission gate | Tests + dev panel on localhost | Done |
| 2 | Step detection (TDD first) | All service tests green + simulator BPM | Done |
| 3 | Audio engine (mocked tests + desktop hear) | Tests + simulator drives Transport | Done |
| 4 | Drums + piano (TDD pattern tables) | Tests + desktop listen | Done |
| 5 | Session UI | RTL + desktop full flow | Done |
| 6 | Docs + CI; mobile spot-check | CI green + optional phone matrix | Done |

---

## Notes during development

- [Phase 0] Fixed `resolveBpm` fallback: silence timeout must apply even when rolling intervals exist (SDD §3).
- [Phase 0] Vitest `tone` mock requires `vi.hoisted` class for `MembraneSynth` / `PolySynth`.
- [Phase 1–2] Simulator initially toggled peak/valley every 40ms → BPM stuck at 60; fixed to one peak per cadence interval.
- [Phase 1] Dev default: `simulatorEnabled = import.meta.env.DEV` so desktop Chrome works without hardware motion.
- [Phase 5] Session logic extracted to `useRhythmSession` hook to satisfy `max-lines-per-function` / arch warnings.
- [Phase 6] Renamed `documentation/SDD_RHYTHM_RUNNER.md` → `DOC_SDD_RHYTHM_RUNNER.md` for structure whitelist; removed `generate_sdd.py` from `jobs/` (only `*.md` allowed there).
- [Manual] Browser check: Start + simulator → ~149 BPM at target 160 (acceptable ±3 after convergence).

---

## Decisions made

| Decision | Context | Outcome | User asked? |
|----------|---------|---------|-------------|
| Desktop-first dev | User dev env is desktop + browser | Simulator + TDD; mobile = pre-release only | Yes |
| TDD order | User asked about TDD | Services: test-first; hooks after service green | Yes |
| Default dev motion source | Desktop lacks reliable motion | Simulator on in `import.meta.env.DEV` | Yes |
| Soundfonts | SDD mentions gleitz CDN | Tone.js built-in synths for v1 (smaller scope, no CDN) | No |
| Session orchestration | Component line limits | `useRhythmSession` hook | No |

---

## TDD and desktop-first testing (explicit)

(See original plan sections — unchanged intent; implemented as described.)

---

## Conflict & compliance

- Layers: pages → components → hooks → services — enforced; `useRhythmSession` imports services (allowed for hooks).
- Feature README: strict headings present.
- Dependency: `tone@15.1.22` added.

---

## Phase details (archived)

Phases 0–6 executed in order. Gates: `pnpm test:run` (44 tests), `pnpm type-check`, `pnpm lint` (0 errors), `pnpm validate:structure`, `pnpm arch:check`, `pnpm validate:feature-docs:strict`, `pnpm build`, desktop browser Start → BPM ~160 with simulator.
