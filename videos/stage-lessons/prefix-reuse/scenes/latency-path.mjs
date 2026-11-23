import { assertEqual, dynamic, line, place, row } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { board, body, fmt, gauge, readings } from '../parts.mjs';

export default function latencyPath(s, c) {
  const cold = 1220,
    warm = 170,
    gen = 880,
    base = 20,
    wait = 1200;
  const firstCold = cold + base,
    firstWarm = warm + wait,
    max = firstWarm + gen;
  assertEqual(max, 2250, 'Warm completion includes the queue and the remaining generation.');
  board(s, c, 'Which route delivers the first token sooner?', 'Illustrative clocks · milliseconds');
  const [key, a, b] = body.rows([1, 2, 2], 'normal');
  s.add(
    place(
      row(
        [
          label('Queue (dashed)', { color: 'pink' }),
          label('Through first token', { color: 'blue' }),
          label('Remaining generation', { color: 'cyan' }),
        ],
        { gap: 'loose' },
      ),
      key,
    ),
  );
  const timers = [a, b].map((r, i) =>
    gauge(
      r,
      i ? 'Warm' : 'Cold',
      [
        ['queue', 0, 'pink'],
        ['work', 0, 'blue'],
        ['decode', 0, 'cyan'],
      ],
      max,
      { height: 86 },
    ),
  );
  s.add(timers.map((g) => g.nodes));
  const waits = timers.map(() => s.value(0));
  timers.forEach(({ bar }, i) => {
    const bounds = bar.region();
    s.add(
      dynamic(() => {
        const width = (bounds.width * waits[i].value) / max;
        if (width < 8) return [];
        return line([bounds.left + 4, bounds.cy], [bounds.left + width - 4, bounds.cy], {
          stroke: 'bg',
          width: 5,
          dash: [14, 12],
        });
      }),
    );
  });
  const [slow, fast] = timers.map((g) => g.bar);
  c.after('clock-work', () => s.play(slow.resize('work', cold)));
  c.after('clock-warm', () => s.play(fast.resize('work', warm)));
  c.after('clock-decode', () => s.play(...timers.map((g) => g.bar.resize('decode', gen))));
  c.after('clock-queue', () =>
    s.play(...timers.map((g) => g.bar.resize('queue', base)), ...waits.map((v) => v.to(base)), {
      duration: 0.65,
    }),
  );
  c.on('clock-change', () =>
    s.play(fast.resize('queue', wait), waits[1].to(wait), { duration: 2.3 }),
  );
  readings(s, c, 'Compare the same prompt and output workload.', [
    [
      'clock-warm',
      'Through first token · ' + fmt(cold) + ' ms cold   /   ' + fmt(warm) + ' ms warm',
    ],
    [
      'clock-first',
      'First token · ' + fmt(firstCold) + ' ms cold   /   ' + fmt(warm + base) + ' ms warm',
      'yellow',
      'clock-change',
    ],
    ['clock-change', 'Only the warm queue changes.', 'pink'],
    [
      'clock-arrival',
      'First token · ' + fmt(firstCold) + ' ms cold   /   ' + fmt(firstWarm) + ' ms warm',
      'pink',
    ],
    ['clock-saving', 'Saved computation · ' + fmt(cold - warm) + ' ms', 'green'],
    [
      'clock-total',
      'Completion · ' + fmt(firstCold + gen) + ' ms cold   /   ' + fmt(max) + ' ms warm',
    ],
    ['clock-path', 'Measure queue, processing, and transfer at the same endpoints.'],
  ]);
}
