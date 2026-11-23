import { dot, dynamic, line, numberLine, place } from 'vizmatic/stage';
import { area, mono } from '../kit-narrated.mjs';

export const [instrument, work] = area.rows([2, 3], 'wide');

const latency = (n) => Number(n.toFixed(2));

// Both ends refer to the same request and use the same time scale in every replay.
export function latencyStrip(s, prediction, measurement) {
  const model = s.value(prediction);
  const server = s.value(measurement);
  const ruler = place(
    numberLine({
      range: [0, 8],
      ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      length: 1360,
      labelSize: 34,
    }),
    instrument,
  );

  function endpoint(value, name, color, above) {
    return dynamic(() => {
      const [x, y] = ruler.world(value.value);
      return [
        line([x, y + (above ? -16 : 49)], [x, y + (above ? -58 : 72)], { stroke: color, width: 4 }),
        dot(11, color).moveTo([x, y - 12]),
        mono(name + '  ' + latency(value.value) + ' ms', { size: 44, color }).moveTo([
          x,
          y + (above ? -92 : 107),
        ]),
      ];
    });
  }

  const predicted = endpoint(model, 'model', 'blue', true);
  const observed = endpoint(server, 'server', 'pink', false);
  const gap = dynamic(() => {
    const [x, y] = ruler.world(model.value);
    const [end] = ruler.world(server.value);
    return line([x, y - 16], [end, y - 16], { stroke: 'yellow', width: 6 });
  });
  return {
    ruler,
    model,
    server,
    predicted,
    observed,
    gap,
    picture: [ruler, gap, predicted, observed],
  };
}
