import { line, place, rect } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { incidentModel, title } from "../parts.mjs";

export default function actionHead(s, c) {
  const m = incidentModel();
  const [input, columns, ...rest] = area.rows([1.1, 0.7, 1.35, 1.35, 1.35, 1], "normal");
  const footer = rest.pop();
  const split = slot => slot.columns([0.9, 2.25, 2, 1.55], "wide");
  const headers = ["action", "row × hidden state", "logit", "probability"].map((v, i) => place(note(v), split(columns)[i]));
  const state = place(mono("Rounded final state    [" + m.roundedState.map(v => v.toFixed(3)).join(", ") + "]"), input);
  const names = ["ignore", "rollback", "escalate"];
  const rows = rest.map((slot, i) => {
    const [action, weights, logit, probability] = split(slot);
    const [track, value] = logit.columns([1.35, 1], "tight");
    const [x, y] = track.point("left");
    const width = m.logits[i] * track.width / 0.4;
    const full = line([x, y], track.point("right"), { stroke: "dim", width: 3 });
    const bar = rect(width, 35, { fill: "cyan", stroke: "transparent" }).moveTo([x + width / 2, y]);
    const [wa, wb] = m.readout[i];
    const expr = wa.toFixed(1) + " × .390 " + (wb < 0 ? "− " : "+ ") + Math.abs(wb).toFixed(1) + " × .655";
    return { base: [place(label(names[i]), action), place(mono(expr, { size: 35 }), weights), full],
      score: [bar, place(mono(m.logits[i].toFixed(4), { size: 38 }), value)],
      probability: place(mono((100 * m.probabilities[i]).toFixed(1) + "%", { size: 48 }), probability) };
  });
  const q = place(label("Which action will get the highest probability?"), footer);
  const winner = place(label("Rollback ranks first", { color: "yellow" }), footer);
  const stable = place(mono("exp(score − max) / sum of shifted exponentials", { size: 39 }), input);
  const [counts, span] = area.rows([2, 1], "normal");
  const [r1, r2] = counts.rows(2, "normal");
  const cellCount = place(mono("Cell     2 × 3 input + 2 × 2 recurrent + 2 biases = 12"), r1);
  const headCount = place(mono("Head     3 × 2 weights + 3 biases = 9"), r2);
  const total = place(label("3, 30 or 300 events     •     21 shared parameters", { color: "cyan" }), span);
  const heading = title(s, c);
  s.add(state, headers.slice(0, 3), rows.flatMap(r => r.base));
  for (const [i, row] of rows.entries()) c.show("head-row-" + i, row.score);
  c.show("head-question", q);
  c.swap("action-head-1", q, winner);
  c.swap("head-softmax", state, stable);
  c.show("head-probabilities", [headers[3], rows.map(r => r.probability)], { lead: 0 });
  c.swapAll("action-head-2", cellCount, { keep: heading });
  c.show("head-parameter-count", headCount);
  c.show("head-reuse", total);
}
