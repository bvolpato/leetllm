import { column, indicate, place, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { requestGraph, SIDE, returns, REWARD } from '../parts.mjs';
export default function bellman(s, c) {
  const b = requestGraph(s, { token: 'new' });
  const [rule, table, final] = SIDE.rows([2, 4, 2], 'loose');
  const [formulaArea, stateArea] = rule.rows(2, 'normal');
  const newState = place(note('Q(New request, action)', { color: 'cyan' }), stateArea);
  const evidenceState = place(note('Q(Evidence ready, action)', { color: 'green' }), stateArea);
  const formula = place(tex('Q(s,a)=\\mathbb E[r+\\gamma V(s\u2032)]', { size: 38 }), formulaArea);
  const [a, e, r] = table.rows(3, 'wide');
  const headings = [a, e, r].map((region, i) =>
    place(
      label(['Approve', 'Evidence', 'Review'][i], { color: ['pink', 'green', 'blue'][i] }),
      region.columns([2, 1], 'normal')[0],
      'left',
    ),
  );
  const values = [returns.approve, returns.evidence, returns.review].map((v, i) =>
    place(
      mono(String(v), { color: i === 1 ? 'yellow' : i === 0 ? 'red' : 'blue' }),
      [a, e, r][i].columns([2, 1], 'normal')[1],
    ),
  );
  const successorRows = [a, r];
  const successorHeadings = successorRows.map((region, i) =>
    place(
      label(['Approve now', 'Review'][i], { color: ['green', 'blue'][i] }),
      region.columns([2, 1], 'normal')[0],
      'left',
    ),
  );
  const successorValues = [REWARD.evidence, returns.evidenceReadyHuman].map((value, i) =>
    place(
      mono(String(value), { color: ['green', 'blue'][i] }),
      successorRows[i].columns([2, 1], 'normal')[1],
    ),
  );
  const options = place(
    column(
      [
        mono('70  >  -10 + 0.9 × 80'),
        mono(`70  >  ${returns.evidenceReadyHuman}`, { color: 'green' }),
        note('Policy: average. Optimal: maximum.'),
      ],
      { gap: 'normal' },
    ),
    final,
  );
  s.add(heading(c.title), b.nodes, formula, newState, headings);
  c.on('value', () => s.play(indicate(b.g.node('new'), { scale: 1 })));
  c.show('approve-value', values[0], { after: true });
  c.on('evidence-backup', () =>
    s.play(b.g.send('evidence', 'new', { color: 'green', duration: 1.4 })),
  );
  c.show('evidence-value', values[1], { after: true });
  c.on('review-backup', () => s.play(b.g.send('review', 'new', { color: 'blue', duration: 1.4 })));
  c.show('review-value', values[2], { after: true });
  c.on('greedy', () => s.play(indicate(values[1], { scale: 1 })));
  c.swap('successor', [newState, headings, values], [evidenceState, successorHeadings]);
  c.on('successor', () => s.play(b.g.go('evidence', { duration: 1.2 })));
  c.show('supported-approval', successorValues[0], { after: true });
  c.show('supported-approval', options.nodes[0], { after: true });
  c.show('successor-result', [options.nodes[1], successorValues[1]], { after: true });
  c.show('policy', options.nodes[2]);
  c.on('policy', () => s.play(indicate(formula, { scale: 1 })));
  c.on('terminal', () => s.play(indicate(b.g.node('closed'), { scale: 1 })));
  c.keep(b.nodes);
}
