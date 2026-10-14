# ACTIVE_WORK — Milestone M2: the calculator becomes scientific

**Boundary written before implementation. Evidence declared up front. Do not expand scope.**

## Outcome

The single-page calculator at `index.html` gains a scientific function set, and its
arithmetic engine becomes independently testable. The page keeps working at
`https://fisherheadface.github.io/calculator/` with no build step and no dependencies.

## Required behaviour

**Unary functions — apply immediately to the value on screen:**

- `x²` — square
- `√x` — square root
- `1/x` — reciprocal
- `n!` — factorial
- `ln` — natural log
- `log` — log base 10

**Binary operators — take a second operand, using the same interaction as `+ − × ÷`
(operator, then a fresh number, then `=`):**

- `xʸ` — arbitrary exponent
- `ʸ√x` — arbitrary root: the first operand is the radicand, the second is the
  root degree. `8 ʸ√ 3 =` is 2.

**Trigonometry — unary, with a DEG/RAD toggle:**

- `sin`, `cos`, `tan`. **Default DEG.** The toggle changes the mode for subsequent
  trig calls and is visible in the UI.

**Constants — insert as the current number:**

- `π` and `e`

**Navigation:**

- `⌫` — backspace one digit. (Everything else in this milestone keeps its current
  behaviour: `AC`, `±`, `%`, `.`, `=`, and full keyboard input.)

## Semantics that must be exact

These are the cases that produce silent wrong answers, so they are pinned:

- **Evaluation stays left-to-right. No operator precedence is introduced.** `2 + 3 × 4`
  is 20, as it is today. Changing this is out of scope.
- A digit typed **after an operator or after `=` starts a new number.** This is the
  behaviour M1 fixed; it must not regress.
- **Error, not a number, for:** division by zero · `√` of a negative · `ln`/`log` of a
  value ≤ 0 · `n!` of a negative or non-integer · `ʸ√x` where the degree is even and the
  radicand is negative · `xʸ` producing a non-finite result.
- `0^0` is `1`.
- `n!` for n ≤ 170 must be exact; above that it is `Error` (overflow to Infinity).
- Trig uses the toggle's mode. `tan 90°` is `Error` (non-finite).
- Display rounds to at most 10 decimal places to hide floating-point noise
  (`0.1 + 0.2` shows `0.3`).
- The existing 12-significant-digit input cap stays.

## Architecture — decided, implement as stated

- **`calc.js`** — the engine, pure functions only, no DOM access. It attaches itself to
  `globalThis.Calc` and also sets `module.exports = Calc` when `module` exists, so the
  same file loads in the browser and in Node with no build step.
- **`index.html`** — presentation and input only; loads `calc.js` with a plain
  `<script src="calc.js">` tag. It must keep working when opened directly from disk
  (`file://`), so do not use ES module `import`/`export`.
- **`tests/engine.test.cjs`** — Node's built-in test runner (`node:test` +
  `node:assert`). No test framework dependency.
- **`package.json`** — `"test": "node --test tests/"`, nothing else. No dependencies.
- Update `README.md` to describe the new function set.

## Must not change

- No build step, no bundler, no framework, no runtime dependency. The repo stays a
  static site served from the repository root on `main`.
- The four existing operators must keep producing exactly the results they do today.
- Keyboard input must keep working, and the new functions need keyboard shortcuts.
- `README.md`'s claim that it is deliberately domain-free is still true — do not add
  anything project-specific.

## Evidence required — this is what acceptance is judged on

Declare these in your final report, and nothing else counts:

1. The command you ran to test, and **its full output pasted verbatim** — not a summary
   of it. `node --test tests/` passing is the gate.
2. The list of files you created or changed.
3. Any case in the "Semantics" section above that you could **not** satisfy, named
   explicitly — or the statement that all of them hold.
4. `git diff --stat` for the change.

A passing test run is evidence, not the outcome. Report honestly; a named failure is
worth more than a silent gap.

## Stop conditions

- Anything that requires a **product decision** (what a button does, what the user sees,
  what is in or out of scope) — **stop and report it. Do not choose for the Product
  Owner.**
- Anything that requires a **dependency or a build step** — stop and report.
- Do not touch any file outside this repository.
