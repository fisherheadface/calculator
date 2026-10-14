// Calculator engine: pure functions, no DOM. Loads as a plain <script> in the
// browser (globalThis.Calc) and via require() in Node (module.exports).
(function () {
  "use strict";

  var MAX_DIGITS = 12;

  var SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^", "root": "ʸ√" };

  // Round to at most 10 decimal places to hide floating-point noise. Integers
  // are left alone: they have no decimals, and scaling large ones by 1e10
  // perturbs their last digits or overflows to Infinity.
  function format(n) {
    if (!isFinite(n)) return "Error";
    if (Number.isInteger(n)) return String(n);
    var r = Math.round(n * 1e10) / 1e10;
    return String(r);
  }

  function root(x, degree) {
    if (degree === 0) return NaN;
    if (x < 0) {
      if (Number.isInteger(degree) && degree % 2 !== 0) return -Math.pow(-x, 1 / degree);
      return NaN;
    }
    return Math.pow(x, 1 / degree);
  }

  // Left-to-right binary evaluation; a and b are numbers or numeric strings.
  function compute(a, op, b) {
    var x = parseFloat(a), y = parseFloat(b);
    switch (op) {
      case "+": return x + y;
      case "-": return x - y;
      case "*": return x * y;
      case "/": return y === 0 ? NaN : x / y;
      case "^": return Math.pow(x, y);
      case "root": return root(x, y);
    }
    return y;
  }

  // Exact product in BigInt, then a single correctly rounded conversion.
  function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
    var r = BigInt(1);
    for (var i = 2; i <= n; i++) r *= BigInt(i);
    return Number(r);
  }

  var TRIG_EXACT = {
    sin: [0, 1, 0, -1],
    cos: [1, 0, -1, 0],
    tan: [0, NaN, 0, NaN]
  };

  function trig(fn, x, angle) {
    if (angle === "deg") {
      var d = x % 360;
      if (d < 0) d += 360;
      if (d % 90 === 0) return TRIG_EXACT[fn][d / 90];
      x = d * Math.PI / 180;
    }
    return Math[fn](x);
  }

  var UNARY = {
    sq: function (x) { return x * x; },
    sqrt: function (x) { return x < 0 ? NaN : Math.sqrt(x); },
    inv: function (x) { return x === 0 ? NaN : 1 / x; },
    fact: factorial,
    ln: function (x) { return x <= 0 ? NaN : Math.log(x); },
    log: function (x) { return x <= 0 ? NaN : Math.log10(x); },
    sin: function (x, angle) { return trig("sin", x, angle); },
    cos: function (x, angle) { return trig("cos", x, angle); },
    tan: function (x, angle) { return trig("tan", x, angle); }
  };

  var CONSTANT = { pi: Math.PI, e: Math.E };

  // current and stored are display text (rounded); value and storedValue carry
  // the full-precision number behind them. value is null while the user is
  // typing, in which case the typed text is the exact value.
  function initial() {
    return {
      current: "0",
      value: null,
      stored: null,
      storedValue: null,
      pendingOp: null,
      justEvaluated: false,
      freshNumber: false, // true when the next digit must start a new number
      history: "",
      angle: "deg"
    };
  }

  // The full-precision value of the number on screen.
  function currentValue(s) {
    return s.value !== null ? s.value : parseFloat(s.current);
  }

  // Put a computed number on screen: rounded for display, exact in state.
  function setResult(s, n) {
    s.value = n;
    s.current = format(n);
  }

  function inputDigit(s, d) {
    s.value = null;
    if (s.justEvaluated) { s.current = "0"; s.justEvaluated = false; s.freshNumber = false; }
    if (s.freshNumber) { s.current = d; s.freshNumber = false; }
    else if (s.current === "0") s.current = d;
    else s.current += d;
    if (s.current.replace(/[-.]/g, "").length > MAX_DIGITS) {
      s.current = s.current.slice(0, s.current.length - 1);
    }
  }

  function inputDecimal(s) {
    s.value = null;
    if (s.justEvaluated) { s.current = "0"; s.justEvaluated = false; s.freshNumber = false; }
    if (s.freshNumber) { s.current = "0."; s.freshNumber = false; }
    else if (!s.current.includes(".")) s.current += ".";
  }

  function chooseOp(s, op) {
    if (s.pendingOp && !s.justEvaluated && s.stored !== null) {
      setResult(s, compute(s.storedValue, s.pendingOp, currentValue(s)));
    }
    s.stored = s.current;
    s.storedValue = currentValue(s);
    s.pendingOp = op;
    s.justEvaluated = false;
    s.freshNumber = true;
    s.history = s.stored + " " + SYMBOL[op];
  }

  function equals(s) {
    if (s.pendingOp === null || s.stored === null) return;
    var expr = s.stored + " " + SYMBOL[s.pendingOp] + " " + s.current + " =";
    setResult(s, compute(s.storedValue, s.pendingOp, currentValue(s)));
    s.history = expr;
    s.stored = null;
    s.storedValue = null;
    s.pendingOp = null;
    s.justEvaluated = true;
    s.freshNumber = true;
  }

  function clearAll(s) {
    s.current = "0"; s.value = null; s.stored = null; s.storedValue = null; s.pendingOp = null;
    s.justEvaluated = false; s.freshNumber = false;
    s.history = "";
  }

  function backspace(s) {
    // Only a number being typed can be edited; results are left alone.
    if (s.justEvaluated || s.freshNumber || !/^-?[\d.]+$/.test(s.current)) return;
    s.value = null;
    s.current = s.current.slice(0, -1);
    if (s.current === "" || s.current === "-") s.current = "0";
  }

  // Apply one key to a state and return the new state; the input is not mutated.
  function press(state, key) {
    var s = Object.assign({}, state);
    if (key.length === 1 && key >= "0" && key <= "9") inputDigit(s, key);
    else if (SYMBOL[key]) chooseOp(s, key);
    else if (UNARY[key]) {
      setResult(s, UNARY[key](currentValue(s), s.angle));
      s.freshNumber = true;
    } else if (CONSTANT[key] !== undefined) {
      setResult(s, CONSTANT[key]);
      s.freshNumber = true;
    } else {
      switch (key) {
        case ".": inputDecimal(s); break;
        case "=": equals(s); break;
        case "clear": clearAll(s); break;
        case "negate":
          if (s.value !== null) s.value = -s.value;
          s.current = s.current.startsWith("-") ? s.current.slice(1) : "-" + s.current;
          break;
        case "percent": setResult(s, currentValue(s) / 100); break;
        case "back": backspace(s); break;
        case "angle": s.angle = s.angle === "deg" ? "rad" : "deg"; break;
      }
    }
    return s;
  }

  var Calc = {
    MAX_DIGITS: MAX_DIGITS,
    SYMBOL: SYMBOL,
    format: format,
    compute: compute,
    factorial: factorial,
    root: root,
    trig: trig,
    initial: initial,
    press: press
  };

  globalThis.Calc = Calc;
  if (typeof module !== "undefined" && module.exports) module.exports = Calc;
})();
