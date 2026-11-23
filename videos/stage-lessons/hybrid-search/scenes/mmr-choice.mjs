import {
  assertEqual,
  boxOf,
  column,
  dynamic,
  group,
  line,
  par,
  place,
  rect,
  seq,
  table,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame, libraryBook } from '../parts.mjs';
export default function mmr(s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([1, 2], 'loose');
  const [kept, passage] = left.rows([2, 1], 'normal');
  const slot = label('Next slot: ?', { color: 'yellow' });
  const selected = place(
    column(
      [label('Selected'), libraryBook('Key rule', 'green', { code: 'governing source' }), slot],
      { gap: 'normal' },
    ),
    kept,
  );
  const [bars, ledger] = right.rows([1.7, 1], 'normal');
  const lambda = 0.5;
  const copy = { relevance: 0.89, redundancy: 0.97 };
  const session = { relevance: 0.65, redundancy: 0.2 };
  const contributions = [
    lambda * copy.relevance,
    (1 - lambda) * copy.redundancy,
    lambda * session.relevance,
    (1 - lambda) * session.redundancy,
  ];
  const scores = [contributions[0] - contributions[1], contributions[2] - contributions[3]];
  const scoreText = scores.map((value) => value.toFixed(3).replace('-', '−'));
  const subtract = s.value(0),
    termsShown = s.value(0);
  const columns = bars.columns(2, 'loose');
  const titles = ['Near-copy', 'Session rule'].map((name, i) =>
    place(label(name), columns[i], 'top'),
  );
  const unit = (bars.height - 170) / 0.55;
  const zero = bars.bottom - 65;
  const expressions = [0, 1]
    .map((i) => contributions[i * 2].toFixed(3) + ' − ' + contributions[i * 2 + 1].toFixed(3))
    .map((words, i) =>
      place(mono(words, { size: 34 }), columns[i], 'top').at(
        columns[i].point('center')[0],
        bars.top + 75,
      ),
    );
  const penalties = dynamic(() =>
    group(
      ...columns.flatMap((region, i) => {
        const x = region.point('center')[0],
          r = contributions[i * 2],
          penalty = contributions[i * 2 + 1];
        const value = r - penalty * subtract.value;
        const nodes = [
          line([region.left + 35, zero], [region.right - 35, zero], { stroke: 'dim', width: 2 }),
        ];
        if (termsShown.value < 0.5) return nodes;
        if (Math.abs(value) > 0.0001)
          nodes.push(
            rect(140, Math.abs(value) * unit, {
              fill: value < 0 ? 'red' : 'blue',
              stroke: value < 0 ? 'red' : 'blue',
              width: 0,
            }).moveTo([x, zero - (value * unit) / 2]),
          );
        const remaining = penalty * (1 - subtract.value);
        if (remaining > 0.0001)
          nodes.push(
            rect(140, remaining * unit, { fill: 'red', stroke: 'red', width: 3 })
              .opacity(0.55)
              .moveTo([x, zero - (scores[i] + remaining / 2) * unit]),
          );
        if (subtract.value > 0.999)
          nodes.push(
            mono(scoreText[i], { color: 'yellow', size: 34 }).moveTo([
              x,
              zero - value * unit + (value < 0 ? 35 : -35),
            ]),
          );
        return nodes;
      }),
    ),
  );
  const tab = place(
    table(
      [
        { key: 'candidate', sample: 'Near-copy' },
        { key: 'relevance', label: 'query' },
        { key: 'redundancy', label: 'redundancy' },
        { key: 'score', sample: '−0.040' },
        { key: 'keep', sample: 'verify source' },
      ],
      [
        {
          id: 'copy',
          candidate: 'Near-copy',
          relevance: copy.relevance,
          redundancy: copy.redundancy,
          score: '?',
          keep: '?',
        },
        {
          id: 'session',
          candidate: 'Session',
          relevance: session.relevance,
          redundancy: session.redundancy,
          score: '?',
          keep: '?',
        },
      ],
      { width: right.width, size: 34, leading: 2 },
    ),
    ledger,
  );
  const second = label('Session rule', { color: 'yellow' }).moveTo(boxOf(slot).point('center'));
  const unused = label('Leave slot unused', { color: 'yellow' }).moveTo(
    boxOf(slot).point('center'),
  );
  const snippet = place(
    column(
      [
        note('From the session rule'),
        label('Idle browser sessions expire', { size: 33 }),
        label('after 30 days of inactivity.', { size: 33 }),
      ],
      { gap: 'tight' },
    ),
    passage,
  );
  const formula = place(mono('λ × query similarity − (1 − λ) × redundancy', { size: 34 }), f.foot);
  const half = place(
    mono('λ = 0.5 · weighted relevance − weighted redundancy', { size: 34, color: 'yellow' }),
    f.foot,
  );
  assertEqual(scores[0].toFixed(3), '-0.040', 'copy MMR');
  assertEqual(scores[1].toFixed(3), '0.225', 'session MMR');
  s.add(f.title, selected, titles, penalties, tab, formula);
  c.take(f.shelf.nodes);
  c.show('mmr-terms', expressions);
  c.swap('mmr-terms', formula, half);
  c.on('mmr-terms', () => s.play(termsShown.to(1, { duration: 0.1 }), tab.light(null, 'score')));
  c.after('mmr-answer', () =>
    s.play(
      seq(
        subtract.to(1, { duration: 1.1 }),
        par(
          tab.setCell('copy', 'score', scoreText[0]),
          tab.setCell('session', 'score', scoreText[1]),
        ),
      ),
    ),
  );
  c.after('mmr-select', () => s.play(tab.setCell('session', 'keep', 'selected')));
  c.swap('mmr-select', slot, second, { after: true });
  c.show('mmr-select', snippet, { after: true });
  c.on('mmr-authority', () =>
    s.play(
      tab.setCell('session', 'keep', 'irrelevant'),
      tab.setCell('copy', 'keep', 'verify source'),
    ),
  );
  c.swap('mmr-authority', second, unused, { after: true });
  c.hide('mmr-authority', snippet, { after: true });
  c.keep(f.shelf.nodes);
}
