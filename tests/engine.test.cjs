"use strict";
const test = require("node:test");
const assert = require("node:assert");
const Calc = require("../calc.js");

// Press a space-separated sequence of keys from a fresh state.
function run(keys, state) {
  let s = state || Calc.initial();
  for (const k of keys.split(" ").filter(Boolean)) s = Calc.press(s, k);
  return s;
}
const show = (keys) => run(keys).current;

test("loads as a global as well as a module", () => {
  assert.strictEqual(globalThis.Calc, Calc);
});

test("press does not mutate its input", () => {
  const s = Calc.initial();
  const before = JSON.stringify(s);
  Calc.press(s, "7");
  assert.strictEqual(JSON.stringify(s), before);
});

test("evaluation stays left-to-right, no precedence", () => {
  assert.strictEqual(show("2 + 3 * 4 ="), "20");
  assert.strictEqual(show("1 0 - 2 / 4 ="), "2");
  assert.strictEqual(show("2 ^ 3 + 1 ="), "9");
  assert.strictEqual(show("1 + 2 ^ 3 ="), "27");
});

test("a digit after an operator starts a new number (M1)", () => {
  assert.strictEqual(show("1 2 + 3"), "3");
  assert.strictEqual(show("1 2 + 3 ="), "15");
  assert.strictEqual(show("2 ^ 5"), "5");
  assert.strictEqual(show("8 root 3"), "3");
  assert.strictEqual(show("1 2 + ."), "0.");
});

test("a digit after = starts a new number", () => {
  assert.strictEqual(show("2 + 3 = 7"), "7");
  assert.strictEqual(show("2 + 3 = ."), "0.");
});

test("display rounds to at most 10 decimal places", () => {
  assert.strictEqual(show(". 1 + . 2 ="), "0.3");
  assert.strictEqual(show("1 / 3 ="), "0.3333333333");
  assert.strictEqual(Calc.format(1.23456789012345), "1.2345678901");
});

test("the 12-significant-digit input cap stays", () => {
  assert.strictEqual(show("1 2 3 4 5 6 7 8 9 0 1 2 3 4"), "123456789012");
  assert.strictEqual(show("1 . 2 3 4 5 6 7 8 9 0 1 2 3"), "1.23456789012");
  assert.strictEqual(show("1 2 3 4 5 6 7 8 9 0 1 2 negate 3"), "-123456789012");
});

test("division by zero is Error", () => {
  assert.strictEqual(show("5 / 0 ="), "Error");
});

test("unary functions apply immediately", () => {
  assert.strictEqual(show("9 sq"), "81");
  assert.strictEqual(show("9 sqrt"), "3");
  assert.strictEqual(show("4 inv"), "0.25");
  assert.strictEqual(show("5 fact"), "120");
  assert.strictEqual(show("1 ln"), "0");
  assert.strictEqual(show("e ln"), "1");
  assert.strictEqual(show("1 0 0 0 log"), "3");
  assert.strictEqual(show("2 + 9 sqrt ="), "5");
  assert.strictEqual(show("3 sq sq"), "81");
});

test("a digit after a unary function starts a new number", () => {
  assert.strictEqual(show("9 sqrt 4"), "4");
});

test("unary domain errors", () => {
  assert.strictEqual(show("4 negate sqrt"), "Error");
  assert.strictEqual(show("0 ln"), "Error");
  assert.strictEqual(show("2 negate ln"), "Error");
  assert.strictEqual(show("0 log"), "Error");
  assert.strictEqual(show("2 negate log"), "Error");
  assert.strictEqual(show("0 inv"), "Error");
  assert.strictEqual(show("3 negate fact"), "Error");
  assert.strictEqual(show("2 . 5 fact"), "Error");
});

test("factorial: exact for n <= 170, Error above", () => {
  assert.strictEqual(show("0 fact"), "1");
  assert.strictEqual(show("1 fact"), "1");
  assert.strictEqual(show("2 0 fact"), "2432902008176640000");
  // Correctly rounded; a naive double loop gives 7.257415615307994e+306.
  assert.strictEqual(show("1 7 0 fact"), "7.257415615307999e+306");
  assert.strictEqual(show("1 7 1 fact"), "Error");

  // Every n! must be the double nearest the exact integer, and survive display.
  const f64 = new Float64Array(1), u64 = new BigUint64Array(f64.buffer);
  const neighbour = (x, d) => { f64[0] = x; u64[0] += BigInt(d); return f64[0]; };
  const abs = (b) => (b < 0n ? -b : b);
  let exact = 1n;
  for (let n = 0; n <= 170; n++) {
    if (n > 0) exact *= BigInt(n);
    const got = Calc.factorial(n);
    assert.strictEqual(show(n.toString().split("").join(" ") + " fact"), String(got), `${n}! display`);
    if (got <= Number.MAX_SAFE_INTEGER) { assert.strictEqual(BigInt(got), exact, `${n}!`); continue; }
    const err = abs(BigInt(got) - exact);
    assert.ok(err <= abs(BigInt(neighbour(got, 1)) - exact), `${n}! not nearest (above)`);
    assert.ok(err <= abs(BigInt(neighbour(got, -1)) - exact), `${n}! not nearest (below)`);
  }
});

test("x^y", () => {
  assert.strictEqual(show("2 ^ 1 0 ="), "1024");
  assert.strictEqual(show("2 ^ 2 negate ="), "0.25");
  assert.strictEqual(show("0 ^ 0 ="), "1");
  assert.strictEqual(Calc.compute("0", "^", "0"), 1);
  assert.strictEqual(show("9 ^ . 5 ="), "3");
});

test("x^y non-finite is Error", () => {
  assert.strictEqual(show("1 0 ^ 4 0 0 ="), "Error");
  assert.strictEqual(show("0 ^ 1 negate ="), "Error");
  assert.strictEqual(show("8 negate ^ . 5 ="), "Error");
});

test("y-th root: first operand is radicand, second is degree", () => {
  assert.strictEqual(show("8 root 3 ="), "2");
  assert.strictEqual(show("2 7 root 3 ="), "3");
  assert.strictEqual(show("1 0 0 0 root 3 ="), "10");
  assert.strictEqual(show("1 6 root 4 ="), "2");
  assert.strictEqual(show("8 negate root 3 ="), "-2");
  assert.strictEqual(show("8 root 3 negate ="), "0.5");
  assert.strictEqual(show("2 root 2 ="), "1.4142135624");
});

test("y-th root errors", () => {
  assert.strictEqual(show("1 6 negate root 4 ="), "Error");
  assert.strictEqual(show("4 negate root 2 ="), "Error");
  assert.strictEqual(show("8 root 0 ="), "Error");
});

test("trig defaults to DEG", () => {
  assert.strictEqual(Calc.initial().angle, "deg");
  assert.strictEqual(show("3 0 sin"), "0.5");
  assert.strictEqual(show("6 0 cos"), "0.5");
  assert.strictEqual(show("4 5 tan"), "1");
  assert.strictEqual(show("9 0 sin"), "1");
  assert.strictEqual(show("9 0 cos"), "0");
  assert.strictEqual(show("1 8 0 sin"), "0");
  assert.strictEqual(show("3 6 0 cos"), "1");
  assert.strictEqual(show("3 0 negate sin"), "-0.5");
  assert.strictEqual(show("4 5 0 sin"), "1");
});

test("tan 90° and its odd multiples are Error", () => {
  assert.strictEqual(show("9 0 tan"), "Error");
  assert.strictEqual(show("2 7 0 tan"), "Error");
  assert.strictEqual(show("9 0 negate tan"), "Error");
  assert.strictEqual(show("4 5 0 tan"), "Error");
  assert.strictEqual(show("1 8 0 tan"), "0");
});

test("the toggle switches subsequent trig calls to RAD and back", () => {
  let s = run("angle");
  assert.strictEqual(s.angle, "rad");
  assert.strictEqual(run("pi sin", s).current, "0");
  assert.strictEqual(run("pi cos", s).current, "-1");
  assert.strictEqual(run("1 sin", s).current, "0.8414709848");
  assert.strictEqual(run("9 0 sin", s).current, "0.8939966636");
  s = run("angle", s);
  assert.strictEqual(s.angle, "deg");
  assert.strictEqual(run("9 0 sin", s).current, "1");
});

test("constants insert as the current number", () => {
  assert.strictEqual(show("pi"), "3.1415926536");
  assert.strictEqual(show("e"), "2.7182818285");
  assert.strictEqual(show("2 * pi ="), "6.2831853072");
  assert.strictEqual(show("1 2 3 pi"), "3.1415926536");
  assert.strictEqual(show("pi 2"), "2");
});

test("backspace removes one digit of the number being typed", () => {
  assert.strictEqual(show("1 2 3 back"), "12");
  assert.strictEqual(show("1 2 3 back back back"), "0");
  assert.strictEqual(show("1 . 5 back"), "1.");
  assert.strictEqual(show("1 . 5 back back 7"), "17");
  assert.strictEqual(show("5 negate back"), "0");
  assert.strictEqual(show("0 back"), "0");
  assert.strictEqual(show("1 + 2 3 back ="), "3");
});

test("backspace leaves results alone", () => {
  assert.strictEqual(show("1 2 + 3 4 = back"), "46");
  assert.strictEqual(show("5 / 0 = back"), "Error");
  assert.strictEqual(show("9 sqrt back"), "3");
  assert.strictEqual(show("1 2 + back"), "12");
});

test("AC, negate, percent, decimal keep their behaviour", () => {
  const s = run("1 + 2 clear");
  assert.strictEqual(s.current, "0");
  assert.strictEqual(s.pendingOp, null);
  assert.strictEqual(s.history, "");
  assert.strictEqual(show("5 negate"), "-5");
  assert.strictEqual(show("5 negate negate"), "5");
  assert.strictEqual(show("5 0 percent"), "0.5");
  assert.strictEqual(show("1 . . 5"), "1.5");
});

test("history shows the pending and evaluated expression", () => {
  assert.strictEqual(run("8 root").history, "8 ʸ√");
  assert.strictEqual(run("8 root 3 =").history, "8 ʸ√ 3 =");
  assert.strictEqual(run("2 ^ 3 =").history, "2 ^ 3 =");
  assert.strictEqual(run("1 2 * 3 =").history, "12 × 3 =");
});

// ---------------------------------------------------------------------------
// The four original operators must keep producing today's results. This is the
// pre-M2 logic from index.html (commit 0ea2472) with the DOM removed, used as
// an oracle against the new engine on random key sequences.
function legacy() {
  var current = "0", stored = null, pendingOp = null, justEvaluated = false, freshNumber = false;
  var historyText = "";
  var SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };
  function setHistory() {
    historyText = stored !== null && pendingOp ? stored + " " + SYMBOL[pendingOp] : "";
  }
  function inputDigit(d) {
    if (justEvaluated) { current = "0"; justEvaluated = false; freshNumber = false; }
    if (freshNumber) { current = d; freshNumber = false; }
    else if (current === "0") current = d;
    else current += d;
    if (current.replace(/[-.]/g, "").length > 12) current = current.slice(0, current.length - 1);
  }
  function inputDecimal() {
    if (justEvaluated) { current = "0"; justEvaluated = false; freshNumber = false; }
    if (freshNumber) { current = "0."; freshNumber = false; }
    else if (!current.includes(".")) current += ".";
  }
  function compute(a, op, b) {
    var x = parseFloat(a), y = parseFloat(b);
    switch (op) {
      case "+": return x + y;
      case "-": return x - y;
      case "*": return x * y;
      case "/": return y === 0 ? NaN : x / y;
    }
    return y;
  }
  function format(n) {
    if (!isFinite(n)) return "Error";
    var r = Math.round(n * 1e10) / 1e10;
    return String(r);
  }
  function chooseOp(op) {
    if (pendingOp && !justEvaluated && stored !== null) current = format(compute(stored, pendingOp, current));
    stored = current; pendingOp = op; justEvaluated = false; freshNumber = true;
    setHistory();
  }
  function equals() {
    if (pendingOp === null || stored === null) return;
    var expr = stored + " " + SYMBOL[pendingOp] + " " + current + " =";
    current = format(compute(stored, pendingOp, current));
    historyText = expr; stored = null; pendingOp = null; justEvaluated = true; freshNumber = true;
  }
  function clearAll() {
    current = "0"; stored = null; pendingOp = null; justEvaluated = false; freshNumber = false;
    historyText = "";
  }
  return {
    press(k) {
      if (k >= "0" && k <= "9" && k.length === 1) inputDigit(k);
      else if (SYMBOL[k]) chooseOp(k);
      else if (k === ".") inputDecimal();
      else if (k === "=") equals();
      else if (k === "clear") clearAll();
      else if (k === "negate") current = current.startsWith("-") ? current.slice(1) : "-" + current;
      else if (k === "percent") current = format(parseFloat(current) / 100);
    },
    get current() { return current; },
    get history() { return historyText; },
    format
  };
}

test("original operators match the pre-M2 calculator (randomised)", (t) => {
  // Deterministic PRNG so failures reproduce.
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "1", "2", "5", "7", "9",
    ".", "+", "-", "*", "/", "=", "negate", "percent", "clear"];
  const SEQUENCES = 20000, LENGTH = 40;
  let presses = 0, integerFixes = 0;
  for (let i = 0; i < SEQUENCES; i++) {
    const old = legacy();
    let s = Calc.initial();
    const seq = [];
    for (let j = 0; j < LENGTH; j++) {
      const k = KEYS[Math.floor(rand() * KEYS.length)];
      seq.push(k);
      old.press(k);
      s = Calc.press(s, k);
      presses++;
      const where = "after: " + seq.join(" ");
      if (s.current !== old.current) {
        // The one permitted difference: pre-M2 added decimal noise to an
        // integer result (e.g. 518222895129 shown as 518222895129.00006).
        // Same raw integer value, only the old formatter's rendering of it differs.
        const raw = Number(s.current);
        assert.ok(Number.isInteger(raw) && s.current === String(raw), "current " + where);
        assert.strictEqual(old.current, old.format(raw), "current " + where);
        integerFixes++;
        break; // the two calculators now hold different values
      }
      assert.strictEqual(s.history, old.history, "history " + where);
    }
  }
  t.diagnostic(`${presses} key presses compared; ${integerFixes} differed, all integer-noise fixes`);
});

test("format differs from pre-M2 only where pre-M2 corrupted an integer", () => {
  const old = legacy().format;
  // Pre-M2 scaled every value by 1e10, adding noise to large integers.
  const cases = [518222895129, 1e15, 999999999999 * 999999999999, 2 ** 60 + 2 ** 10, 1e300];
  for (const n of cases) {
    assert.strictEqual(Number(Calc.format(n)), n);
    assert.strictEqual(Calc.format(n), String(n));
  }
  assert.strictEqual(old(518222895129), "518222895129.00006");
  assert.strictEqual(old(1e300), "Infinity");
  // Non-integers and ordinary integers format identically.
  for (const n of [0.1 + 0.2, 1 / 3, -2.5, 42, -7, 999999, 0.000000000049, 123456.789, 1e-11]) {
    assert.strictEqual(Calc.format(n), old(n));
  }
});
