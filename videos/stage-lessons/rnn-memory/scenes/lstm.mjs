import { dynamic, line, place, rect } from "vizmatic/stage";
import { area, label, mono } from "../../kit-narrated.mjs";
import { cell, hidden, title } from "../parts.mjs";

export default function lstm(s, c) {
  const [terms, storedBand, hiddenBand, lower] = area.rows([1, 2, 2, 1], "normal");
  const old = 0.855, keep = 0.98, write = 0.02, candidate = 0.10;
  const retained = s.value(old), addition = s.value(0), expose = s.value(0.8);
  function lane(band, name) {
    const [left, gauge, right] = band.columns([1.15, 4.5, 1], "normal");
    const [x, y] = gauge.point("left");
    const frame = place(rect(gauge.width, 80, { fill: "surface", stroke: "faint", width: 3, radius: 5 }), gauge);
    const length = gauge.width - 10;
    const start = x + 5;
    const fill = (value, offset, color) => dynamic(() => {
      const width = value() * length;
      return rect(Math.max(1, width), 64, { fill: color, stroke: "transparent" })
        .moveTo([start + offset() * length + width / 2, y]).opacity(width > 0 ? 1 : 0);
    });
    const number = (value, color) => dynamic(() => mono(value().toFixed(4), { color, size: 55 }).moveTo(right.point("center")));
    return { frame, title: place(label(name), left), fill, number, x: start, y, length };
  }
  const storage = lane(storedBand, "Stored cell");
  const exposed = lane(hiddenBand, "Hidden state");
  const storedValue = () => retained.value + addition.value;
  const exposedValue = () => expose.value * Math.tanh(storedValue());
  const read = [exposed.fill(exposedValue, () => 0, "cyan"), exposed.number(exposedValue, "cyan")];
  const [keepBand, writeBand] = terms.columns(2, "wide");
  const kept = place(mono("keep   0.98 × 0.855 = " + (old * keep).toFixed(4), { size: 42, color: "green" }), keepBand);
  const written = place(mono("write   0.02 × 0.10 = " + (write * candidate).toFixed(4), { size: 42, color: "pink" }), writeBand);
  const [caption, detailBand] = lower.columns([1, 2.6], "loose");
  const ruler = detailBand.inset("tight");
  const [min, max] = [0.835, 0.845];
  const [left, y] = ruler.point("left");
  const xAt = amount => left + ruler.width * (amount - min) / (max - min);
  const tick = amount => {
    const x = xAt(amount);
    return [line([x, y - 11], [x, y + 11], { stroke: "dim", width: 3 }),
      mono(amount.toFixed(3), { size: 30 }).moveTo([x, y + 36])];
  };
  const detail = [place(label("Stored cell, close up"), caption),
    line([left, y], ruler.point("right"), { stroke: "dim", width: 3 }),
    ...[min, 0.840, max].flatMap(tick),
    dynamic(() => line([left, y], [xAt(retained.value), y], { stroke: "green", width: 11 })),
    dynamic(() => line([xAt(retained.value), y], [xAt(storedValue()), y], { stroke: "pink", width: 11 }))];
  const cue = place(label("What moves if only the output gate changes?"), lower);
  const formula = dynamic(() => mono("h = " + expose.value.toFixed(2) + " × tanh(" + cell.toFixed(4) + ")", { color: "cyan" })
    .moveTo(lower.point("center")));
  const previousX = exposed.x + hidden * exposed.length;
  const reference = line([previousX, exposed.y - 56], [previousX, exposed.y + 56], { stroke: "dim", width: 3, dash: [6, 5] });
  title(s, c);
  s.add(storage.title, storage.frame, storage.fill(() => retained.value, () => 0, "green"),
    storage.fill(() => addition.value, () => retained.value, "pink"), storage.number(storedValue, "green"),
    exposed.title, exposed.frame);
  c.show("forget-gate-b1-1", kept);
  c.on("lstm-retained-term", () => s.play(retained.to(old * keep, { duration: 0.75 })));
  c.show("input-gate-b1-2", [written, detail]);
  c.on("next-cell-b2-1", () => s.play(addition.to(write * candidate, { duration: 0.6 })));
  c.swap("lstm-expose", detail, [...read, formula]);
  c.swap("gate-question", formula, cue);
  c.show("exposed-hidden-state-b3-1", reference);
  c.swap("exposed-hidden-state-b3-1", cue, formula);
  c.on("exposed-hidden-state-b3-1", () => s.play(expose.to(0.10, { duration: 1.4 })));
}
