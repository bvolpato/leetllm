import { dot, dynamic, line, place } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { title } from "../parts.mjs";

export default function gru(s, c) {
  const [ends, slider, mixture, result] = area.rows([1, 3, 2, 1], "normal");
  const rail = slider.inset("loose");
  const left = rail.point("left"), right = rail.point("right");
  const old = 0.8, candidate = -0.2, keep = s.value(0.95);
  const mix = () => keep.value * old + (1 - keep.value) * candidate;
  const at = z => [left[0] + z * (right[0] - left[0]), left[1]];
  const endsNodes = [
    place(label("Candidate   −0.20", { color: "pink" }), ends, "left"),
    place(label("Previous state   +0.80", { color: "cyan" }), ends, "right"),
  ];
  const lineNode = line(left, right, { stroke: "dim", width: 6 });
  const marks = [0, 0.2, 0.5, 1].map(z => {
    const [x, y] = at(z);
    return line([x, y - 14], [x, y + 14], { stroke: "dim", width: 4 });
  });
  const zero = note("0").moveTo([at(0.2)[0], left[1] + 48]);
  const cursor = dynamic(() => dot(16, "yellow").moveTo(at(keep.value)));
  const number = dynamic(() => mono(mix().toFixed(3), { size: 54, color: "yellow" }).moveTo([at(keep.value)[0], left[1] - 57]));
  const weights = dynamic(() => mono("h = " + keep.value.toFixed(2) + " × 0.80 + " + (1 - keep.value).toFixed(2) + " × (−0.20)")
    .moveTo(mixture.point("center")));
  const question = place(label("How far toward the candidate does a half-open keep gate take you?"), result);
  const reset = place(note("The reset gate controls what the candidate can read from the old state."), result);
  title(s, c);
  s.add(endsNodes, lineNode, marks, zero);
  c.show("gru-weights", weights);
  c.show("gru-start", [cursor, number]);
  c.show("gru-question", question);
  c.on("gru-midpoint", () => s.play(keep.to(0.5, { duration: 1.2 })));
  c.on("gru-replace", () => s.play(keep.to(0.05, { duration: 1.2 })));
  c.swap("gru-reset", question, reset);
}
