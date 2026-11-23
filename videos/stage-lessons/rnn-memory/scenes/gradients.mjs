import { dot, draw, line, place } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { title } from "../parts.mjs";

export default function gradients(s, c) {
  const [heading, graph, footer] = area.rows([1, 6, 1], "normal");
  const [plot, legend] = graph.columns([5, 1.15], "normal");
  const field = plot.inset("loose");
  const [left, bottom] = field.point("bottom left");
  const point = (step, value) => [left + field.width * (step / 12), bottom - field.height * (Math.log10(value) + 3) / 5];
  const levels = [0.001, 0.01, 0.1, 1, 10, 100];
  const guidelines = levels.flatMap(v => [
    line(point(0, v), point(12, v), { stroke: v === 1 ? "dim" : "faint", width: 2 }),
    mono(String(v), { size: 31, color: "dim" }).moveTo([left - 61, point(0, v)[1]]),
  ]);
  const positions = [0, 4, 8, 12].map(n => mono(String(n), { size: 34 }).moveTo([point(n, 0.001)[0], bottom + 34]));
  const unit = dot(11, "yellow").moveTo(point(0, 1));
  const desc = place(note("Credit magnitude    •    each horizontal grid line is ten times the line below"), heading);
  const labelX = place(label("Number of links crossed going backward"), footer);
  function path(factor, color) {
    return Array.from({ length: 12 }, (_, n) => line(point(n, factor ** n), point(n + 1, factor ** (n + 1)), { stroke: color, width: 6 }));
  }
  const shrink = path(0.6, "pink"), grow = path(1.4, "cyan");
  const terminal = (f, color) => {
    const y = point(12, f ** 12)[1];
    const x = legend.point("center")[0];
    return [mono(f.toFixed(1) + "¹²", { size: 35, color }).moveTo([x, y - 23]),
      mono((f ** 12).toFixed(f < 1 ? 5 : 2), { size: 48, color }).moveTo([x, y + 28])];
  };
  title(s, c);
  s.add(desc, guidelines, positions, unit, labelX);
  function run(segments) { for (const seg of segments) s.play(draw(seg), { duration: 0.18 }); }
  c.on("gradient-chain-rule-b1-1", () => run(shrink.slice(0, 4)));
  c.on("fading-gradient-b2-1", () => run(shrink.slice(4)));
  c.show("faded-value", terminal(0.6, "pink"));
  c.on("growing-gradient", () => run(grow));
  c.show("grown-value", terminal(1.4, "cyan"));
}
