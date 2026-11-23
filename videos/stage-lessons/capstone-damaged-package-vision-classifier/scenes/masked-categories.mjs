import { column, group, place, rect, to } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { visionMasked } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export default function scene(s, c) {
  const m = visionMasked();
  const [descriptions, bench, tally, math, result] = area.rows([2.3, 1.4, 1.4, 1.2, 1], 'wide');
  const names = ['Torn seam', 'Crushed corner', 'Other defect'];
  const columns = descriptions.columns(3, 'wide'),
    before = bench.columns(3, 'wide'),
    after = tally.columns(3, 'wide');
  const entries = m.targets.map((target, i) => {
    const slot = before[i],
      value = m.losses[i];
    const known = target !== null;
    const head = place(
      column(
        [
          label(names[i], { size: 45 }),
          mono('Logit ' + m.logits[i], { size: 37, color: 'blue' }),
          label(known ? (target ? 'Marked present' : 'Marked absent') : 'Unassessed', {
            size: 39,
            color: known ? 'ink' : 'dim',
          }),
        ],
        { gap: 'normal' },
      ),
      columns[i],
    );
    const frame = place(
      rect(slot.width * 0.86, slot.height, {
        fill: 'surface',
        stroke: known ? 'cyan' : 'grid',
        width: 3,
      }),
      slot,
    );
    const term = group(
      frame,
      caption(
        slot,
        known ? 'Loss  ' + value.toFixed(4) : 'Unknown target',
        known ? 'cyan' : 'dim',
        40,
      ),
    );
    return { head, term };
  });
  const count = caption(after[2], 'Observed terms  =  ' + m.observed, 'yellow', 38);
  const ask = caption(math, 'How many terms belong in the mean?', 'yellow');
  const mean = caption(
    math,
    '(' +
      m.losses
        .filter((v) => v !== null)
        .map((v) => v.toFixed(4))
        .join(' + ') +
      ') / ' +
      m.observed +
      '  ≈  ' +
      m.mean.toFixed(4),
    'yellow',
    45,
  );
  s.add(
    heading(c.title),
    entries.map((e) => e.head),
  );
  c.show(
    'terms',
    entries.map((e) => e.term),
    { after: true },
  );
  c.show('ask', ask);
  c.on('two', () =>
    s.play(
      ...entries
        .slice(0, m.observed)
        .map(({ term }, i) => to(term, (n) => place(n, after[i]), { duration: 0.75 })),
    ),
  );
  c.show('two', count, { after: true });
  c.swap('mean', ask, mean, { after: true });
  c.show(
    'gradients',
    caption(
      result,
      'Observed gradient  =  (p − target) / 2      •      Unassessed gradient  =  0',
      'ink',
      38,
    ),
    { after: true },
  );
}
