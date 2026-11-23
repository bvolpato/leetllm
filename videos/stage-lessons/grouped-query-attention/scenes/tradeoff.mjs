import { dynamic, line } from 'vizmatic/stage';
import {
  C,
  assertEqual,
  block,
  body,
  change,
  foot,
  mono,
  note,
  place,
  point,
  readout,
  start,
} from '../parts.mjs';

export default function tradeoff(s, c) {
  start(s, c.title);
  const weights = 48,
    originalKV = 16,
    groupedKV = originalKV / 8;
  const ms = (gb) => (1000 * gb) / 1000;
  const original = ms(weights + originalKV),
    grouped = ms(weights + groupedKV);
  assertEqual([original, grouped], [64, 50], 'read-only bounds in milliseconds');
  const [legend, before, after, scale] = body.rows([1, 3, 3, 1], 'normal');
  s.add(place(note('Read-only example · 1 TB/s = 1 GB/ms · decimal units'), legend, 'left'));
  const coordinates = (region) => region.columns([1, 5, 1], 'normal');
  for (const [i, row] of [before, after].entries()) {
    const [name, area, total] = coordinates(row);
    const [caption, track] = area.rows([1, 2], 'tight');
    const [label, values] = total.rows(2, 'tight');
    const nameNode = place(mono(i ? 'GQA' : 'MHA', { size: 49 }), name, 'left');
    if (i) c.show('switch', nameNode);
    else s.add(nameNode);
    const y = track.point('center')[1];
    const extent = (gb) => (track.width * ms(gb)) / original;
    const segment = (leftGB, widthGB, color) =>
      block(
        Math.max(0.01, extent(widthGB)),
        67,
        track.left + extent(leftGB + widthGB / 2),
        y,
        color,
      );
    const weight = segment(0, weights, C.key);
    const trackNode = block(track.width, 67, ...track.point('center'), 'grid');
    if (i) c.show('switch', [trackNode, weight]);
    else {
      s.add(trackNode);
      c.show('weights', weight);
    }
    const amount = s.value(0);
    s.add(dynamic(() => segment(weights, amount.value, C.value)));
    change(s, c, i ? 'answer' : 'cache', amount, i ? groupedKV : originalKV, true, 0.55);
    readout(
      s,
      c,
      caption,
      i
        ? [
            ['switch', '48 GB weights   +   (16 ÷ 8) GB of K/V'],
            ['answer', '48 GB weights   +   2 GB of K/V', 'ink', true],
          ]
        : [
            ['weights', '48 GB weights'],
            ['cache', '48 GB weights   +   16 GB of K/V'],
          ],
      { size: 39 },
    );
    readout(s, c, label, [[i ? 'ask' : 'ruler', 'Read time ≥']], { size: 34 });
    readout(
      s,
      c,
      values,
      i
        ? [
            ['ask', '? ms', C.result],
            ['answer', grouped + ' ms', C.result, true],
          ]
        : [['original', original + ' ms', C.result, true]],
      { size: 44 },
    );
  }
  const [, axis] = coordinates(scale);
  for (const value of [0, 16, 32, 48, 64]) {
    const [x, y] = point(axis, value / original, 0.12);
    s.add(
      line([x, y - 8], [x, y + 8], { stroke: 'dim', width: 3 }),
      mono(String(value), { size: 30 }).moveTo(point(axis, value / original, 0.68)),
    );
  }
  readout(
    s,
    c,
    foot,
    [
      [
        'ratio',
        'Ratio of read times:  64 / 50 = ' + (original / grouped).toFixed(2) + '×',
        C.result,
        true,
      ],
      ['measure', 'At the target workload, measure latency and completed tokens per second.'],
    ],
    { size: 39, align: 'center' },
  );
}
