import { place, indicate, boxOf, dynamic, dot } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { BODY, ruleBoard } from '../parts.mjs';
export default function rulebook(s, c) {
  const p = ruleBoard();
  const score = place(
    label(
      p.data.filter((r) => r.predicted === r.expected).length + ' / ' + p.data.length + ' correct',
      { color: 'yellow' },
    ),
    p.foot,
  );
  const boundary = place(
    label('More time leaves these conditions unchanged.', { color: 'yellow' }),
    p.foot,
  );
  const progress = p.data.map(() => s.value(0));
  const probes = dynamic(() =>
    p.data.flatMap((r, i) => {
      const v = progress[i].value;
      if (v <= 0 || v >= 1) return [];
      const port = ['latency', 'quality', 'access'].indexOf(r.expected);
      const from = boxOf(p.conditions.nodes[port]).point('right');
      const target = p.ledger.region('R' + i).point('left');
      return [
        dot(9, r.predicted === r.expected ? 'green' : 'red').moveTo([
          from[0] + 20 + (target[0] - from[0] - 40) * v,
          from[1] + (target[1] - from[1]) * v,
        ]),
      ];
    }),
  );
  s.add(heading(c.title), p.nodes, probes);
  c.on('rulebook-beat-1-focus-1', () =>
    s.play(indicate(p.conditions, { scale: 1, color: 'yellow' })),
  );
  c.after('rulebook-beat-2-focus-1', () =>
    s.play(
      ...p.data.flatMap((r, i) =>
        r.predicted === r.expected
          ? [
              p.ledger.setCell(
                'R' + i,
                'route',
                { value: r.predicted, state: 'pass' },
                { duration: 0.8 },
              ),
              progress[i].to(1, { duration: 0.8 }),
            ]
          : [],
      ),
    ),
  );
  c.after('rules-misses', () =>
    s.play(
      ...p.data.flatMap((r, i) =>
        r.predicted !== r.expected
          ? [
              p.ledger.setCell(
                'R' + i,
                'route',
                { value: 'manual review', state: 'fail' },
                { duration: 0.8 },
              ),
              progress[i].to(1, { duration: 0.8 }),
            ]
          : [],
      ),
    ),
  );
  c.show('rulebook-beat-3-focus-1', score, { after: true });
  c.swap('rulebook-beat-3-focus-2', score, boundary);
}
