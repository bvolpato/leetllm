import { place } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { incidentModel, title } from "../parts.mjs";

export default function learnedLstm(s, c) {
  const m = incidentModel().lstm;
  const [input, work, register, result] = area.rows([1, 2.3, 2, 2.2], "normal");
  const names = ["old h₁", "old h₂", "error", "reproduction", "rollback"];
  const features = input.columns(5, "tight").map((slot, j) =>
    place(chip(names[j] + "   " + m.joined[j], { size: 36, color: j < 2 ? "cyan" : "blue" }), slot));
  const [first, second] = work.rows(2, "tight");
  const fullRows = m.forgetMatrix.map((row, i) =>
    place(mono("f" + (i + 1) + " weights     [ " + row.join("     ") + " ]", { size: 41 }), [first, second][i]));
  const products = [
    place(mono("f₁     1 × 0.4  +  0.6 × 1  =  1.0", { color: "green" }), first),
    place(mono("f₂                  −0.5 × 1  = −0.5", { color: "green" }), second),
  ];
  const controls = [
    ["forget", m.f, "green"], ["write", m.i, "pink"],
    ["candidate", m.candidate, "pink"], ["expose", m.o, "cyan"],
  ];
  const columns = register.columns([0.9, 1, 1, 1, 1], "normal");
  const cells = columns.map(col => col.rows(3, "tight"));
  const headers = controls.map(([name, , color], j) => place(label(name, { color }), cells[j + 1][0]));
  const coords = [0, 1].map((j) => place(note("coord " + (j + 1)), cells[0][j + 1]));
  const numbers = controls.map(([, pair, color], col) => pair.map((v, i) => place(mono(v.toFixed(3), { color, size: 44 }), cells[col + 1][i + 1])));
  const derivations = [
    ["write     σ(−1 × reproduction)", "σ(0)"],
    ["candidate     tanh(0.5 × reproduction)", "tanh(0)"],
    ["expose     σ(ln 4)", "σ(0)"],
  ].map(([a, b]) => [place(mono("1     " + a), first), place(mono("2     " + b), second)]);
  const [resultOne, resultTwo] = result.rows(2, "tight");
  const oldCell = [resultOne, resultTwo].map((slot, i) => place(mono("old cell " + (i + 1) + "     " + m.cOld[i].toFixed(3)), slot));
  const productsByCell = [resultOne, resultTwo].map((slot, i) => place(mono(
    "c" + (i + 1) + " ≈ " + m.f[i].toFixed(3) + " × " + m.cOld[i].toFixed(3) + " + " +
    m.i[i].toFixed(3) + " × " + m.candidate[i].toFixed(3), { size: 46 }), slot));
  const terms = [resultOne, resultTwo].map((slot, i) => place(mono(
    "c" + (i + 1) + "     " + m.retained[i].toFixed(6) + " kept  +  " + m.written[i].toFixed(6) + " written", { size: 43 }), slot));
  const sums = [first, second].map((slot, i) => place(mono(
    "c" + (i + 1) + " = " + m.nextCell[i].toFixed(6), { color: "green", size: 50 }), slot));
  const output = [resultOne, resultTwo].map((slot, i) => place(mono(
    "h" + (i + 1) + " = " + m.o[i].toFixed(1) + " × tanh(" + m.nextCell[i].toFixed(6) + ") = " +
    m.nextHidden[i].toFixed(6), { size: 42, color: "cyan" }), slot));
  title(s, c);
  s.add(features.slice(0, 2), oldCell, headers, coords);
  c.show("learned-lstm-0", features.slice(2));
  c.show("lstm-concat", fullRows);
  c.swap("learned-lstm-1", fullRows, products);
  c.show("lstm-forget-result", numbers[0]);
  c.swap("lstm-input-gate", products, derivations[0]);
  c.show("lstm-input-result", numbers[1]);
  c.swap("lstm-candidate-gate", derivations[0], derivations[1]);
  c.show("lstm-candidate-result", numbers[2]);
  c.swap("lstm-output-gate", derivations[1], derivations[2]);
  c.show("lstm-output-result", numbers[3]);
  c.swap("lstm-products", oldCell, productsByCell);
  c.swap("lstm-cell-join", productsByCell, terms);
  c.swap("lstm-cell-result", derivations[2], sums);
  c.swap("lstm-hidden-result", terms, output);
}
