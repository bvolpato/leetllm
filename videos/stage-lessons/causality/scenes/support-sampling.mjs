import { assertEqual, place, to, unitChart, delay } from 'vizmatic/stage';
import { captions, frame, pct, plot, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';

export default function supportSampling(s, c) {
  frame(
    s,
    'Two ways to get an empty control cell',
    'A separate ten-ticket batch',
    'Assignment probabilities',
  );
  const N = 10,
    p = 0.9,
    all = p ** N;
  assertEqual(pct(all, 1), '34.9%', 'Ten independent assistant assignments');
  const [top, bottom] = plot.rows(2);
  const batches = [top, bottom].map((band, i) => {
    const [head, grid] = band.rows([1, 2]);
    const tag = place(
      label(i ? 'Control sample' : 'Assistant sample', { color: i ? 'pink' : 'cyan' }),
      head,
      'left',
    );
    const strip = place(
      unitChart([{ count: N, color: i ? 'surface' : 'cyan' }], {
        rows: 1,
        cell: 70,
        gap: 16,
        shape: 'square',
      }),
      grid,
    );
    if (i) strip.marks.forEach((m) => m.stroke('dim', 2));
    return [tag, strip];
  });
  const [a, ctrl, chance] = record(s, [
    ['Assistant assignment', 'Always', 'cyan'],
    ['Control assignment', ''],
    ['Empty control cell', ''],
  ]);
  s.add(batches.flat());
  ctrl(c, 'zero', '0', true);
  chance(c, 'zero', 'Certain', true);
  c.on('sample', () =>
    s.play(...batches[0][1].marks.map((m) => to(m, (n) => n.opacity(0.18))), { duration: 0.4 }),
  );
  a(c, 'sample', pct(p), true);
  ctrl(c, 'sample', pct(1 - p), true);
  chance(c, 'sample', 'P(all assistant) = p¹⁰', true);
  c.after('probability', () =>
    s.play(
      ...batches[0][1].marks.map((m, i) =>
        delay(
          to(m, (n) => n.opacity(1), { duration: 0.25 }),
          i * 0.06,
        ),
      ),
    ),
  );
  chance(c, 'probability', pct(all, 1), true);
  captions(s, c, 'An outline has no observed outcome.', [
    ['zero', 'Under this policy a control observation is impossible.', true],
    ['sample', 'New independent batch: all ten assignments happen to select the assistant.', true],
    ['probability', 'A possible action can be absent from a finite sample.', true],
    ['arithmetic', 'Direct stratum arithmetic needs observed outcomes from both workflows.'],
  ]);
}
