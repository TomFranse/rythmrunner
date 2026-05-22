# Musical Arrangement — Development Plan

## Summary

Upgrade the 64-beat beatgrid from simultaneous chord-tone hits every quarter note to **phrased, role-based music**: section modes, phrase rests, per-role instruments/durations, and arpeggiated harmony.

**Status:** Implemented.

## Delivered

| Feature | Service | Behavior |
|---------|---------|----------|
| Section modes | `beatGridArrangementService` | intro / groove / build / peak / cooldown gates triggers |
| Phrase rests | `beatGridArrangementService` | Beats 15, 31, 47, 63 — no L32/L16/L8 triggers |
| Role separation | `beatGridRoleService` + `ROLE_INSTRUMENT_GROUPS` | bass / pad / harmony / lead instruments and durations |
| Arpeggiation | `getArpeggiatedMidiForLayer` | Root–3rd–5th–octave with per-layer phase offset |
| Integration | `beatGridAudioService` | `shouldTriggerLayer` + role durations in `triggerActiveLayers` |

## Section modes

| Mode | Beats | Trigger layers |
|------|-------|----------------|
| intro | 0–15 | L64 |
| groove | 16–23 | L64, L32 |
| build | 24–27 | L64, L32, L16 |
| peak | 28–39 | all |
| cooldown | 40–63 | L64; L32 when layer window active |

`isLayerActive` remains the hard ceiling; arrangement only thins triggers.

## Tests

```bash
pnpm test:run -- src/features/rhythm
```

## User acceptance

Run a dev-simulator session (~120 BPM) and confirm: thinner intro, audible rests at section ends, staggered pitches, longer bass/pad vs short lead.

## Out of scope (follow-ups)

- 8th-note subdivision scheduler
- Velocity maps, reverb, BPM-density arrangement
- UI section mode label
