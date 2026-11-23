import { assertEqual, column, graph, place, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { returns, REWARD } from '../parts.mjs';

export default function offPolicy(s, c) {
  const [trajectory, ledger, foot] = area.rows([4, 4, 1], 'loose');
  const [left, right] = trajectory.columns(2, 'wide');
  const startingCases = [left, right].map((box, i) =>
    place(
      column(
        [
          label(i ? '2 verified tickets' : '2 new tickets', { color: i ? 'green' : 'blue' }),
          mono(i ? 'Approve with proof' : 'Human review'),
          mono('Return  ' + (i ? REWARD.evidence : returns.review), {
            color: i ? 'green' : 'blue',
          }),
        ],
        { gap: 'normal' },
      ),
      box,
    ),
  );
  const mean = (2 * returns.review + 2 * REWARD.evidence) / 4;
  assertEqual(mean, 62, 'mean on four constructed starts');
  const constructed = place(label('Four constructed starting cases'), ledger);
  const oracle = place(mono('(2 × 54 + 2 × 70) / 4 = ' + mean, { color: 'yellow' }), ledger);
  const g = place(
    graph(
      [
        { id: 'new', label: 'New request', color: 'cyan', width: 290, height: 96 },
        { id: 'evidence', label: 'Verified proof', color: 'green', width: 300, height: 96 },
        { id: 'closed', label: 'Closed', color: 'dim', width: 245, height: 96 },
      ],
      [
        { from: 'new', to: 'evidence' },
        { from: 'evidence', to: 'closed' },
      ],
      {
        width: trajectory.width - 240,
        direction: 'LR',
        fit: true,
        token: 'new',
        tokenColor: 'cyan',
        labelSize: 44,
      },
    ),
    trajectory,
  );
  const tableOptions = { width: ledger.width - 40, size: 40, maxRows: 2 };
  const matrix = place(
    table(
      ['Logged move', 'Logger', 'New policy', 'Ratio'],
      [
        { id: 'ask', 'Logged move': 'Ask for proof', Logger: '…', 'New policy': '…', Ratio: '…' },
        {
          id: 'approve',
          'Logged move': 'Approve with proof',
          Logger: '…',
          'New policy': '…',
          Ratio: '…',
        },
      ],
      tableOptions,
    ),
    ledger,
  );
  const start = place(note('REQ-10234  ·  one observed episode'), foot);
  const logger = [0.5, 0.5],
    target = [0.8, 0.6];
  const ratios = target.map((p, i) => p / logger[i]);
  const weight = ratios[0] * ratios[1];
  assertEqual(weight, 1.92, 'weight for the entire trajectory');
  const partial = place(mono('First action  × ' + ratios[0], { color: 'yellow' }), foot);
  const prediction = place(
    label('How many times as likely is the entire path?', { color: 'yellow' }),
    foot,
  );
  const total = place(
    mono('Trajectory weight  ' + ratios.join(' × ') + ' = ' + weight, { color: 'yellow' }),
    foot,
  );
  const perReward = place(
    mono('First reward  × 1.6       Second reward  × 1.92', { color: 'yellow' }),
    foot,
  );

  const [historyTitle, countsArea, policiesArea, bottom] = area.rows([1, 2, 3, 1], 'normal');
  const title = place(label('A log of 50,000 routing decisions'), historyTitle);
  const [reviewCount, askCount] = countsArea
    .columns(2, 'loose')
    .map((cell, i) =>
      place(
        column(
          [
            note(i ? 'Asked for proof' : 'Sent to review'),
            mono(i ? '0' : '50,000', { size: 65, color: i ? 'green' : 'blue' }),
          ],
          { gap: 'normal' },
        ),
        cell,
      ),
    );
  const supports = place(
    table(
      ['Logging rule', 'P(ask)', 'Observed asks', 'Evidence for asking'],
      [
        {
          id: 'never',
          'Logging rule': 'Prohibited',
          'P(ask)': '0',
          'Observed asks': '0',
          'Evidence for asking': 'No support',
        },
        {
          id: 'rare',
          'Logging rule': '…',
          'P(ask)': '…',
          'Observed asks': '…',
          'Evidence for asking': '…',
        },
      ],
      { width: policiesArea.width, size: 38, maxRows: 2 },
    ),
    policiesArea,
  );
  const missing = place(
    label('Collect outcomes for asking, or supply and justify a model.'),
    bottom,
  );
  const privateInfo = place(
    label('Private warning → routing choice and eventual outcome', { color: 'yellow' }),
    bottom,
  );
  s.add(heading(c.title), constructed);
  c.show('starts', startingCases[0]);
  c.show('known', startingCases[1]);
  c.swap('oracle', constructed, oracle, { after: true });
  c.swap('logs', [startingCases, oracle], [g, matrix, start]);
  c.on('logged-ask', () => s.play(g.go('evidence', { duration: 0.55 })));
  c.after('path', () => s.play(g.go('closed', { duration: 0.55 })));
  for (const [i, id] of ['ask', 'approve'].entries()) {
    const suffix = i ? '-next' : '';
    c.after('behavior' + suffix, () => s.play(matrix.setCell(id, 'Logger', String(logger[i]))));
    c.after('target' + suffix, () => s.play(matrix.setCell(id, 'New policy', String(target[i]))));
    c.after(['first-ratio', 'second-ratio'][i], () =>
      s.play(matrix.setCell(id, 'Ratio', String(ratios[i]))),
    );
  }
  c.swap('first-ratio', start, partial, { after: true });
  c.swap('predict-weight', partial, prediction);
  c.swap('product', prediction, total, { after: true });
  c.swap('prefix', total, perReward);
  c.swap('other-log', [g, matrix, perReward], [title, reviewCount, askCount]);
  c.show('support', supports);
  c.after('shortage', () =>
    s.play(
      supports.setCell('rare', 'Logging rule', 'Rare'),
      supports.setCell('rare', 'P(ask)', '> 0'),
      supports.setCell('rare', 'Observed asks', '0'),
    ),
  );
  c.after('empty-log', () => s.play(supports.setCell('rare', 'Evidence for asking', 'No samples')));
  c.show('empty-log', missing, { after: true });
  c.swap('confounding', missing, privateInfo);
}
