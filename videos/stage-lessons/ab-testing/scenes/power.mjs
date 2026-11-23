import { assertEqual, column, indicate, place, row } from 'vizmatic/stage';
import { chip, heading, label, mono } from '../../kit-narrated.mjs';
import { FOOT, SIDE, experiment, interval } from '../parts.mjs';
import { projectedInterval } from '../../../films/ab-testing/model.mjs';
import { requiredN } from '../../../films/ab-testing/arithmetic.mjs';
export default function power(s, c) {
  const b = experiment(s, true);
  const [plot, inputs] = SIDE.rows([4, 2], 'wide');
  const start = projectedInterval(200);
  const ci = interval(s, plot, {
    min: -8,
    max: 16,
    ticks: 4,
    low: start.low * 100,
    high: start.high * 100,
  });
  const sizes = [200, 500, 2000];
  const readings = sizes.map((n) => place(mono(`interval: ${n} / arm`, { color: 'yellow' }), FOOT));
  const targetEffect = 0.02;
  const n = Math.round(requiredN(0.38, targetEffect));
  assertEqual(n, 9246, 'shortcut enrollment');
  const assumptions = place(
    row([chip('baseline 38%'), chip('target +2 pp'), chip('power 80%')], { gap: 'normal' }),
    inputs,
    'top',
  );
  const result = place(
    mono(`planning: ${n.toLocaleString('en-US')} / arm`, { color: 'yellow' }),
    inputs,
    'bottom',
  );
  s.add(heading('More traffic narrows uncertainty'), ci.frame, ci.band, assumptions);
  c.take(b.standing);
  c.onBeat(0, () => ci.spread.set(1));
  c.show('n200', readings[0]);
  for (const [i, cue] of ['n500', 'n2000'].entries()) {
    const next = projectedInterval(sizes[i + 1]);
    c.on(cue, () =>
      s.play(
        ci.low.to(next.low * 100, { duration: 1.4 }),
        ci.high.to(next.high * 100, { duration: 1.4 }),
      ),
    );
    c.swap(cue, readings[i], readings[i + 1], { after: true });
  }
  c.on('target', () => s.play(indicate(assumptions, { scale: 1 })));
  c.show('sample', result, { after: true });
  c.on('observed', () => s.play(indicate(ci.band, { scale: 1 })));
  c.on('smaller', () => s.play(indicate(result, { scale: 1 })));
  c.keep(b.standing);
}
