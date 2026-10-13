# Calculator

A small static calculator — `index.html` plus the engine `calc.js`, no build
step, no dependencies.

This is a **smoke test**: it exists to prove the whole toolchain end to end —
repo created, code committed, a page built and served, and a URL that changes
when a new commit is pushed. It is deliberately domain-free so that any failure
is a failure of the plumbing and nothing else.

## What it does

Add, subtract, multiply, divide, percent, sign flip, clear, plus a scientific
set. Evaluation is strictly left to right (`2 + 3 × 4 = 20`). Results are shown
to at most 10 decimal places; invalid operations show `Error`.

| Key | Function | Keyboard |
| --- | --- | --- |
| `x²` `√x` `1/x` `n!` | square, square root, reciprocal, factorial (n ≤ 170) | `q` `@` `r` `!` |
| `ln` `log` | natural log, log base 10 | `n` `l` |
| `sin` `cos` `tan` | trigonometry in the current angle mode | `s` `o` `t` |
| `DEG`/`RAD` | toggle angle mode (starts in DEG) | `d` |
| `xʸ` | power: `2 xʸ 10 =` is 1024 | `^` or `y` |
| `ʸ√x` | root: `8 ʸ√x 3 =` is 2 (radicand, then degree) | `Shift+Y` |
| `π` `e` | constants | `p` `e` |
| `⌫` | delete the last digit typed | `Backspace` |

The other keys: digits, `.`, `+ - * /`, `Enter` or `=`, `Esc` to clear, `%`.
The unary functions, sin/cos/tan, and constants act on the number on screen
straight away. `xʸ` and `ʸ√x` work like `+`.

## Run it locally

Open `index.html` in a browser. That's the whole thing.

## Test

`calc.js` holds the arithmetic and has no DOM code, so it runs in Node as-is.
The tests use Node's built-in runner — run it with:

    npm test

(`node --test` discovers the files in `tests/` automatically. Passing the
directory explicitly, `node --test tests/`, is not supported on Node 24.)

## Deploy

GitHub Pages serves `index.html` from the repository root on `main`.
