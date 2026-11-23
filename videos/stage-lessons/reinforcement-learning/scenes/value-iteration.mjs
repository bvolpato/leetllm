import { column, indicate, place, table, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { requestGraph, SIDE, valueIteration, REWARD, gamma, returns } from '../parts.mjs';
export default function valueIterationScene(s, c) {
  const b = requestGraph(s, { token: 'evidence' });
  const sweeps = valueIteration(3);
  const [top, mid, foot] = SIDE.rows([2, 4, 2], 'loose');
  const sweep = place(label('Sweep 0', { color: 'yellow' }), top);
  const sweep1 = place(label('Sweep 1', { color: 'yellow' }), top);
  const sweep2 = place(label('Sweep 2', { color: 'yellow' }), top);
  const sweep3 = place(label('Sweep 3', { color: 'yellow' }), top);
  const fixed = place(label('Fixed policy', { color: 'blue' }), top);
  const improved = place(label('Improved policy', { color: 'green' }), top);
  const actions = place(
    table(
      ['Action', { key: 'Backup', sample: '-18 + 0.9 × 80' }, { key: 'Q', sample: '-120' }],
      [
        { id: 'approve', Action: 'Approve', Backup: String(REWARD.approve), Q: '…' },
        { id: 'evidence', Action: 'Evidence', Backup: String(REWARD.ask) + ' + …', Q: '…' },
        { id: 'review', Action: 'Review', Backup: String(REWARD.reviewCost) + ' + …', Q: '…' },
      ],
      { width: mid.width, size: 34, maxRows: 3 },
    ),
    mid,
  );
  const comparison = place(note('Q = immediate cost + discounted successor'), foot);
  const route = (name, value, color) =>
    place(
      column(
        [
          label('New ticket  →  ' + name, { size: 36, color }),
          mono('Starting value  ' + value, { size: 36, color }),
          note('Approve once proof is verified.'),
        ],
        { gap: 'normal' },
      ),
      mid,
    );
  const reviewRule = route('review', '?', 'blue');
  const evaluated = route('review', returns.review, 'blue');
  const askRule = route('ask', returns.evidence, 'green');
  const contraction = place(
    column(
      [
        tex('\\lVert TV-TW\\rVert_\\infty \\leq \\gamma\\lVert V-W\\rVert_\\infty', { size: 34 }),
        note('Unique value; actions can tie.'),
      ],
      { gap: 'wide' },
    ),
    foot,
  );
  s.add(heading(c.title), sweep, actions, comparison);
  c.take(b.nodes);
  c.on('zero', () =>
    s.play(
      ...['new', 'evidence', 'review', 'closed'].map((id) =>
        b.g.setValue(id, '0', { duration: 0.5 }),
      ),
    ),
  );
  c.swap('first', sweep, sweep1);
  c.after('immediate', () =>
    s.play(
      actions.setCell('approve', 'Q', String(REWARD.approve)),
      actions.setCell('evidence', 'Q', String(REWARD.ask)),
      actions.setCell('review', 'Q', String(REWARD.reviewCost)),
    ),
  );
  c.after('immediate', () =>
    s.play(b.g.setValue('new', String(sweeps[0].new_request), { duration: 0.35 })),
  );
  c.after('successors', () =>
    s.play(
      b.g.setValue('evidence', String(sweeps[0].evidence_ready), { duration: 0.35 }),
      b.g.setValue('review', String(sweeps[0].review_queue), { duration: 0.35 }),
    ),
  );
  c.swap('second', sweep1, sweep2);
  c.on('second', () =>
    s.play(
      actions.setCell('evidence', 'Q', '…'),
      actions.setCell('review', 'Q', '…'),

      actions.setCell('evidence', 'Backup', REWARD.ask + ' + ' + gamma + ' × ' + REWARD.evidence),
      actions.setCell(
        'review',
        'Backup',
        REWARD.reviewCost + ' + ' + gamma + ' × ' + REWARD.review,
      ),
    ),
  );
  c.on('backward', () =>
    s.play(
      b.g.send('evidence', 'new', { color: 'green', duration: 1.4 }),
      b.g.send('review', 'new', { color: 'blue', duration: 1.4 }),
    ),
  );
  c.after('backward', () =>
    s.play(
      actions.setCell('evidence', 'Backup', REWARD.ask + ' + ' + gamma * REWARD.evidence),
      actions.setCell('review', 'Backup', REWARD.reviewCost + ' + ' + gamma * REWARD.review),
    ),
  );
  c.after('updated', () =>
    s.play(actions.setCell('evidence', 'Q', String(returns.evidence), { duration: 0.35 })),
  );
  c.after('review-result', () =>
    s.play(actions.setCell('review', 'Q', String(returns.review), { duration: 0.35 })),
  );
  c.on('best', () => s.play(actions.light('evidence')));
  c.after('best', () =>
    s.play(b.g.setValue('new', String(sweeps[1].new_request), { duration: 0.35 })),
  );
  c.swap('stable', sweep2, sweep3);
  c.swap('converges', comparison, contraction);
  c.on('contract', () => s.play(indicate(contraction.nodes[0], { scale: 1 })));
  c.swap('policy-iteration', [sweep3, actions, contraction], [fixed, reviewRule]);
  c.on('policy-iteration', () => s.play(b.g.setValue('new', '?', { duration: 0.3 })));
  c.swap('evaluate', reviewRule, evaluated, { after: true });
  c.after('evaluate', () =>
    s.play(
      b.g.setValue('new', String(returns.review), { duration: 0.3 }),
      b.g.pulseEdge('new', 'review', { color: 'blue', duration: 0.8 }),
    ),
  );
  c.swap('improve', [fixed, evaluated], [improved, askRule], { after: true });
  c.after('improve', () =>
    s.play(
      b.g.setValue('new', String(returns.evidence), { duration: 0.3 }),
      b.g.pulseEdge('new', 'evidence', { color: 'green', duration: 0.8 }),
    ),
  );
}
