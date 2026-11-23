import { column, place, rect, row } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { focus, title } from "../parts.mjs";

export default function parameterGeometry(s, c) {
  const [banner, main, result] = area.rows([1, 4, 1], "normal");
  const block = place(mono("One block     2 × (3 input + 2 recurrent) + 2 biases = 12"), banner);
  const groups = main.columns(3, "wide").map((col, i) => place(column([
    label(["RNN", "GRU", "LSTM"][i]), row(Array.from({ length: [1, 3, 4][i] }, () => chip("12")), { gap: "tight" }),
  ], { gap: "wide" }), col));
  const totals = result.columns(3, "wide").map((col, i) => place(mono(String([12, 36, 48][i]), { color: "green" }), col));
  const torch = place(label("PyTorch GRU     •     two rows per block"), banner);
  const matrices = [["input weights", 3], ["recurrent weights", 2], ["input bias", 1], ["recurrent bias", 1]];
  const tensorTiles = main.columns(4, "wide").map((slot, i) => {
    const [name, count] = matrices[i];
    const colors = ["pink", "green", "cyan"];
    const grid = column(Array.from({ length: 6 }, (_, r) => row(Array.from({ length: count }, () =>
      rect(32, 32, { fill: colors[Math.floor(r / 2)], stroke: "transparent" })), { gap: 6 })), { gap: 6 });
    return place(column([label(name), grid, mono("6 × " + count)], { gap: "normal" }), slot);
  });
  const sum = place(mono("18 + 12 + 6 + 6 = 42", { color: "green" }), result);
  const batch = place(mono("Input   [4 sequences, 5 events, 3 features]"), banner);
  const encoded = place(label("One hidden vector per event"), banner);
  const [layout, read] = main.columns([1.25, 1], "wide");
  const rows = layout.rows(4, "normal").map(r => r.columns(5, "tight"));
  function tiles(width, color) {
    return rows.map(r => r.map(slot => place(row(Array.from({ length: width }, () =>
      rect(24, 36, { fill: color, stroke: "transparent" })), { gap: 5 }), slot)));
  }
  const features = tiles(3, "blue"), outputs = tiles(2, "cyan");
  const [explain, end] = read.rows(2, "normal");
  const state = place(mono("Output   [4, 5, 2]", { color: "cyan" }), explain);
  const final = place(mono("Final hidden   [1, 4, 2]", { color: "yellow" }), end);
  const last = rows.map(r => place(rect(90, 64, { fill: "transparent", stroke: "yellow", width: 4 }), r[4]));
  const axes = place(note("Final hidden axes     layers × directions, batch, hidden"), result);
  const heading = title(s, c);
  s.add(block);
  c.show("parameter-geometry-0", groups);
  c.show("parameter-one-bias", totals, { after: true });
  c.swapAll("parameter-geometry-1", [torch, tensorTiles], { keep: heading });
  c.on("parameter-pytorch", () => focus(s, tensorTiles[0], "cyan"));
  c.show("parameter-total", sum);
  c.swapAll("parameter-geometry-2", [batch, features], { keep: heading });
  c.swap("parameter-output", [batch, features], [encoded, outputs, state]);
  c.show("parameter-final", [last, final, axes]);
}
