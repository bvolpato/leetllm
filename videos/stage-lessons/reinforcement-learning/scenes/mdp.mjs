import { column, dynamic, indicate, place } from 'vizmatic/stage';
import { area, heading, label, mono, note, namedBox } from '../../kit-narrated.mjs';
import { requestGraph, SIDE, mdpBefore, mdpEvent, observeEnvironment } from '../parts.mjs';
export default function mdp(s, c) {
  const b = requestGraph(s);
  const [fields, loop] = SIDE.rows([3, 3, 2], 'loose');
  const wait = s.value(mdpBefore.elapsedWait);
  const record = place(
    column(
      [
        label('State', { color: 'cyan' }),
        namedBox('New request', { width: 480, height: 100, color: 'cyan' }),
        mono('Wait: 45 s'),
      ],
      { gap: 'normal' },
    ),
    fields,
  );
  const elapsed = dynamic(() =>
    mono(`Wait: ${Math.round(wait.value)} s`, { color: 'cyan' }).moveTo([
      record.nodes[2].get('x'),
      record.nodes[2].get('y'),
    ]),
  );
  const updated = namedBox('Evidence ready', { width: 480, height: 100, color: 'green' }).moveTo([
    record.nodes[1].get('x'),
    record.nodes[1].get('y'),
  ]);
  const environment = place(
    namedBox('Environment', {
      width: 490,
      height: 120,
      color: 'dim',
      sub: 'Requester · verifier · reviewer',
    }),
    loop,
  );
  const receipt = observeEnvironment(mdpBefore, 'ask evidence', mdpEvent);
  const [pairArea, verdictArea] = area.rows([5, 1], 'wide');
  const pair = pairArea.columns(2, 'wide').map((region, i) =>
    place(
      column(
        [
          label('Ticket ' + (i ? 'B' : 'A'), { color: 'cyan' }),
          namedBox('New request', { width: 480, height: 100, color: 'cyan' }),
          mono('Elapsed: ' + [mdpBefore.elapsedWait, receipt.elapsedWait][i] + ' s', {
            color: 'yellow',
          }),
        ],
        { gap: 'normal' },
      ),
      region,
    ),
  );
  const sameStage = place(
    note('If elapsed wait affects abandonment, the stage alone loses information.'),
    verdictArea,
  );
  const result = place(
    column(
      [
        label(`Receipt ${receipt.receipt}`, { color: 'cyan' }),
        mono(`Reward: ${receipt.reward}`),
        label('Evidence ready', { color: 'green' }),
      ],
      { gap: 'normal' },
    ),
    loop,
  );
  s.add(heading(c.title), b.nodes, record.nodes.slice(0, 2), elapsed, environment);
  c.on('different-state', () => s.play(indicate(b.g.node('evidence'), { scale: 1 })));
  c.on('markov', () => s.play(indicate(record.nodes[0], { scale: 1 })));
  c.on('wait-field', () => s.play(indicate(elapsed, { scale: 1 })));
  c.on('agent-action', () => s.play(b.g.pulseEdge('new', 'evidence', { duration: 1 })));
  c.on('observation', () => s.play(b.g.go('evidence', { duration: 0.8 })));
  c.swap('observation', environment, result, { after: true });
  c.swap('observation', record.nodes[1], updated, { after: true });
  c.after('observation', () => s.play(wait.to(receipt.elapsedWait, { duration: 1.2 })));
  c.hide('counterexample', b.nodes);
  c.swap('counterexample', [record.nodes[0], updated, elapsed, result], [...pair, sameStage]);
  c.on('partial', () =>
    s.play(
      indicate(
        pair.map((record) => record.nodes[2]),
        { scale: 1 },
      ),
    ),
  );
}
