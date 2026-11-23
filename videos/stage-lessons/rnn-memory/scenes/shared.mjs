import { boxOf, dot, dynamic, line, place, to } from "vizmatic/stage";
import { area, chip, label, mono } from "../../kit-narrated.mjs";
import { actorMemoryTrace, title } from "../parts.mjs";

export default function shared(s, c) {
  const example = actorMemoryTrace("cat");
  const [words, matrices, registers, footer] = area.rows([1.2, 1.3, 3.3, 1], "normal");
  const slots = words.columns(5, "normal");
  const tokens = example.words.map((v, i) => place(chip(v, { size: 42 }), slots[i]));
  const cursorStops = tokens.map(token => {
    const [x, y] = boxOf(token).point("bottom");
    return [x, y + 12];
  });
  const cursor = line([-52, 0], [52, 0], { stroke: "yellow", width: 6 }).moveTo(cursorStops[0]);
  const [input, memory] = matrices.columns(2, "wide");
  const wx = place(mono("Wₓ = [[1, 0], [0, 1]]", { size: 38, color: "blue" }), input);
  const wh = place(mono("Wₕ = [[0.9, 0], [0, 0.9]]", { size: 38, color: "cyan" }), memory);
  const rows = registers.rows(2, "normal");
  const actor = s.value(0), verb = s.value(0);
  const paint = ["pink", "cyan"];
  const gauges = [actor, verb].flatMap((v, i) => {
    const [name, track, amount] = rows[i].columns([1.2, 3.8, 1], "normal");
    const [x, y] = track.point("center");
    const pos = () => x + track.width * v.value / 2;
    return [place(label(i ? "Verb clue" : "Actor clue"), name),
      line(track.point("left"), track.point("right"), { stroke: "dim", width: 4 }),
      line([x, y - 16], [x, y + 16], { stroke: "dim", width: 4 }),
      dynamic(() => line([x, y], [pos(), y], { stroke: paint[i], width: 9 })),
      dynamic(() => dot(12, paint[i]).moveTo([pos(), y])),
      dynamic(() => mono(v.value.toFixed(3), { size: 50, color: paint[i] }).moveTo(amount.point("center")))];
  });
  const inputs = example.words.map((word, i) => [example.inputs[i], word === "chased" ? 0.8 : 0]);
  let previousVerb = 0;
  const verbTrace = inputs.map(([, x]) => (previousVerb = Math.tanh(x + 0.9 * previousVerb)));
  const formula = place(mono("h = tanh(Wₓ x + Wₕ old h)     •     bias = 0", { size: 43 }), footer);
  title(s, c);
  s.add(tokens, cursor, gauges);
  c.show("input-matrix", wx);
  c.show("recurrent-matrix", [wh, formula]);
  function step(i) {
    s.play(to(cursor, n => n.moveTo(cursorStops[i])),
      actor.to(example.states[i + 1]), verb.to(verbTrace[i]), { duration: 0.65 });
  }
  c.on("shared-actor", () => step(1));
  c.on("shared-verb", () => step(2));
  c.on("shared-suffix", () => { step(3); step(4); });
}
