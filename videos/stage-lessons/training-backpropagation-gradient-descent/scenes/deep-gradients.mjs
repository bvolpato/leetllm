import {
  arrow,
  axes,
  boxOf,
  decimal,
  column,
  dot,
  dynamic,
  line,
  place,
  rect,
  row,
  steps,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { sampleModel } from '../../../films/training-backpropagation-gradient-descent/model.mjs';
export default function deepGradients(s, c) {
  const m = sampleModel('deep-gradients', { beat: 0, beatP: 0 }),
    n = sampleModel('deep-gradients', { beat: 1, beatP: 0 }).contractionSteps;
  const [body, foot] = area.rows([5, 1], 'wide');
  const [left, right] = body.columns(2, 'loose');
  const [a, b] = left.rows(2, 'wide');
  const contraction = s.value(0),
    expansion = s.value(0),
    scale = s.value(1);
  function chain(region, progress, factor, color) {
    const [head, marks] = region.rows([1, 4], 'normal');
    const title = place(
      note('Backward → ×' + factor + (factor > 1 ? ' · capped height' : ''), { color }),
      head,
    );
    const cells = marks.columns(n, 'normal');
    const bands = cells.map((r) => r.rows([1, 3, 1], 'tight'));
    const layers = bands.map((r, i) => place(note('L' + (n - i)), r[0]));
    const frames = bands.map((r) =>
      place(rect(r[1].width * 0.75, r[1].height, { stroke: 'grid', fill: 'surface' }), r[1]),
    );
    const magnitude = (i) => {
      const p = Math.min(1, Math.max(0, progress.value - i));
      return p > 0 ? factor ** i * (1 + (factor - 1) * p) : 0;
    };
    const bars = dynamic(() =>
      bands.map((r, i) => {
        const height = Math.max(2, Math.min(r[1].height * 0.95, r[1].height * 0.4 * magnitude(i)));
        return rect(r[1].width * 0.55, height, { fill: color, stroke: color }).moveTo(
          r[1].point('center'),
        );
      }),
    );
    const values = bands.map((r, i) =>
      dynamic(() =>
        mono(progress.value <= i ? '…' : magnitude(i).toFixed(3), { size: 34, color }).moveTo(
          r[2].point('center'),
        ),
      ),
    );
    const edges = frames.slice(0, -1).map((f, i) =>
      arrow(boxOf(f).point('right'), boxOf(frames[i + 1]).point('left'), {
        stroke: 'dim',
        pad: 3,
        width: 2,
      }),
    );
    const pulse = dynamic(() => {
      if (progress.value <= 0 || progress.value >= n) return [];
      const position = Math.max(0, progress.value - 1),
        i = Math.min(n - 2, Math.floor(position)),
        t = position - i;
      const a = boxOf(frames[i]).point('center'),
        b = boxOf(frames[i + 1]).point('center');
      return dot(8, 'yellow').moveTo([a[0] + (b[0] - a[0]) * t, a[1]]);
    });
    return [title, layers, frames, bars, values, edges, pulse];
  }
  const chains = [chain(a, contraction, 0.5, 'cyan'), chain(b, expansion, 1.5, 'red')];
  const [rh, rp, rf] = right.rows([1, 4, 1], 'normal');
  const title = place(label('Clip a finite gradient'), rh);
  const length = Math.min(rp.width, rp.height) * 0.85;
  const ax = place(
    axes({
      x: [0, 10],
      y: [0, 10],
      width: length,
      height: length,
      xStep: 5,
      yStep: 5,
      labelSize: 34,
      tips: false,
      grid: true,
    }),
    rp,
  );
  const vector = dynamic(() =>
    arrow(
      ax.world(0, 0),
      ax.world(m.currentVector[0] * scale.value, m.currentVector[1] * scale.value),
      { stroke: 'yellow', width: 7, pad: 0 },
    ),
  );
  const to = (x, y, color, width) =>
    arrow(ax.world(0, 0), ax.world(x, y), { stroke: color, width, pad: 0 });
  const [gx, gy] = m.currentVector;
  const cap = 5;
  const original = to(gx, gy, 'dim', 4);
  const capCurve = dynamic(() =>
    Array.from({ length: 40 }, (_, i) => {
      const point = (k) =>
        ax.world(cap * Math.cos((k * Math.PI) / 80), cap * Math.sin((k * Math.PI) / 80));
      return line(point(i), point(i + 1), { stroke: 'green', width: 3 });
    }),
  );
  const byValue = to(Math.min(gx, cap), Math.min(gy, cap), 'pink', 6);
  const lengthLabel = place(mono('(6, 8)    length 10', { size: 39 }), rf);
  const normLabel = place(mono('norm cap 5 → (3, 4)', { color: 'yellow', size: 39 }), rf);
  const compare = place(
    column(
      [
        mono('norm cap → (3, 4)', { size: 34, color: 'yellow' }),
        mono('value cap → (5, 5)', { size: 34, color: 'pink' }),
      ],
      { gap: 'tight' },
    ),
    rf,
  );
  const order = place(
    steps(['backward', 'unscale', 'clip', 'step'], { width: foot.width, current: 0, size: 34 }),
    foot,
  );
  s.add(heading(c.title), chains);
  c.on('deep-contract', () => s.play(contraction.to(n, { duration: 2.5 })));
  c.on('deep-expand', () => s.play(expansion.to(n, { duration: 2.5 })));
  c.show('deep-vector', [title, ax, original, vector, lengthLabel]);
  c.show('deep-cap', capCurve);
  c.on('deep-clip', () => s.play(scale.to(cap / Math.hypot(gx, gy), { duration: 1.3 })));
  c.swap('deep-clip', lengthLabel, normLabel, { after: true });
  c.show('deep-value', byValue);
  c.swap('deep-value', normLabel, compare);
  c.show('deep-order', order);
  c.on('deep-unscale', () => s.play(order.go(1)));
  c.on('deep-clip-stage', () => s.play(order.go(2)));
  c.on('deep-step', () => s.play(order.go(3)));
}
