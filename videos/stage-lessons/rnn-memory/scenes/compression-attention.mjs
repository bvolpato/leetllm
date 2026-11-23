import { arrow, dot, place, rect, to } from "vizmatic/stage";
import { area, chip, label, mono, note } from "../../kit-narrated.mjs";
import { EVENTS, states, title } from "../parts.mjs";

export default function compressionAttention(s, c) {
  const [top, main, footer] = area.rows([1, 5, 1], "normal");
  const [codes, decoder] = main.columns([1.4, 1], "loose");
  const rows = codes.rows(4, "normal");
  const cells = rows.flatMap(r => r.columns(4, "normal"));
  const grid = cells.map((r, i) => place(chip(i.toString(2).padStart(4, "0"), { size: 44, color: "cyan" }), r));
  const occupants = cells.map(r => {
    const [x, y] = r.point("center");
    return dot(9, "blue").moveTo([x - 17, y + 42]);
  });
  const [into, out] = decoder.rows(2, "normal");
  const destination = place(label("Decoder reads one code"), into);
  const extra = place(chip("history 17", { color: "yellow", size: 40 }), out);
  const other = dot(9, "yellow").moveTo(out.point("center"));
  const choice = cells[5].point("center");
  const bits = place(mono("Two coordinates × two bits = four bits"), top);
  const finalState = place(mono("Final state  [" + states[3].map(v => v.toFixed(3)).join(", ") + "]"), top);
  const history = EVENTS.map((name, i) => place(chip(name), codes.columns(3, "normal")[i]));
  const readState = place(label("Decoder reads the final state"), decoder);
  const collision = place(label("Two histories can give the decoder exactly the same input."), footer);
  const positions = top.columns(8, "normal");
  const tokens = positions.map((r, j) => place(chip(String(j + 1), { size: 42 }), r));
  const chain = positions.slice(1).map((r, i) => {
    const a = positions[i].point("center"), b = r.point("center");
    return arrow([a[0] + 52, a[1]], [b[0] - 52, b[1]], { stroke: "cyan", width: 4, pad: 0 });
  });
  const current = dot(10, "yellow").moveTo(positions[0].point("bottom"));
  const info = place(label("4,096 supplied positions → 4,096 dependent state updates"), main);
  const steps = place(note("1 to 4,096 crosses 4,095 links"), footer);
  const [mask, notes] = main.columns([1, 1.3], "wide");
  const [keys, ...maskRows] = mask.rows(9, "tight");
  const gridCols = r => r.columns([1.15, 1, 1, 1, 1, 1, 1, 1, 1], "tight");
  const keyLabels = gridCols(keys).map((cell, j) => place(note(j ? String(j) : "key"), cell));
  const queries = maskRows.map((r, i) => place(note("q" + (i + 1)), gridCols(r)[0]));
  const squares = maskRows.map((r, i) => gridCols(r).slice(1).map((cell, j) => {
    const size = Math.min(cell.width, cell.height);
    return place(rect(size, size, { fill: j <= i ? "cyan" : "surface", stroke: "dim", width: 2 }), cell);
  }));
  const [meaning, path, count] = notes.rows(3, "tight");
  const maskLabel = place(label("Query at row i reads keys 1 through i."), meaning);
  const direct = place(label("Query 8 reads key 1 in this layer.", { color: "yellow" }), path);
  const pairs = place(mono("1 + 2 + … + 8 = 36 allowed pairs"), count);
  const linkCell = gridCols(maskRows[7])[1];
  const witness = place(dot(11, "yellow"), linkCell);
  const equation = place(mono("softmax(QKᵀ / √dₖ + mask) V", { size: 45 }), footer);
  const costs = place(mono("Recurrence   O(Td²)        Full attention   O(Td² + T²d)", { size: 40 }), footer);
  const scan = place(label("Selective scan can combine segments during training."), path);
  const attention = place(label("Eight supplied positions in one causal layer"), top);
  const heading = title(s, c);
  s.add(finalState, history, readState);
  c.swap("quantize-context", [finalState, history, readState], [destination, bits, grid]);
  c.show("codes-occupied", occupants, { stagger: true });
  c.show("compression-question", extra);
  c.hide("compression-collision", extra);
  c.on("compression-collision", () => {
    s.add(other);
    s.play(to(other, n => n.moveTo([choice[0] + 17, choice[1] + 42])), { duration: 0.85 });
  });
  c.show("collision-result", collision);
  c.swapAll("compression-attention-1", [tokens, chain, current], { keep: heading });
  c.on("trace-relays", () => {
    for (const position of positions.slice(1)) s.play(to(current, n => n.moveTo(position.point("bottom"))), { duration: 0.28 });
  });
  c.show("serial-relay", [info, steps]);
  c.swap("attention-mask", [current, chain, info, steps, tokens], [attention, keyLabels, queries, squares, maskLabel, equation]);
  c.show("attention-direct", [witness, direct]);
  c.show("attention-pairs", pairs);
  c.swap("complexity-curves", equation, costs);
  c.swap("scan-recurrence", direct, scan);
}
