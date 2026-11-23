import { dot, draw, line, place } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { gruResetComparison } from "../../../films/rnn-memory/model.mjs";
import { sigmoid } from "../../../films/rnn-memory/arithmetic.mjs";
import { incidentModel, title } from "../parts.mjs";

const number = (value, digits) => value.toFixed(digits).replace("-", "−");
const pair = (v, digits) => "[" + v.map(x => number(x, digits)).join(", ") + "]";

export default function learnedGru(s, c) {
  const mixed = incidentModel().gru;
  const identity = gruResetComparison({ recurrent: [[1, 0], [0, 1]] });
  const [picture] = area.rows([5, 1], 0);
  const [source, gates, test, upper, lower, foot] = picture.rows([1, 1, 1.2, 1.8, 1.8, 0.9], "normal");
  const input = place(mono("reproduction  [0, 1, 0]      previous h  " + pair(mixed.hidden, 1)), source);
  const [keepBand, resetBand] = gates.columns(2, "normal");
  const keep = place(mono("keep   σ([ln 19, 0]) = " + pair(mixed.z, 2), { size: 37, color: "green" }), keepBand);
  const reset = place(mono("reset   σ([−ln 9, ln 9]) = " + pair(mixed.reset, 2), { size: 37, color: "pink" }), resetBand);
  const gateKey = place(note("Only the reproduction feature has nonzero gate weights. The gate biases are zero."), foot);
  const candidateTerms = place(note("Candidate input contribution = 0       Both candidate biases = 0"), foot);
  const idMatrix = place(mono("Identity matrix     W = [[1, 0], [0, 1]]"), test);
  const row = mixed.recurrent[1];
  const mixMatrix = place(mono("Mixing matrix     W = [" + mixed.recurrent.map(v => pair(v, 0)).join(", ") +
    "]      Follow row 2", { size: 40 }), test);

  const lanes = [upper, lower].map(r => r.columns([1.15, 2.35, 3.0], "normal"));
  const names = ["Reset first", "PyTorch"].map((name, i) => place(label(name), lanes[i][0], "left"));
  const value = (i, column, words) => place(mono(words, { size: 39, color: i ? "cyan" : "pink" }), lanes[i][column]);
  const idTop = [value(0, 1, "reset → " + pair(identity.resetHidden, 2)), value(0, 2, "copy → " + pair(identity.before, 2))];
  const idBottom = [value(1, 1, "copy → " + pair(identity.projected, 2)), value(1, 2, "reset → " + pair(identity.after, 2))];

  const scaled = value(0, 1, "reset → " + pair(mixed.resetHidden, 2));
  const mix = (values, result) => row[0] + "(" + number(values[0], 2) + ") + " + row[1] +
    "(" + number(values[1], 2) + ") = " + number(result, 2);
  const afterScale = value(0, 2, mix(mixed.resetHidden, mixed.before[1]));
  const beforeScale = value(1, 1, mix(mixed.hidden, mixed.projected[1]));
  const afterMix = value(1, 2, number(mixed.reset[1], 1) + " × " + number(mixed.projected[1], 2) +
    " = " + number(mixed.after[1], 2));
  const candidates = [mixed.beforeCandidate[1], mixed.afterCandidate[1]];
  const preactivations = [mixed.before[1], mixed.after[1]];
  const candidateValues = candidates.map((candidate, i) => value(i, 1,
    "tanh(" + number(preactivations[i], 2) + ") ≈ " + number(candidate, 3)));
  const blend = place(mono("h₂ = ½ × (" + number(mixed.hidden[1], 2) + ") + ½ × candidate₂", { size: 42 }), foot);
  const states = [mixed.beforeHidden[1], mixed.afterHidden[1]].map((result, i) => {
    const rail = lanes[i][2].inset("wide", 0);
    const [x, y] = rail.point("center");
    const tip = [x + result * rail.width, y];
    const color = i ? "cyan" : "pink";
    return {
      axis: [line(rail.point("left"), rail.point("right"), { stroke: "faint", width: 3 }),
        line([x, y - 13], [x, y + 13], { stroke: "dim", width: 4 }),
        mono("0", { size: 30, color: "dim" }).moveTo([x, y + 42])],
      bar: line([x, y], tip, { stroke: color, width: 9 }),
      end: [dot(10, color).moveTo(tip), mono((result > 0 ? "+" : "") + number(result, 3),
        { size: 44, color }).moveTo([tip[0], y - 40])],
    };
  });
  const biasTitle = place(label("PyTorch   ·   first hidden coordinate"), source);
  const bias = place(mono("Recurrent bias = 1       contribution = reset × bias"), test);
  const eventNames = ["reproduction", "rollback"].map((name, i) => place(label(name), lanes[i][0], "left"));
  const reproReset = value(0, 1, "σ(−ln 9) = " + number(mixed.reset[0], 2));
  const rollbackReset = value(1, 1, "σ(0)");
  const biasAmount = (i, fraction) => value(i, 2, number(fraction, 2) + " × 1 = " + number(fraction, 2));
  const reproBias = biasAmount(0, mixed.reset[0]), rollbackBias = biasAmount(1, sigmoid(0));

  const heading = title(s, c);
  s.add(input, names);
  c.show("gru-keep-result", [keep, gateKey]);
  c.show("gru-reset-result", reset);
  c.show("gru-identity", idMatrix);
  c.swap("gru-identity", gateKey, candidateTerms);
  c.show("gru-first-operations", idTop);
  c.show("gru-agreement", idBottom);
  c.swap("learned-gru-1", idMatrix, mixMatrix);
  c.hide("learned-gru-1", [idTop, idBottom]);
  c.show("gru-mix", scaled, { lead: 0 });
  c.show("gru-mix-result", afterScale, { lead: 0 });
  c.show("gru-mix-before-reset", beforeScale, { lead: 0 });
  c.show("gru-scale-mixed", afterMix, { lead: 0 });
  c.swap("gru-candidates", [scaled, afterScale, beforeScale, afterMix], candidateValues);
  c.swap("gru-blend", candidateTerms, [blend, states.map(state => state.axis)]);
  for (const [i, cue] of ["gru-original-blend", "gru-pytorch-blend"].entries()) {
    c.on(cue, () => {
      s.play(draw(states[i].bar), { duration: 0.5 });
      s.add(states[i].end);
    });
  }
  c.swapAll("gru-bias", [biasTitle, bias], { keep: heading });
  c.show("gru-bias-repro", [eventNames[0], reproReset, reproBias], { lead: 0 });
  c.show("gru-bias-rollback", [eventNames[1], rollbackReset], { lead: 0 });
  c.show("gru-bias-half", rollbackBias, { lead: 0 });
}
