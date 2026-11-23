import { column, place, connector, dot, indicate } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function ragStage(s, c) {
  const board = caseBoard();
  const [flow, checks] = MAIN.rows([3, 2], 'loose');
  const slots = flow.columns(3, 'loose');
  const stages = ['source P1', 'final context', 'answer'].map((name, i) => {
    const [head, body] = slots[i].rows([1, 3], 'wide');
    return {
      head: place(label(name, { color: 'dim' }), head),
      clause: place(
        chip('commander approval', { color: i === 2 ? 'blue' : 'cyan', size: 31 }),
        body,
      ),
      body,
    };
  });
  const wrong = place(chip('on-call engineer', { color: 'red' }), stages[2].body);
  const edges = [
    connector(stages[0].clause, stages[1].clause),
    connector(stages[1].clause, stages[2].clause),
  ];
  const results = [
    'missing final-context evidence',
    'generation / instruction failure',
    'source identity ≠ entailment',
  ].map((v) => place(label(v, { color: 'yellow', size: 36 }), FOOT));
  const citation = place(
    column(
      [
        chip('source ID: P1', { color: 'cyan' }),
        label('Approval is not required', { color: 'red', size: 34 }),
      ],
      { gap: 'wide' },
    ),
    checks,
  );
  const inspect = place(
    label('Inspect the final context, then the answer', { size: 34, color: 'dim' }),
    checks,
  );
  s.add(
    heading('Find the first missing fact'),
    stages.map((p) => [p.head, p.clause]),
    edges,
    inspect,
  );
  s.add(board.nodes);
  c.on('rag-stage-phase-0', () => s.play(edges[0].send(dot(10, 'cyan'), { duration: 1.2 })));
  c.hide('ba-rag-stage-drop', stages[1].clause);
  c.show('ba-rag-stage-drop', results[0], { after: true });
  c.on('rag-stage-phase-1', () =>
    s.play(indicate(stages[0].clause, { scale: 1, color: 'yellow' })),
  );
  c.show('ba-rag-stage-complete', stages[1].clause);
  c.hide('ba-rag-stage-complete', results[0]);
  c.swap('ba-rag-stage-engineer', stages[2].clause, wrong);
  c.show('generation-failure', results[1], { after: true });
  c.swap('rag-stage-phase-2', inspect, citation);
  c.swap('ba-rag-stage-citation', results[1], results[2]);
  c.keep(board.nodes);
}
