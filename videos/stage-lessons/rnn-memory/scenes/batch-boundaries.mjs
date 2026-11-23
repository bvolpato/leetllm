import { place } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { incidentModel, padded, scalar, states, title } from "../parts.mjs";

export default function batchBoundaries(s, c) {
  const { junk, resetNext, leakedNext } = incidentModel();
  const [tape, comparison, foot] = area.rows([3.4, 3, 1], "wide");
  const [a, b] = tape.rows(2, "normal").map(r => r.columns(4, "normal"));
  const shape = [place(label("A   length 3"), a[0]), place(label("B   length 2"), b[0])];
  for (const slots of [a, b]) {
    shape.push(place(chip("error"), slots[1]), place(chip("reproduction"), slots[2]));
  }
  shape.push(place(chip("rollback"), a[3]));
  const padSlot = place(chip("filler", { color: "dim", dash: true }), b[3]);
  const [labels, zeroBand, junkBand] = comparison.columns([1.2, 1.3, 1.3], "wide").map(col => col.rows(3, "tight"));
  const pair = v => "[" + v.map(x => x.toFixed(3)).join(", ") + "]";
  const ref = place(mono("B alone, after reproduction     " + pair(states[2]), { color: "cyan" }), foot);
  const zero = place(chip("x = [0, 0, 0]", { color: "dim" }), zeroBand[0]);
  const changed = place(chip("x = [9, −9, 9]", { color: "dim" }), junkBand[0]);
  const run = place(label("Run all slots"), labels[1]);
  const pack = place(label("Pack by length"), labels[2]);
  const unconditional = [padded, junk].map((v, i) => place(mono(pair(v), { color: "pink" }), [zeroBand, junkBand][i][1]));
  const byLength = [zeroBand, junkBand].map(band => place(mono(pair(states[2]), { color: "cyan" }), band[2]));
  const active = place(note("Active rows     t₁: A + B       t₂: A + B       t₃: A"), foot);
  const [begin, transition, end] = area.rows([1.2, 3, 2], "wide");
  const next = place(label("New independent incident     first event = 0.4"), begin);
  const [reset, leak] = transition.columns(2, "wide").map(region => region.rows(2, "normal"));
  const origins = [place(mono("reset     old h = 0"), reset[0]),
    place(mono("reuse     old h ≈ " + scalar.at(-1).toFixed(3)), leak[0])];
  const after = [place(mono("tanh(0.32) ≈ " + resetNext.toFixed(3), { color: "cyan" }), reset[1]),
    place(mono("tanh(0.32 + 0.5 × 0.764) ≈ " + leakedNext.toFixed(3), { size: 35, color: "pink" }), leak[1])];
  const consequence = place(label("Detaching carries the old value into the new incident."), end);
  const heading = title(s, c);
  s.add(shape, padSlot, ref);
  c.show("padding-zero", [run, zero]);
  c.show("zero-result", unconditional[0]);
  c.show("padding-junk", changed);
  c.show("junk-result", unconditional[1]);
  c.show("packing-prefixes", pack);
  c.hide("packing-prefixes", padSlot);
  c.show("padding-compare", byLength);
  c.swap("active-rows", ref, active);
  c.swapAll("batch-boundaries-2", [next, origins], { keep: heading });
  c.show("boundary-reset", after);
  c.show("boundary-detach", consequence);
}
