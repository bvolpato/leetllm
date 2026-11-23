import { dynamic, group, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame, durationStrip, REQUEST_X, REQUEST_W } from '../parts.mjs';

export default function (s, c) {
  const f = frame(c);
  const [header, travel, weightsBand, ruler] = f.body.rows([0.7, 2.3, 0.8, 2.5], 'normal');
  const columns = travel.columns(2, 'wide');
  const headers = header.columns(2, 'wide');
  const weights = REQUEST_W.map((row) => row[0]);
  const request = REQUEST_X[1];
  const swap = s.value(0),
    first = s.value(0),
    second = s.value(0),
    order = s.value(0);
  const products = () =>
    weights.map((w, i) => request[order.value ? 1 - i : i] * w * (i ? second.value : first.value));
  const cards = request.map((v, i) =>
    dynamic(() => {
      const from = columns[i],
        to = columns[1 - i];
      const x = from.cx + (to.cx - from.cx) * swap.value;
      const y = travel.cy + (i ? 1 : -1) * travel.height * 0.29 * Math.sin(Math.PI * swap.value);
      const color = i ? 'pink' : 'blue';
      return group(
        rect(from.width * 0.6, travel.height * 0.34, {
          fill: 'surface',
          stroke: color,
          radius: 9,
        }).moveTo([x, y]),
        label(i ? v + ' second in queue' : v + ' prompt blocks', { size: 42, color }).moveTo([
          x,
          y,
        ]),
      );
    }),
  );
  const coefficients = weightsBand
    .columns(2, 'wide')
    .map((r, i) =>
      place(
        mono(
          i ? '× ' + weights[i] + ' s / queue second' : '× ' + weights[i] + ' s / prompt block',
          { size: 37 },
        ),
        r,
      ),
    );
  const strip = durationStrip(ruler, products, 8, () =>
    order.value ? ['pink', 'blue'] : ['blue', 'pink'],
  );
  const originalTime = request.reduce((n, v, i) => n + v * weights[i], 0);
  const reference = strip.marker(originalTime);
  const question = place(
    label('Original time: ' + originalTime + ' s. What will the new client report?', {
      color: 'yellow',
    }),
    f.foot,
  );
  const good = place(mono('Request B  →  ' + originalTime + ' s', { color: 'cyan' }), f.foot);
  const bad = place(
    mono('Request B  →  ' + request.reduce((n, v, i) => n + v * weights[1 - i], 0) + ' s', {
      color: 'yellow',
    }),
    f.foot,
  );
  s.add(
    f.title,
    headers.map((r, i) => place(note('payload slot ' + i), r)),
    cards,
    coefficients,
    strip.scale,
  );
  c.show('latency-prompt', strip.contributions);
  c.after('latency-prompt', () => s.play(first.to(1, { duration: 0.55 })));
  c.after('latency-queue', () => s.play(second.to(1, { duration: 0.55 })));
  c.show('latency-sum', good, { after: true });
  c.show('latency-sum', reference, { after: true });
  c.swap('latency-swap', good, question);
  c.hide('latency-swap', strip.contributions, { fade: 0.12 });
  c.on('latency-swap', () => s.play(swap.to(1, { duration: 1.4 })));
  c.after('latency-swapped', () => order.set(1));
  c.show('latency-swapped', strip.contributions, { after: true });
  c.swap('latency-swapped', question, bad, { after: true });
  c.hide('latency-restore', [bad, strip.contributions], { fade: 0.12 });
  c.on('latency-restore', () => s.play(swap.to(0, { duration: 1.4 })));
  c.after('latency-restore', () => order.set(0));
  c.show('latency-restore', [good, strip.contributions], { after: true });
}
