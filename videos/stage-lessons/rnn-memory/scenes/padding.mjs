import { dot, draw, line, place } from "vizmatic/stage";
import { area, chip, label, mono } from "../../kit-narrated.mjs";
import { actorMemoryTrace, title } from "../parts.mjs";

export default function padding(s, c) {
  const dog = actorMemoryTrace("dog");
  const [wordBand, chart, bottom] = area.rows([1, 5.5, 1], "normal");
  const slots = chart.columns(6, "normal");
  const point = (i, value) => [slots[i].point("center")[0], chart.point("bottom")[1] - 65 - value * (chart.height - 140)];
  const words = [...dog.words, "padding"].map((word, i) =>
    place(chip(word, { color: i === 5 ? "dim" : "blue", size: 40, dash: i === 5 }), wordBand.columns(6, "normal")[i]));
  const values = dog.states.slice(1);
  const baseline = line(point(0, 0), point(5, 0), { stroke: "dim", width: 3 });
  const zero = mono("0", { size: 34, color: "dim" }).moveTo([point(0, 0)[0] - 40, point(0, 0)[1]]);
  const marks = values.flatMap((value, i) => {
    const p = point(i, value);
    const marker = dot(10, "cyan").moveTo(p);
    const number = mono(value.toFixed(3), { size: 34, color: "cyan" }).moveTo([p[0], p[1] - 53]);
    return i ? [line(point(i - 1, values[i - 1]), p, { stroke: "cyan", width: 6 }), marker, number] : [marker];
  });
  const result = (amount, color, labelText, above) => {
    const p = point(5, amount);
    return { edge: line(point(4, dog.final), p, { stroke: color, width: 5, dash: above ? [14, 8] : undefined }),
      at: [dot(10, color).moveTo(p), mono(labelText + " " + amount.toFixed(3), { color, size: 34 }).moveTo([p[0], p[1] + (above ? -36 : 40)])] };
  };
  const extra = result(dog.padded, "pink", "run", false), skip = result(dog.final, "green", "skip", true);
  const q = place(label("Would checking the predicted actor catch a padding bug?"), bottom);
  const finding = place(label("Both states predict dog. Only one equals the state at the real ending."), bottom);
  title(s, c);
  s.add(words.slice(0, 5), baseline, zero, marks);
  c.show("pad-slot", words[5]);
  c.on("unmasked-ending", () => { s.play(draw(extra.edge), { duration: 0.6 }); s.add(extra.at); });
  c.on("preserved-ending", () => { s.play(draw(skip.edge), { duration: 0.6 }); s.add(skip.at); });
  c.show("actor-padding-question", q);
  c.swap("opening-payoff", q, finding);
}
