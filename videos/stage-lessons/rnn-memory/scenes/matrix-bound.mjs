import { arrow, dot, draw, dynamic, line, place, tex } from "vizmatic/stage";
import { area, heading, label, mono } from "../../kit-narrated.mjs";
import { incidentModel, title } from "../parts.mjs";

export default function matrixBound(s, c) {
  const [rule, chart, footer] = area.rows([1.1, 4, 1], "normal");
  const [plot, diagram] = chart.columns([1.65, 1], "wide");
  const [lengthLabel, vectorLabel] = footer.columns([1.65, 1], "wide");
  const field = plot.inset("loose");
  const [x, y] = field.point("bottom left");
  const p = (step, length) => [x + field.width * step / 9, y - field.height * length / 1.3];
  const axis = (start, end) => line(start, end, { stroke: "dim", width: 3 });
  const axes = [axis(p(0, 0), p(9, 0)), axis(p(0, 0), p(0, 1.3))];
  const labels = [0, 1, 2, 5, 9].map(n => mono(String(n), { size: 34 }).moveTo([p(n, 0)[0], y + 34]));
  const one = mono("1", { size: 34 }).moveTo([x - 32, p(0, 1)[1]]);
  const reference = line(p(0, 1), p(9, 1), { stroke: "dim", width: 2, dash: [8, 8] });
  const horizontal = place(label("Number of steps"), lengthLabel);
  const [graphName, lengthReadout] = rule.columns([1.65, 1], "wide");
  const graphTitle = place(label("Length of the arrow"), graphName);
  const vectors = incidentModel().matrixPowers.slice(0, 10);
  const lengths = vectors.map(v => Math.hypot(...v));
  const progress = s.value(0);
  function tipAtStep() {
    const i = Math.floor(progress.value), fraction = progress.value - i;
    if (i === 0) {
      const angle = Math.PI / 2 + fraction * (Math.atan2(vectors[1][1], vectors[1][0]) - Math.PI / 2);
      const length = 1 + fraction * (lengths[1] - 1);
      return [length * Math.cos(angle), length * Math.sin(angle)];
    }
    return vectors[i].map((v, j) => v + fraction * ((vectors[i + 1]?.[j] ?? v) - v));
  }
  const plane = diagram.inset("loose");
  const origin = plane.point("bottom left");
  const scale = Math.min(plane.width, plane.height) * 0.82;
  const tip = ([a, b]) => [origin[0] + a * scale, origin[1] - b * scale];
  const grid = [axis(origin, tip([1.2, 0])), axis(origin, tip([0, 1.2]))];
  for (const [height, text] of [[0.25, "¼"], [0.5, "½"], [1, "1"]]) {
    const [left, row] = tip([0, height]);
    grid.push(line([left, row], tip([1, height]), { stroke: "faint", width: 2, dash: [7, 8] }));
    grid.push(mono(text, { size: 32 }).moveTo([left - 30, row]));
  }
  const [right, baseline] = tip([1, 0]);
  grid.push(line([right, baseline], tip([1, 1]), { stroke: "faint", width: 2, dash: [7, 8] }));
  grid.push(mono("1", { size: 32 }).moveTo([right, baseline + 28]));
  const movingArrow = dynamic(() => {
    const v = tipAtStep();
    return arrow(origin, tip(v), { stroke: "yellow", width: 8, tip: Math.min(28, Math.hypot(...v) * scale / 3), pad: 0 });
  });
  const length = dynamic(() => place(mono("Length  " + Math.hypot(...tipAtStep()).toFixed(3), { size: 47, color: "yellow" }), lengthReadout));
  const matrix = place(tex("W=\\begin{bmatrix}0.5&1\\\\0&0.5\\end{bmatrix}", { size: 47 }), vectorLabel);
  const power = place(tex("W^n=\\begin{bmatrix}0.5^n&n\\,0.5^{n-1}\\\\0&0.5^n\\end{bmatrix}", { size: 45 }), vectorLabel);

  const segments = lengths.slice(1).map((v, i) => line(p(i, lengths[i]), p(i + 1, v), { stroke: "yellow", width: 6 }));
  const readings = [1, 2].map(n => {
    const [x, y] = p(n, lengths[n]);
    return mono(lengths[n].toFixed(3), { size: 32, color: "yellow" }).moveTo([x + (n === 1 ? -18 : 24), y - 38]);
  });
  const start = dot(9, "yellow").moveTo(p(0, 1));
  const sceneTitle = title(s, c);
  s.add(axes, labels, one, reference, horizontal, graphTitle, grid, movingArrow, matrix, length, start);
  function step(n, duration) {
    s.play(draw(segments[n - 1]), progress.to(n), { duration });
    if (n <= 2) s.add(readings[n - 1]);
  }
  c.on("matrix-first", () => step(1, 0.8));
  c.on("matrix-second", () => step(2, 0.8));
  c.on("matrix-powers", () => {
    for (let n = 3; n <= 9; n++) step(n, 0.22);
  });
  c.swap("matrix-decay", matrix, power);
  const maximum = place(mono("Maximum stretch  " + ((1 + Math.sqrt(2)) / 2).toFixed(3), { size: 41 }), vectorLabel);
  c.swap("matrix-bound-1", power, maximum);
  const boundTitle = heading("How much can reach an earlier state?");
  const boundRule = place(tex("\\lVert J_t\\rVert_2\\leq\\gamma\\,\\sigma_{\\max}(W_h)", { size: 61 }), rule);
  const meaning = place(label("γ = largest tanh slope at this step", { size: 36 }), diagram);
  c.swap("jacobian-bound", [sceneTitle, graphTitle, grid, movingArrow, length, start, segments, readings, maximum], [boundTitle, boundRule, meaning]);
  const bound = Array.from({ length: 9 }, (_, i) => line(p(i, 0.75 ** i), p(i + 1, 0.75 ** (i + 1)), { stroke: "cyan", width: 6 }));
  const five = place(mono("0.75⁵ ≈ " + (0.75 ** 5).toFixed(3), { size: 50, color: "cyan" }), diagram);
  c.on("bound-product", () => {
    s.remove(meaning);
    for (const segment of bound) s.play(draw(segment), { duration: 0.2 });
    s.add(five);
  });

  const gradient = Math.fround(0.6 ** 50);
  const [gradientBand, updateBand, resultBand] = area.rows([1, 1, 1], "normal");
  const finite = place(tex("g=0.6^{50}\\approx " + (gradient * 1e12).toFixed(2) + "\\times10^{-12}", { size: 75, color: "cyan" }), gradientBand);
  const update = place(mono("new weight = float32(1 − 1 × g)", { size: 54 }), updateBand);
  const result = place(mono("new weight = " + Math.fround(1 - gradient), { size: 67, color: "yellow" }), resultBand);
  c.swapAll("finite-decay", [heading("Can this gradient change a weight?"), finite]);
  c.show("rounded-update", update, { lead: 0 });
  c.show("rounded-result", result, { lead: 0 });
}
