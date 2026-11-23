import { dynamic, dot, line, place } from "vizmatic/stage";
import { mono, note } from "../../kit-narrated.mjs";
import { focus, title, TAPE, WORK } from "../parts.mjs";

export default function retention(s, c) {
  const [header, chart] = TAPE.rows([1, 4], "normal");
  const [readout, footer] = WORK.rows([1, 1], "normal");
  const n = s.value(0);
  const [left, bottom] = chart.point("bottom left");
  const point = (t, y) => [left + chart.width * t / 30, bottom - chart.height * y];
  const axis = line(point(0, 0), point(30, 0), {stroke:"dim", width:3});
  const sides = readout.columns(2, "wide");
  const paths = [0.98, 0.5].map((f, j) => {
    const color = j ? "pink" : "green";
    const curve = Array.from({length:30}, (_, t) => dynamic(() => {
      const end = Math.max(t, Math.min(t + 1, n.value));
      return line(point(t, f ** t), point(end, f ** end), {stroke:color,width:4}).opacity(end > t ? 1 : 0);
    }));
    const marker = dynamic(() => dot(12, color).moveTo(point(n.value, f ** n.value)));
    const read = dynamic(() => {
      const t = Math.round(n.value), value = f ** t;
      const valueText = value < 0.001 ? value.toExponential(2) : value.toFixed(3);
      return place(mono(f.toFixed(2) + " ^ " + t + " = " + valueText, {color}), sides[j]);
    });
    return {curve, marker, read};
  });
  title(s,c);
  s.add(axis, place(note("Remaining fraction of the starting signal     •     0 to 30 recurrent steps"),header),
    paths.flatMap(p => [...p.curve, p.marker, p.read]));
  c.on("forget-gate-product-b1-1", () => s.play(n.to(10,{duration:2})));
  c.on("protective-retention-b2-1", () => s.play(n.to(30,{duration:2})));
  c.on("halving-retention-b2-2", () => focus(s,paths[1].read,"pink"));
  c.show("forget-gate-product-b3-1",place(note("Direct cell path only     •     gate and hidden-state derivatives also contribute"), footer));
}
