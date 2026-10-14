# ACTIVE_WORK — M2.1: precision is lost between operations

**Defect found after M2 acceptance. Fixed inside the same milestone. Boundary written
before implementation; evidence declared up front. Do not expand scope.**

## The defect

The engine applies the display rounding to its own state, so every intermediate result
loses precision before the next operation sees it.

Reproduced on the deployed page:

| Keys | M2 shows | Correct |
| --- | --- | --- |
| `9 √x √x x²` | `3.0000000001` | `3` |
| `2 √x x²` | `2.0000000001` | `2` |
| `9 √x √x` | `1.7320508076` | `1.7320508076` *(display is right — the stored value is not)* |

Root cause: `format()` is called when a value is **stored**, not only when it is
**rendered**. `√3` is held as the ten-decimal string `1.7320508076`; squaring that string
gives 3.0000000001.

## Required behaviour

- **The state carries the full-precision value. Rounding is presentation-only.** A value
  that has been computed, or inserted as a constant, must keep its exact floating-point
  value across any number of subsequent operations; only the text drawn on screen is
  rounded to 10 decimal places.
- **Every M2 behaviour is unchanged** — the function set, the semantics, the keyboard
  shortcuts, the thousands grouping, the `Error` cases, left-to-right evaluation, and the
  display for any single operation. `π` still *displays* `3.1415926536`, but the value
  carried forward is `Math.PI`.
- Typed input keeps its 12-significant-digit cap. That is a limit on what the user can
  type, not on what the engine computes.
- A result produced by `=` is the exact value and can be operated on further without loss.

## Acceptance cases — verify each of these explicitly

Chained irrationals, all of which must come out exact:

| Keys | Must show |
| --- | --- |
| `9 √x √x x²` | `3` |
| `2 √x x²` | `2` |
| `2 √x √x √x √x x² x² x² x²` | `2` |
| `9 √x x² x² x²` | `9` |
| `π` then `sin`, in RAD | `0` |
| `1 ÷ 3 = × 3 =` | `1` |
| `2 xʸ 0.5 = x²` | `2` |
| `9 √x √x` *(display only)* | `1.7320508076` |

And these must be unchanged from M2: `12 + 3 =` → `15` · `2 + 3 × 4 =` → `20` ·
`9 / 0 =` → `Error` · `0.1 + 0.2 =` → `0.3` · `2 xʸ 10 =` → `1,024` ·
`9 √x` → `3` · `170 n!` → the same value as M2 · `tan 90°` in DEG → `Error`.

## Must not change

- No build step, no bundler, no framework, no runtime dependency. Static site, repo root, `main`.
- `calc.js` stays DOM-free and still loads as a plain `<script>` (no ES modules) as well
  as via `require()` in Node.
- The test command stays `node --test` (bare — the directory form is unsupported on Node 24).

## Evidence required — this is what acceptance is judged on

1. **The command you ran, with its full output pasted verbatim.** `npm test` passing is the gate.
2. **Each acceptance case above, with the value you actually got.** If a case fails, say so
   by name instead of omitting it.
3. **Any pre-existing test that had to change, named individually, with the reason.** Some
   existing tests may assert the old, buggy behaviour — that is expected. Silently editing a
   test to make it pass is a defect; naming it is a finding.
4. The list of files changed, and `git diff --stat`.
5. `node --test` run against Node 24.21.0.

## Stop conditions

- Any change that alters what the user **sees** for a single operation — stop and report,
  that is out of scope.
- Any need for a dependency or a build step — stop and report.
- Do not touch any file outside this repository.
