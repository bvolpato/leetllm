import { dot, draw, line, place } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { scalarTrace } from "../../../films/rnn-memory/arithmetic.mjs";
import { title } from "../parts.mjs";

export default function earnedTransfer(s, c) {
  const events = [0.2, 0.8, 0], changed = [0.2, 0.8, 0.9];
  const prefix = scalarTrace(events.slice(0, 2));
  const long = scalarTrace(events), wrong = scalarTrace(changed);
  const threshold = 0.5;
  const [picture] = area.rows([5.6, 1], 0);
  const [formula, top, bottom, footer] = picture.rows([0.8, 4, 4, 0.8], "tight");
  const rule = place(mono("h = tanh(0.8 x + 0.5 × old h)       flag if h ≥ 0.50", { size: 41 }), formula);
  function history(band, length, name) {
    const [meta, trace, labelBand] = band.columns([1, 5.6, 1], "normal");
    const [identity, size] = meta.rows(2, "tight");
    const bits = [place(label(name), identity, "bottom"), place(note("length " + length, { color: "yellow" }), size, "top")];
    const [tokens, chart] = trace.rows([1.15, 3], "tight");
    const slots = chart.columns(3, "normal");
    const xs = slots.map(r => r.point("center")[0]);
    const base = chart.point("bottom")[1] - 20;
    const y = value => base - value * (chart.height - 35);
    const at = (t, h) => [xs[t], y(h)];
    const makeToken = (i, value) => {
      const text = i < 2 ? "x = " + value.toFixed(1) : value.toFixed(1) + (i < length ? " measured" : " padding");
      return place(chip(text, { size: 35, color: i < length ? "blue" : "dim", dash: i >= length }), tokens.columns(3, "normal")[i]);
    };
    const words = events.map((v, i) => makeToken(i, v));
    const reference = [line([trace.point("left")[0], y(threshold)], [trace.point("right")[0], y(threshold)], { stroke: "dim", width: 2, dash: [9, 9] }),
      mono(threshold.toFixed(2), { size: 31, color: "dim" }).moveTo([trace.point("left")[0] + 40, y(threshold) - 24])];
    const path = long.slice(1).map((v, t) => {
      const point = at(t, v);
      const numberAt = [[-96, 0], [0, -52], [96, 0]][t];
      const coordinate = mono(v.toFixed(3), { size: 35, color: "cyan" })
        .moveTo([point[0] + numberAt[0], point[1] + numberAt[1]]);
      const edge = t ? line(at(t - 1, long[t]), point, { stroke: "cyan", width: 6 }) : null;
      return { dot: dot(9, "cyan").moveTo(point), coordinate, edge };
    });
    const state = scalarTrace(events.slice(0, length)).at(-1);
    const point = at(length - 1, state);
    const read = dot(16, "yellow").moveTo(point);
    const decision = (value, color) => place(chip(value >= threshold ? "flag" : "clear", { color, size: 40 }), labelBand);
    const verdict = decision(state, "ink");
    const ghost = (value) => {
      const dest = at(2, value);
      return [line(at(1, prefix.at(-1)), dest, { stroke: "pink", width: 3, dash: [8, 8] }),
        dot(8, "pink").moveTo(dest),
        mono(value.toFixed(3), { size: 34, color: "pink" }).moveTo([dest[0] + 96, dest[1]])];
    };
    return { bits, reference, path, read, state, verdict, decision, words, makeToken, ghost };
  }
  const a = history(top, 3, "Run A"), b = history(bottom, 2, "Run B");
  const prompt = place(label("Which runs end at or above the dashed line?"), footer);
  const zeroTest = place(label("If B takes an extra step", { color: "pink" }), footer);
  const [aloneBand, batchBand] = footer.columns(2, "wide");
  const alone = place(mono("B alone   " + prefix.at(-1).toFixed(3), { size: 40 }), aloneBand, "right");
  const batched = place(mono("B in batch   " + b.state.toFixed(3), { size: 40 }), batchBand, "left");
  const wrongZero = b.ghost(long.at(-1)), wrongChanged = b.ghost(wrong.at(-1));
  const zeroVerdict = b.decision(long.at(-1), "pink"), changedVerdict = b.decision(wrong.at(-1), "pink");
  const changedFiller = b.makeToken(2, changed[2]);
  title(s, c);
  s.add(rule, a.bits, b.bits, a.reference, b.reference, a.words.slice(0, 2), b.words.slice(0, 2));
  function addPoints(i, ...series) {
    const points = series.map(row => row.path[i]);
    if (i) s.play(...points.map(p => draw(p.edge)), { duration: 0.45 });
    s.add(points.flatMap(p => [p.dot, p.coordinate]));
  }
  c.on("fresh-first", () => addPoints(0, a, b));
  c.on("fresh-second", () => addPoints(1, a, b));
  c.show("fresh-zero", [a.words[2], b.words[2]]);
  c.show("fresh-question", prompt);
  c.on("fresh-real", () => addPoints(2, a));
  c.show("fresh-read", [a.read, b.read]);
  c.hide("fresh-decision", prompt);
  c.show("fresh-decision", [a.verdict, b.verdict], { lead: 0 });
  c.swap("fresh-detach", [b.read, b.verdict], [zeroTest, wrongZero], { lead: 0 });
  c.show("fresh-clear", zeroVerdict, { lead: 0 });
  c.swap("fresh-substitute", b.words[2], changedFiller);
  c.hide("fresh-substitute", [wrongZero, zeroVerdict]);
  c.show("fresh-junk-result", [wrongChanged, changedVerdict], { lead: 0 });
  c.swap("fresh-verify", [wrongChanged, changedVerdict, zeroTest], [b.read, b.verdict], { lead: 0 });
  c.show("fresh-alone", alone, { lead: 0 });
  c.swap("fresh-recheck", changedFiller, b.words[2], { lead: 0 });
  c.show("fresh-match", batched, { lead: 0 });
}
