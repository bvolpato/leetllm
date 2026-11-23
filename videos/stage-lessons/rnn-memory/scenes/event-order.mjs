import { place, rect } from "vizmatic/stage";
import { area, chip, label, mono } from "../../kit-narrated.mjs";
import { EVENTS, incidentModel, inputs, memoryTape, scalar, title, TAPE, WORK } from "../parts.mjs";

export default function eventOrder(s, c) {
  const [ruleBand, forward, backward, footer] = area.rows([1, 3, 3, 1], "normal");
  const rule = place(mono("new state = 0.6 × old state + incoming signal"), ruleBand);
  const palette = ["blue", "pink", "green"];
  const model = incidentModel();
  function ledger(region, order, trace) {
    const [names, bars, sums] = region.rows([1, 1, 1], "tight");
    return order.map((event, t) => {
      const name = place(chip(EVENTS[event] + "  " + inputs[event].toFixed(1), { color: palette[event], size: 38 }), names.columns(3, "wide")[t]);
      const track = bars.columns(3, "wide")[t].inset("tight");
      const [left, y] = track.point("left");
      const scale = track.width / 1.6;
      let cursor = left;
      const segments = order.slice(0, t + 1).map((e, k) => {
        const width = inputs[e] * (0.6 ** (t - k)) * scale;
        const block = rect(width, 38, { fill: palette[e], stroke: "surface", width: 2 }).moveTo([cursor + width / 2, y]);
        cursor += width;
        return block;
      });
      const amount = place(mono(trace[t + 1].toFixed(3)), sums.columns(3, "wide")[t]);
      return { name, result: [...segments, amount] };
    });
  }
  const first = ledger(forward, [0, 1, 2], model.discount);
  const second = ledger(backward, [2, 1, 0], model.reverseDiscount);
  const question = place(label("Same three signals. Which order gives the larger state?"), footer);
  const sum = place(label("Sum of the inputs in either order = 2.3", { color: "dim" }), footer);
  const scalarTape = memoryTape(s, { words: EVENTS.map((e, i) => e + "  " + inputs[i]), region: TAPE, known: false });
  const [eqBand, workBand] = WORK.rows(2, "normal");
  const nonlinear = place(mono("h = tanh(0.8 × signal + 0.5 × previous h)"), eqBand);
  const substitution = place(mono("tanh(0.8 × 0.4 + 0.5 × 0.664) ≈ 0.573"), workBand);
  const [head, tail] = [first, second].map(run => run.map(step => step.name));
  const heading = title(s, c);
  s.add(head, rule);
  c.show("error-arrives", first[0].result);
  c.show("reproduction-arrives", first[1].result);
  c.show("rollback-arrives", first[2].result);
  c.show("reverse-order", tail);
  c.show("event-order-1", question);
  c.show("reverse-0", second[0].result);
  c.show("reverse-1", second[1].result);
  c.show("reverse-2", second[2].result);
  c.swap("order-sum", question, sum);
  c.swapAll("event-order-2", [scalarTape.nodes, nonlinear], { keep: heading });
  c.on("scalar-first", () => s.play(...scalarTape.set(0, [scalar[1]], 0.5)));
  c.show("scalar-second", substitution);
  c.on("scalar-second", () => s.play(...scalarTape.set(1, [scalar[2]], 0.5)));
  c.on("scalar-third", () => s.play(...scalarTape.set(2, [scalar[3]], 0.5)));
}
