import { arrow, draw, place } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { EVENTS, incidentModel, scalar, title } from "../parts.mjs";

export default function actualCredit(s, c) {
  const m = incidentModel();
  const [head, tape, edges, credit, footer] = area.rows([1, 2, 2, 2, 1], "normal");
  const slots = tape.columns(4, "normal");
  const names = ["start", ...EVENTS];
  const states = slots.flatMap((r, i) => {
    const [name, value] = r.rows([1, 1], "tight");
    return [place(label(names[i]), name), place(mono("h = " + scalar[i].toFixed(3), { color: "cyan" }), value)];
  });
  const creditSlots = credit.columns(4, "normal");
  const formula = place(mono("local slope = 0.5 × (1 − new state²)"), head);
  const sensitivities = [...m.sensitivities].reverse();
  const amounts = creditSlots.map((r, i) => place(mono(sensitivities[i].toFixed(6), { size: 48, color: "yellow" }), r));
  const links = m.factors.map((factor, i) => {
    const left = slots[i].point("center")[0], right = slots[i + 1].point("center")[0];
    const y = edges.point("center")[1];
    const wire = arrow([right - 30, y], [left + 30, y], { stroke: "pink", width: 5, pad: 0 });
    const number = mono("× " + factor.toFixed(6), { color: "pink", size: 36 }).moveTo([(left + right) / 2, y - 42]);
    return { wire, number };
  });
  const unit = place(note("Start with one unit of sensitivity at the final state."), footer);
  const creditLabel = place(mono("∂h₃ / ∂w     contributions from the three weight uses"), head);
  const terms = creditSlots.slice(1).map((r, i) => place(mono(m.weightTerms[i].toFixed(6), { size: 44 }), r));
  const sum = place(mono("Shared weight gradient = " + m.weightGradient.toFixed(6), { color: "yellow" }), footer);
  title(s, c);
  s.add(formula, states);
  c.show("credit-factors", links.map(e => e.number));
  c.show("actual-credit-1", [amounts[3], unit]);
  for (const [k, cue] of ["credit-last", "credit-second", "credit-all"].entries()) {
    const i = 2 - k;
    c.on(cue, () => { s.play(draw(links[i].wire), { duration: 0.55 }); s.add(amounts[i]); });
  }
  c.swap("actual-credit-2", [formula, unit, amounts, links.map(e => [e.wire, e.number])], creditLabel);
  c.show("credit-weight-sum", terms);
  c.show("credit-weight-total", sum);
}
