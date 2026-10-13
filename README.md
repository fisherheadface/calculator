# Calculator

A single-file calculator — `index.html`, no build step, no dependencies.

This is a **smoke test**: it exists to prove the whole toolchain end to end —
repo created, code committed, a page built and served, and a URL that changes
when a new commit is pushed. It is deliberately domain-free so that any failure
is a failure of the plumbing and nothing else.

## What it does

Add, subtract, multiply, divide, percent, sign flip, clear. Mouse, touch, and
keyboard all work (digits, `.`, `+ - * /`, `Enter` or `=`, `Esc` to clear).

## Run it locally

Open `index.html` in a browser. That's the whole thing.

## Deploy

GitHub Pages serves `index.html` from the repository root on `main`.
