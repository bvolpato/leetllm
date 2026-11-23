import { arrow, dynamic, line, place } from "vizmatic/stage";
import { area, label, mono } from "../../kit-narrated.mjs";
import { EVENTS, incidentModel, scalar, title } from "../parts.mjs";

export default function truncation(s, c) {
  const m = incidentModel();
  const [legend, t, a, b, footer] = area.rows([1, 1, 2, 2, 1], "normal");
  const bands = [t, a, b].map(r => r.columns([1.15, 1, 1, 1], "normal"));
  const headers = EVENTS.map((event, i) => place(label(event), bands[0][i + 1]));
  const labels = [place(label("Full history"), bands[1][0]), place(label("Detach after t₂"), bands[2][0])];
  const states = bands.slice(1).map(slots => scalar.slice(1).map((h, i) =>
    place(mono(h.toFixed(3), { size: 64, color: "cyan" }), slots[i + 1])));
  const derivatives = [m.inputGradient, [0, 0, m.inputGradient[2]]].map((values, row) => values.map((v, i) =>
    place(mono(v.toFixed(3), { size: 64, color: v === 0 ? "ink" : "pink" }), bands[row + 1][i + 1])));
  const x = (bands[2][2].point("right")[0] + bands[2][3].point("left")[0]) / 2;
  const [top, bottom] = [b.point("top")[1], b.point("bottom")[1]];
  const cut = line([x, top + 20], [x, bottom - 20], { stroke: "red", width: 6, dash: [12, 10] });
  const forward = place(label("Hidden state after each event", { color: "cyan" }), legend);
  const backward = place(label("Gradient of the final state with respect to each input", { color: "pink" }), legend);
  const pending = place(mono("?", { size: 64, color: "yellow" }), bands[2][3]);
  const q = place(label("Where will the lower run finish?"), footer);
  const carried = place(label("Both runs carry " + scalar[2].toFixed(3) + " into rollback."), footer);
  const param = place(mono("Shared weight derivative     " + m.weightGradient.toFixed(3) + "   →   " + m.weightTerms[2].toFixed(3)), footer);
  const [clipHead, figure, readout] = area.rows([1, 4, 1], "normal");
  const [gx, gy] = m.rawGradient;
  const region = figure.inset("loose");
  const [ox, oy] = region.point("left");
  const start = [ox + region.width * 0.32, oy - region.height * 0.27];
  const scale = Math.min(region.width * 0.45 / gx, region.height * 0.55 / -gy);
  const tip = k => [start[0] + gx * scale * k, start[1] - gy * scale * k];
  const norm = Math.hypot(gx, gy), ratio = s.value(1);
  const ghost = line(start, tip(1), { stroke: "dim", width: 5 });
  const vector = dynamic(() => arrow(start, tip(ratio.value), { stroke: "yellow", width: 8, pad: 0 }));
  const live = dynamic(() => mono("g = [" + (gx * ratio.value).toFixed(3) + ", " + (gy * ratio.value).toFixed(3) +
    "]       norm " + (norm * ratio.value).toFixed(3), { color: "yellow" }).moveTo(readout.point("center")));
  const clipping = place(label("Clip a finite gradient to a maximum norm of 5"), clipHead);
  const heading = title(s, c);
  s.add(forward, headers, labels, states[0], states[1].slice(0, 2), pending);
  c.show("detach-cut", [cut, q]);
  c.swap("detach-forward", [pending, q], [states[1][2], carried], { lead: 0 });
  c.swap("truncation-1", [forward, states, carried], [backward, derivatives[0]]);
  c.show("detach-earlier", derivatives[1][2]);
  c.show("cut-early-gradients", derivatives[1].slice(0, 2), { lead: 0 });
  c.show("detach-weight", param);
  c.swapAll("truncation-2", [clipping, ghost, vector, live], { keep: heading });
  c.on("clip-rescale", () => s.play(ratio.to(5 / norm, { duration: 1.35 })));
}
