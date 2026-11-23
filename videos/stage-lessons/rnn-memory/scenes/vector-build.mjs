import { place, rect } from "vizmatic/stage";
import { area, label, mono, note } from "../../kit-narrated.mjs";
import { EVENTS, states, title, wh, wx } from "../parts.mjs";

export default function vectorBuild(s, c) {
  const [matrices, banner, board] = area.rows([4, 1, 4], "normal");
  const [input, memory] = matrices.columns([3, 2], "loose");
  const [inputTitle, inputBody] = input.rows([1, 3], "normal");
  const [memoryTitle, memoryBody] = memory.rows([1, 3], "normal");
  const inputCols = inputBody.columns(3, "normal");
  const matrixRows = (matrix, columns, names) => columns.flatMap((col, j) => {
    const slots = col.rows(3, "tight");
    return [place(note(names[j]), slots[0]), ...matrix.map((row, i) => place(mono(row[j].toFixed(1)), slots[i + 1]))];
  });
  const frames = inputCols.map(col => place(
    rect(col.width - 10, inputBody.height, { fill: "transparent", stroke: "blue", width: 4, radius: 10 }), col));
  const columns = board.columns([1.45, 1, 1, 1], "normal");
  const headings = ["coordinate", "from input", "from memory", "tanh(sum)"];
  const cells = columns.map(col => col.rows(3, "tight"));
  const headers = headings.map((v, j) => place(note(v), cells[j][0]));
  const names = [1, 2].map((k, i) => place(label(String(k)), cells[0][i + 1]));
  const data = EVENTS.map((event, t) => {
    const previous = states[t];
    const carried = wh.map(row => row.reduce((total, weight, j) => total + weight * previous[j], 0));
    const from = wx.map(row => row[t]);
    const bannerText = event + "    x = [" + EVENTS.map((_, j) => Number(t === j)).join(", ") + "]    old h = [" +
      previous.map(v => v.toFixed(3)).join(", ") + "]";
    return {
      banner: place(mono(bannerText, { size: 39 }), banner),
      values: [from, carried, states[t + 1]].map((pair, j) => pair.map((v, i) => place(
        mono(v.toFixed(3), { color: ["blue", "cyan", "yellow"][j], size: 52 }), cells[j + 1][i + 1]))),
    };
  });
  const product = place(mono("0.5 × 0.664 + 0.1 × 0.100 ≈ 0.342", { size: 33, color: "cyan" }), memoryTitle);
  const recurrentTitle = place(label("Recurrent weights"), memoryTitle);
  title(s, c);
  s.add(place(label("Input weights"), inputTitle), recurrentTitle,
    matrixRows(wx, inputCols, EVENTS), matrixRows(wh, memoryBody.columns(2, "normal"), ["old coord 1", "old coord 2"]),
    headers, names, data[0].banner);
  c.show("vector-columns", frames[0]);
  const starts = ["vector-build-1", "vector-second-start", "vector-build-2"];
  const recurs = ["vector-first-memory", "vector-second-memory", "vector-third-memory"];
  const results = ["vector-first-reveal", "vector-second-reveal", "vector-third-reveal"];
  for (let t = 0; t < data.length; t++) {
    if (t) {
      c.swap(starts[t], [frames[t - 1], data[t - 1].banner, ...data[t - 1].values],
        [frames[t], data[t].banner, data[t].values[0]]);
    } else {
      c.show(starts[t], data[t].values[0]);
    }
    c.show(recurs[t], data[t].values[1]);
    c.show(results[t], data[t].values[2]);
  }
  c.swap("worked-product", recurrentTitle, product);
  c.swap("vector-build-2", product, recurrentTitle);
}
