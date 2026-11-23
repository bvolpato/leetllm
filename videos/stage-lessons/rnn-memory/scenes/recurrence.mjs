import { dot, draw, line, place } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { actorMemoryTrace, title } from "../parts.mjs";

export default function recurrence(s, c) {
  const [rule, words, inputs, chart, readout] = area.rows([1, 1, 1, 5, 1], "tight");
  const dog = actorMemoryTrace("dog"), cat = actorMemoryTrace("cat");
  const columns = chart.columns(5, "normal");
  const point = (i, h) => {
    const [x, y] = columns[i].point("center");
    return [x, y - h * chart.height * 0.52];
  };
  const ticks = columns.map((_, i) => line(point(i, -0.025), point(i, 0.025), { stroke: "dim", width: 3 }));
  const rail = line(point(0, 0), point(4, 0), { stroke: "dim", width: 3 });
  const baseline = place(note("h = 0"), chart, "left");
  const formula = place(mono("h = tanh(input + 0.9 × previous state)"), rule);
  const palette = ["cyan", "pink"];
  const traces = [dog, cat].map((trace, run) => {
    const tokens = words.columns(5, "normal").map((slot, i) => place(chip(trace.words[i], { size: 40 }), slot));
    const features = inputs.columns(5, "normal").map((slot, i) => place(
      mono("x = " + (trace.inputs[i] > 0 ? "+" : "") + trace.inputs[i], { size: 34, color: i === 1 ? palette[run] : "dim" }), slot));
    const steps = trace.states.slice(1).map((v, i) => {
      const xy = point(i, v);
      const mark = dot(10, palette[run]).moveTo(xy);
      const value = mono(v.toFixed(3), { size: 34, color: palette[run] }).moveTo([xy[0], xy[1] + (run ? 34 : -34)]);
      const segment = i ? line(point(i - 1, trace.states[i]), xy, { stroke: palette[run], width: 6 }) : null;
      return { mark, value, segment };
    });
    return { tokens, features, steps };
  });
  const [a, b] = traces;
  const question = place(label("The last noun is cat. Which sign reaches the end?"), readout);
  const firstAnswer = place(label("Positive state → dog acted", { color: "cyan" }), readout);
  const bothAnswers = place(label("Positive → dog acted         Negative → cat acted", { color: "ink" }), readout);
  title(s, c);
  s.add(a.tokens, rail, ticks, baseline, a.steps[0].mark);
  c.show("actor-feature", a.features);
  c.show("previous-memory", formula);
  function append(step, seconds) {
    s.play(draw(step.segment), { duration: seconds });
    s.add(step.mark, step.value);
  }
  c.on("dog-input", () => append(a.steps[1], 0.65));
  c.on("step-chased", () => append(a.steps[2], 0.65));
  c.on("step-the", () => append(a.steps[3], 0.65));
  c.show("actor-question", question);
  c.on("step-cat", () => append(a.steps[4], 0.65));
  c.swap("actor-readout", question, firstAnswer);
  c.swap("reverse-run", [...a.tokens, ...a.features, firstAnswer], [...b.tokens, ...b.features]);
  c.on("cat-input", () => append(b.steps[1], 0.6));
  c.on("carry-cat", () => {
    for (const step of b.steps.slice(2)) append(step, 0.5);
  });
  c.show("cat-readout", bothAnswers);
}
