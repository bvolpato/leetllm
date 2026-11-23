import { dot, dynamic, group, line, rect } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';

// The opening and the last request use the same time scale on both tracks.
export function deadlinePlot(s, { prediction, deadline, showDeadline = true }) {
  const plot = area.inset('wide');
  const left = plot.left + 225;
  const right = plot.right - 40;
  const x = (ms) => left + ((ms - 30) / 35) * (right - left);
  const modelY = area.cy - 46;
  const callerY = modelY + 145;
  const axisY = callerY + 100;
  const deadlineOn = s.value(showDeadline ? 1 : 0);
  const radius = s.value(0);
  const endpoints = s.value(0);
  const priorBand = s.value(0);
  const observed = s.value(prediction);
  const observedOn = s.value(0);
  const labelX = (area.left + left) / 2;
  const frame = group(
    label('Model', { size: 42, color: 'cyan' }).moveTo([labelX, modelY]),
    label('Caller', { size: 42, color: 'pink' }).moveTo([labelX, callerY]),
    ...[modelY, callerY, axisY].map((y) =>
      line([left, y], [right, y], { stroke: y === axisY ? 'dim' : 'faint', width: 3 }),
    ),
    ...Array.from({ length: 8 }, (_, i) => 30 + 5 * i).flatMap((ms) => [
      line([x(ms), axisY], [x(ms), axisY + 12], { stroke: 'dim', width: 2 }),
      mono(String(ms), { size: 30, color: 'dim' }).moveTo([x(ms), axisY + 39]),
    ]),
    label('Latency (ms)', { size: 30, color: 'dim' }).moveTo([labelX, axisY + 35]),
  );
  const marks = dynamic(() => {
    const low = prediction - radius.value;
    const high = prediction + radius.value;
    const marks = [];
    if (deadlineOn.value) {
      marks.push(
        line([left, callerY], [x(deadline), callerY], { stroke: 'pink', width: 8 }),
        line([x(deadline), callerY - 24], [x(deadline), callerY + 24], {
          stroke: 'pink',
          width: 6,
        }),
        mono('deadline ' + deadline, { size: 34, color: 'pink' }).moveTo([
          x(deadline),
          callerY + 52,
        ]),
      );
    }
    if (radius.value > 0) {
      const color = priorBand.value ? 'dim' : 'yellow';
      marks.push(
        priorBand.value
          ? line([x(low), modelY], [x(high), modelY], { stroke: color, dash: [10, 8], width: 5 })
          : rect(x(high) - x(low), 23, { fill: color, stroke: null }).moveTo([
              x(prediction),
              modelY,
            ]),
      );
      if (endpoints.value)
        marks.push(
          label('width ' + Math.round(2 * radius.value) + ' ms', { size: 29, color }).moveTo([
            labelX,
            modelY + 42,
          ]),
        );
      for (const ms of [low, high]) {
        marks.push(line([x(ms), modelY - 17], [x(ms), modelY + 17], { stroke: color, width: 5 }));
        if (endpoints.value)
          marks.push(mono(String(Math.round(ms)), { color }).moveTo([x(ms), modelY - 48]));
      }
    }
    marks.push(
      dot(15, 'cyan').moveTo([x(prediction), modelY]),
      mono('prediction ' + prediction, { size: 34, color: 'cyan' }).moveTo([
        x(prediction),
        modelY + 48,
      ]),
    );
    if (observedOn.value) {
      const px = x(observed.value);
      marks.push(
        line([px, modelY - 17], [px, callerY + 18], { stroke: 'ink', dash: [7, 7], width: 3 }),
        ...[modelY, callerY].map((y) => dot(10, 'ink').moveTo([px, y])),
        mono('arrival ' + observed.value, { size: 35 }).moveTo([px, modelY - 108]),
      );
    }
    return marks;
  });
  return { frame, marks, radius, endpoints, priorBand, observed, observedOn, deadlineOn };
}
