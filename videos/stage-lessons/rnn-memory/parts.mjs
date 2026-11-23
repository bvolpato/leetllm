import {
  arrow, dynamic, indicate, place, rect,
} from "vizmatic/stage";
import { area, chip, heading, mono } from "../kit-narrated.mjs";
import { actorMemoryTrace, incidentModel } from "../../films/rnn-memory/model.mjs";
import { inputs, scalar, states, wx, wh, padded, cell, hidden } from "../../films/rnn-memory/fixtures.mjs";

export { actorMemoryTrace, incidentModel, inputs, scalar, states, wx, wh, padded, cell, hidden };
export const COLOR = Object.freeze({ input: "blue", hidden: "cyan", cell: "green", candidate: "pink", focus: "yellow", failure: "red" });
export const EVENTS = ["error", "reproduction", "rollback"];
export const [TAPE, WORK] = area.rows([4, 5], "normal");
export const STATE = {
  intro: "Swapping the two nouns reverses the actor and preserves every word count.",
  recurrence: "The two sentences end on opposite sides of the same zero line.",
  shared: "The cat and verb features occupy two coordinates updated by the same matrices at every word.",
  "event-order": "The scalar incident ends at scalar[3].",
  "vector-build": "The vector incident ends at states[3].",
  "action-head": "The rounded final vector produces the action probabilities.",
  "actual-credit": "Following the scalar incident backward gives 0.019517 at its initial state and 0.331003 for its shared weight.",
  gradients: "The two constant-factor paths have crossed twelve links on the same logarithmic scale.",
  "matrix-bound": "The counterexample vector eventually contracts.",
  truncation: "Forward states are unchanged and credit stops at the cut.",
  lstm: "Changing the output gate from 0.80 to 0.10 leaves the current cell at 0.8399.",
  "learned-lstm": "The constructed cell and hidden vectors match the fixture.",
  retention: "The protective direct path retains signal at the distant probe.",
  gru: "The blend ends close to the candidate when the keep fraction drops to five percent.",
  "learned-gru": "The identity matrix gives matching candidates. The mixing matrix produces opposite signs in the second hidden coordinate.",
  "parameter-geometry": "Parameters are reused and final-state axes retain their order.",
  padding: "The extra update changes the final state while leaving the predicted actor unchanged.",
  "batch-boundaries": "Valid prefixes are preserved and independent incidents reset.",
  "compression-attention": "The incident tape has direct causal reads and explicit pair work.",
  "earned-transfer": "Run A reads the measured zero and clears. Run B reads the second event and stays flagged for either filler.",
};

/** Signed amounts share one scale. A result readout remains unknown until its update runs. */
export function memoryTape(s, { words = EVENTS, values, dimensions = 1, max = 1, decimals = 3, nameColors = [], nameSize, region = TAPE, known = true } = {}) {
  const cells = region.columns(words.length, "wide");
  const amounts = words.map((_, i) => Array.from({ length: dimensions }, (_, j) => s.value(values?.[i]?.[j] ?? 0)));
  const revealed = words.map(() => s.value(known ? 1 : 0));
  const bands = cells.map(cell => cell.rows([1.4, 2.6, 1], "normal"));
  const names = words.map((word, i) => {
    const [nameBand] = bands[i];
    return place(chip(word, { color: nameColors[i] ?? "blue", ...(nameSize ? { size: nameSize } : {}) }), nameBand);
  });
  const frames = [], bars = [], readings = [];
  bands.forEach(([, body, readBand], i) => {
    const tracks = body.columns(dimensions, "normal");
    tracks.forEach((track, j) => {
      const center = track.point("center");
      const width = Math.min(72, track.width * 0.6);
      const scale = body.height * 0.46 / max;
      const frame = place(rect(width + 24, body.height, { stroke: "faint", fill: "surface", radius: 8 }), track);
      const bar = dynamic(() => {
        const v = amounts[i][j].value;
        const height = Math.max(1, Math.abs(v) * scale);
        return rect(width, height, { fill: j ? "pink" : "cyan", stroke: "transparent", radius: 3 })
          .moveTo([center[0], center[1] - Math.sign(v || 1) * height / 2]);
      });
      frames.push(frame);
      bars.push(bar);
    });
    const anchor = readBand.point("center");
    readings.push(dynamic(() => {
      const words = revealed[i].value < 0.5 ? "?" : amounts[i].map(v => v.value.toFixed(decimals)).join("  ");
      return mono(words, { size: dimensions > 1 ? 34 : 40, color: revealed[i].value < 0.5 ? "dim" : "ink" }).moveTo(anchor);
    }));
  });
  const wires = cells.slice(0, -1).map((r, i) => {
    const a = r.point("right"), b = cells[i + 1].point("left");
    return arrow(a, b, { stroke: "dim", width: 3, pad: 8 });
  });
  const nodes = [...frames, ...wires, ...names, ...bars, ...readings];
  const set = (i, vector, duration = 1) => {
    revealed[i].set(1);
    return vector.map((v, j) => amounts[i][j].to(v, { duration }));
  };
  return { nodes, names, frames, bars, wires, amounts, revealed, cells, set };
}

export function focus(s, nodes, color = "yellow") { s.play(indicate(nodes, { color, scale: 1, duration: 0.6 })); }
export function title(s, c) { const h = heading(c.title); s.add(h); return h; }
