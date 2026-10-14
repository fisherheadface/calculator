# Review — M1 → M2.1

**Status: accepted.** The product-visible result was verified on the deployed page by the
Engineering Assistant, after being reported defective by the Product Owner.

## What ran

| Milestone | Scope | Implementer | Turns | Cost |
| --- | --- | --- | --- | --- |
| M1 | calculator, single file | Hermes (by hand) | — | — |
| M2 | scientific: engine out of the HTML, tests, sqrt / root / square / exponent / trig / constants | Claude Code | 30 | $1.51 |
| M2.1 | precision defect found after M2 acceptance | Claude Code | 16 | $0.60 |

Total implementer spend for the milestone pair: **$2.11**.

## Evidence, and who produced it

The gate was declared before implementation in both milestones, and run by the lead — the
implementer's report was not accepted as evidence.

- `npm test` → **29/29** (Node 24.21.0)
- **20/21** independent engine checks written by the lead, not the implementer
- **15/15** checks driving the **deployed** page with real clicks and key presses, no page errors
- **The new tests were run against the previous engine**: 3 fail there, all pass against the fixed one — the tests demonstrably catch the defect rather than merely passing
- Live: https://fisherheadface.github.io/calculator/

The single failed lead check was the lead's own arithmetic error, not the code's
(`9 √x x² x²` is 81, not 9). See deficiencies.

## Defects

**D1 — precision lost between operations. Found by the Product Owner after M2 acceptance, fixed as M2.1.**
The engine applied the display rounding to its own state, so `9 √x √x x²` returned
`3.0000000001`. Cause: `format()` was called on store, not only on render. Fixed by
carrying the exact value in the state (`value` / `storedValue`) and rounding only at render
time. **Status: fixed and verified live.**

**D2 — the declared gate command did not run. Found by the implementer, fixed by the lead.**
`node --test tests/` is rejected on Node 24; bare `node --test` discovers the directory.
The implementer correctly refused to change a frozen gate and proved the failure was the
command, not the code. Fix (`package.json`, `README.md`) applied by the lead.

**D3 — the deploy step had no gate.** Pages was left at "building" while the live content
was still the previous build; the first check asserted against stale content and passed
against the wrong thing. Working rule: poll the *content*, not the build status.

## Decisions taken (LOG & PROCEED — not escalated)

- Display rounding applies only at render; the state is exact. Accepted because the old
  behaviour corrupted large whole results (`518222895129.00006`), and the implementer
  bounded the blast radius: 792,974 random key presses replayed, 300 differed, every one a
  case where the old output was noise. **This is the only place today's arithmetic differs
  from before M2.**
- Engine split out of `index.html` into `calc.js` (pure, DOM-free) with Node's built-in test
  runner. No dependency, no build step.
- Eight UI choices the M2 specification failed to pin — keyboard map, `⌫` on a result, `AC`
  and the angle mode, root degree 0, constant rounding — were accepted as implemented
  (conventional behaviour) rather than returned to the Product Owner.

## Deficiencies — the metric

**10**, and every one is the Engineering Assistant's.

| # | Milestone | Deficiency |
| --- | --- | --- |
| 1 | M2 | The declared gate command (`node --test tests/`) was never executed before being written into the specification |
| 2–9 | M2 | Eight UI behaviours left unspecified, producing a "for your sign-off" list that should have been decided |
| 10 | M2.1 | An acceptance case with wrong arithmetic (`9 √x x² x² x²` is 6561, not 9) |

Separately, the lead repeated the same class of arithmetic error in its own verification
pass — the code was right. Not counted as a specification deficiency; recorded because the
pattern matters more than the count.

Reporting the number, not defending it: M2 was the first run of this arrangement and it
ran the specification thin. **Two of the ten cost real implementer budget** (the gate error
burned turns in both milestones).

## Follow-ups (not done)

- **The randomised oracle is no longer independent for precision.** The pre-M2 comparison
  copy now carries the same full-precision change as the engine, so it cannot catch a
  regression in exactly the thing M2.1 fixed. The three M2.1 tests cover it directly, but
  the random test's independence for that property is gone. Replacing the oracle with a
  frozen, pre-M2, behaviour-only reference would restore it.
- **No `MILESTONES.md` / `SPEC_DEFICIENCIES.md`** were kept during these runs; deficiencies
  were tracked in the conversation and recorded here at closeout. Fine for a smoke test;
  not fine for a real project.
- `2 xʸ 10 =` shows `1,024` — the grouping is applied by the page, not the engine, so the
  engine returns `1024`. Intentional, but the split is worth knowing before writing tests
  against either layer.
