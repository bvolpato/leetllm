import { assertEqual, dot, dynamic, line, linear, rect } from 'vizmatic/stage';
import { area, label, mono } from '../kit-narrated.mjs';
import {
  CALIBRATION_CLASS_ZERO,
  CONFIDENT,
  UNIFORM,
  classificationSet,
  correctedThreshold,
} from './parts.mjs';

export const cumulativeCut = correctedThreshold(CALIBRATION_CLASS_ZERO, 0.8);
const cases = [UNIFORM, CONFIDENT, [0.05, 0.55, 0.05, 0.35]];
const colors = ['blue', 'cyan', 'pink', 'green'];
const decimal = (v) => String(Number(v.toFixed(3)));
const examples = cases.map((probabilities) => {
  const order = probabilities.map((p, id) => ({ id, p })).sort((a, b) => b.p - a.p || a.id - b.id);
  let edge = 0;
  const pieces = order.map(({ id, p }) => {
    const left = edge;
    edge += Math.round(1000 * p);
    return { id, left: left / 1000, right: edge / 1000 };
  });
  assertEqual(edge, 1000, 'whole probability strip');
  const direct = classificationSet(probabilities, 'direct', cumulativeCut.threshold);
  const crossing = classificationSet(probabilities, 'crossing', cumulativeCut.threshold);
  return { probabilities, pieces, direct, crossing };
});
assertEqual(examples[2].direct.join(','), '1,3', 'inclusive direct set at an exact tie');
assertEqual(examples[2].crossing.join(','), '1,3,0', 'first strictly greater score');

const formatSet = (ids) => (ids.length ? '{ ' + ids.join(', ') + ' }' : '∅');

export function massBoard(s, { example = 0, count = 0, threshold = false, direct = false } = {}) {
  const [inputs, strip, ends, results] = area.inset('normal').rows([1.1, 1.9, 1.1, 1.1], 'wide');
  const columns = inputs.columns(4, 'wide');
  const resultSlots = results.columns(2, 'loose');
  const left = strip.left + 80;
  const width = strip.width - 160;
  const x = (fraction) => left + width * fraction;
  const y = strip.cy + 6;
  const row = s.value(example);
  const drawn = s.value(count);
  const cutoffOn = s.value(threshold ? 1 : 0);
  const baseOn = s.value(direct ? 1 : 0);
  const crossingOn = s.value(0);
  const askDirect = s.value(0);
  const askCrossing = s.value(0);
  const tracedEdge = s.value(0);

  const placeQuestion = (words, index) =>
    label(words, { size: 36 }).moveTo([resultSlots[index].cx, results.cy]);
  const drawing = dynamic(() => {
    const data = examples[row.value];
    const marks = data.probabilities.map((p, id) =>
      mono('Class ' + id + '   ' + decimal(p), { size: 37, color: colors[id] }).moveTo([
        columns[id].cx,
        inputs.cy,
      ]),
    );
    marks.push(
      line([left, y], [x(1), y], { stroke: 'dim', width: 3 }),
      mono('0', { size: 32, color: 'dim' }).moveTo([left, y + 70]),
      mono('1', { size: 32, color: 'dim' }).moveTo([x(1), y + 70]),
    );
    data.pieces.forEach(({ id, left: start, right }, rank) => {
      const fraction = Math.max(0, Math.min(1, drawn.value - rank));
      if (fraction <= 0) return;
      const end = start + (right - start) * fraction;
      const span = width * (end - start);
      marks.push(
        rect(Math.max(1, span), 66, { fill: colors[id], stroke: 'bg', width: 2 }).moveTo([
          x((start + end) / 2),
          y,
        ]),
      );
      const labelEnd =
        cutoffOn.value && start < cumulativeCut.threshold
          ? Math.min(end, cumulativeCut.threshold)
          : end;
      if (width * (labelEnd - start) > 190)
        marks.push(
          label('Class ' + id, { size: 38, color: 'bg' }).moveTo([x((start + labelEnd) / 2), y]),
        );
      if (fraction >= 1) {
        const cx = columns[rank].cx;
        marks.push(
          label('Class ' + id, { size: 36, color: colors[id] }).moveTo([cx, ends.cy - 32]),
          mono('end ' + decimal(right), { size: 38 }).moveTo([cx, ends.cy + 26]),
        );
      }
    });
    if (cutoffOn.value) {
      const cx = x(cumulativeCut.threshold);
      marks.push(
        line([cx, y - 57], [cx, y + 51], { stroke: 'yellow', width: 5 }),
        mono('q = ' + decimal(cumulativeCut.threshold), { color: 'yellow', size: 38 }).moveTo([
          cx,
          y - 93,
        ]),
      );
    }
    if (tracedEdge.value > 0) {
      const tip = x(tracedEdge.value);
      const cut = x(cumulativeCut.threshold);
      const top = y - 49;
      marks.push(line([left, top], [Math.min(tip, cut), top], { stroke: 'ink', width: 5 }));
      if (tip > cut) marks.push(line([cut, top], [tip, top], { stroke: 'yellow', width: 9 }));
      marks.push(dot(11, 'ink').at(tip, top));
    }
    if (askDirect.value && !baseOn.value) marks.push(placeQuestion('Which class IDs qualify?', 0));
    if (askCrossing.value && !crossingOn.value)
      marks.push(placeQuestion('Which class crosses first?', 1));
    if (baseOn.value || crossingOn.value) {
      for (const [i, visible, name, set] of [
        [0, baseOn.value, 'Direct set', data.direct],
        [1, crossingOn.value, 'Through first crossing', data.crossing],
      ]) {
        if (visible) {
          marks.push(
            label(name, { size: 34, color: 'dim' }).moveTo([resultSlots[i].cx, results.cy - 34]),
            mono(formatSet(set), { size: 51 }).moveTo([resultSlots[i].cx, results.cy + 29]),
          );
        }
      }
    }
    return marks;
  });
  function reset(index) {
    row.set(index);
    drawn.set(0);
    baseOn.set(0);
    crossingOn.set(0);
    askDirect.set(0);
    askCrossing.set(0);
    tracedEdge.set(0);
  }
  const extend = (n, duration = 0.8) => s.play(drawn.to(n, { duration }));
  function traceFirstEdge(duration) {
    const edge = examples[row.value].pieces[0].right;
    s.play(tracedEdge.to(edge, { duration, ease: linear }));
  }
  return {
    drawing,
    reset,
    extend,
    traceFirstEdge,
    cutoffOn,
    baseOn,
    crossingOn,
    askDirect,
    askCrossing,
  };
}
