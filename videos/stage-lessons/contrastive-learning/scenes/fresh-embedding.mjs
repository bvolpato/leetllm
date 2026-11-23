import { assertEqual, column, indicate, line, place } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { comparisonRow } from '../parts.mjs';
import { poolPicture, removeCopy } from '../pool.mjs';
import { shortlistMetrics } from '../../../films/contrastive-learning/arithmetic.mjs';

export default function freshEmbedding(s, c) {
  const scores = [0.65, 0.65, 0.05],
    tau = 0.15;
  const full = comparisonRow(scores, tau),
    masked = comparisonRow(scores, tau, 0, [true, false, true]);
  const p = poolPicture(
    'How do I change a flat tire?',
    ['A · wheel guide', 'B · mirror of A', 'C · route planner'],
    ['green', 'pink', 'blue'],
    scores,
    full,
    tau,
  );
  const before = p.strip(p.first, 'Target A · current training row', full);
  const working = p.strip(p.second, 'Working row', full);
  const after = p.strip(p.second, 'Target A · verified mirror excluded', masked);
  const ask = p.footer('Should B compete with A?', 'yellow');
  const answer = p.footer('Exclude the verified mirror.', 'green');
  const wrong = p.footer(
    'Before masking B: +' +
      full.gradients[1].toFixed(3) +
      ' score derivative    →    lower the mirror',
    'pink',
  );
  const solved = p.footer(
    'B: zero score derivative     ·     loss ' +
      full.loss.toFixed(5) +
      ' → ' +
      masked.loss.toFixed(5) +
      ' nats',
    'green',
  );
  const common = [p.header, p.inputs, p.weights, before.frame, before.pieces, before.result];
  const [premise, keys, firstRow, secondRow, result] = area.rows([1.35, 1, 2, 2, 1.4], 'normal');
  const allowed = ['Jack points', 'Lift diagram'],
    k = 2,
    floor = 0.75;
  const rankings = [
    ['Tire sizes', 'Jack points', 'Lift diagram'],
    ['Jack points', 'Tire sizes', 'Lift diagram'],
  ];
  const query = place(
    label('Held-out query    Where can I safely lift this car?', { color: 'cyan', size: 42 }),
    premise,
  );
  const criteria = place(
    note(
      'Judged relevant: Jack points + Lift diagram     ·     Cutoff: 2     ·     Recall floor: ' +
        floor,
      { size: 35 },
    ),
    keys,
  );
  const rows = [firstRow, secondRow].map((region, i) => {
    const [who, a, b, outside, metrics] = region.columns([1.15, 1.55, 1.55, 1.55, 1.3], 'normal');
    const regions = [a, b, outside],
      data = rankings[i];
    const m = shortlistMetrics(data, allowed, k);
    const docs = data.map((id, j) =>
      place(
        namedBox(id, {
          width: regions[j].width - 20,
          height: 90,
          size: 36,
          color: allowed.includes(id) ? 'green' : 'dim',
        }),
        regions[j],
      ),
    );
    const cutX = (b.right + outside.left) / 2;
    const cut = line([cutX, region.top + 10], [cutX, region.bottom - 10], {
      stroke: 'yellow',
      width: 4,
      dash: [9, 8],
    });
    const name = place(label(i ? 'Short index' : 'Control', { size: 34 }), who, 'left');
    const readout = place(
      column(
        [
          mono('RR  ' + m.rr.toFixed(2), { size: 34 }),
          mono('Recall ' + m.recall.toFixed(2), { size: 32 }),
        ],
        { gap: 'tight', align: 'left' },
      ),
      metrics,
    );
    return { inputs: [name, cut, docs], outside: docs[k], readout, m };
  });
  const decide = place(
    label('Does the short index clear the recall floor?', { color: 'yellow', size: 42 }),
    result,
  );
  const pass = rows[1].m.recall >= floor;
  const found = rankings[1].slice(0, k).filter((id) => allowed.includes(id)).length;
  const verdict = place(
    label(
      (pass ? 'Release' : 'Hold') +
        `    ·    Recall@${k} = ${found} / ${allowed.length} = ` +
        rows[1].m.recall.toFixed(2) +
        '    ·    floor ' +
        floor.toFixed(2),
      { color: pass ? 'green' : 'yellow', size: 42 },
    ),
    result,
  );
  assertEqual(masked.gradients[1], 0, 'masked mirror receives no direct score gradient');
  assertEqual(
    rows[0].m.rr < rows[1].m.rr && !pass,
    true,
    'better first rank still misses the floor',
  );
  s.add(heading(c.title), p.header, p.inputs);
  c.show('fresh-competition', [p.weights, before.frame, before.pieces, before.result]);
  c.show('fresh-ask', ask);
  c.swap('fresh-exclude', ask, answer, { after: true });
  c.show('fresh-exclude', [working.frame, working.pieces], { after: true });
  c.swap('fresh-direction', answer, wrong, { after: true });
  c.on('fresh-mask', () => removeCopy(s, working));
  c.swap('fresh-solved', working.frame[0], after.frame[0]);
  c.show('fresh-solved', after.result, { after: true });
  c.swap('fresh-solved', wrong, solved, { after: true });
  c.swap(
    'fresh-road-test',
    [
      common,
      working.frame.slice(1),
      working.pieces[0],
      working.pieces[2],
      after.frame[0],
      after.result,
      solved,
    ],
    [query, criteria, rows[0].inputs],
  );
  c.show('fresh-candidate', rows[1].inputs);
  c.show('fresh-gate', decide);
  c.show(
    'fresh-ranks',
    rows.map((r) => r.readout),
    { after: true },
  );
  c.swap('fresh-hold', decide, verdict, { after: true });
  c.on('fresh-outside', () => s.play(indicate(rows[1].outside, { scale: 1.06, duration: 1.2 })));
}
