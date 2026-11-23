import { pipeline, place, seq, table } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame, RUN } from '../parts.mjs';
import { versionedBundle } from '../../../films/production-retrieval/model.mjs';
export default function traceAndDiagnose(s, c) {
  const f = evidenceFrame(c);
  const [recordRoom, pathRoom] = f.work.rows([5, 3], 'wide');
  const trace = place(
    table(
      ['field', { key: 'value', marks: true, sample: 'eu-access/2026-04-01' }],
      [
        { id: 'caller', field: 'caller scope', value: RUN.caller.id + ' / EU' },
        { id: 'index', field: 'pinned index', value: versionedBundle().bundle.childIndex },
        { id: 'candidate', field: 'candidate', value: RUN.hits[0].record.id },
        { id: 'parent', field: 'parent', value: RUN.packed[0].parentId },
        { id: 'context', field: 'context', value: 'E1 · complete rule' },
        { id: 'claim', field: 'answer', value: RUN.answer.decision },
      ],
      { width: f.work.width, size: 29, leading: 1.7 },
    ),
    recordRoom,
  );
  const flow = place(
    pipeline(['Candidates', 'Parent', 'Context', 'Claim'], {
      width: f.work.width,
      size: 31,
      gates: true,
    }),
    pathRoom,
  );
  const inspect = place(
    label('Locate the broken promise before changing the model', { color: 'yellow' }),
    f.foot,
  );
  s.add(heading(c.title), f.nodes, trace, flow, inspect);
  carryIdentity(c, f);
  c.on('trace-request', () =>
    s.play(
      seq(
        flow.put({ id: 'request', color: 'blue' }, { duration: 0.4 }),
        flow.move('request', 'Claim', { duration: 1.2 }),
      ),
    ),
  );
  c.on('candidate-miss', () =>
    s.play(
      trace.setCell('parent', 'value', { value: 'not resolved', state: 'skip' }),
      trace.setCell('context', 'value', { value: 'not packed', state: 'skip' }),
      trace.setCell('claim', 'value', { value: 'not released', state: 'skip' }),
      trace.setCell('candidate', 'value', { value: 'missing rule', state: 'fail' }),
      seq(
        flow.move('request', 'Candidates', { duration: 0.8 }),
        flow.stop('request', { duration: 0.4 }),
      ),
    ),
  );
  c.on('parent-miss', () =>
    s.play(
      trace.setCell('candidate', 'value', { value: RUN.hits[0].record.id, state: 'pass' }),
      trace.setCell('parent', 'value', { value: 'missing parent', state: 'fail' }),
      seq(
        flow.pass('request', { duration: 0.3 }),
        flow.move('request', 'Parent', { duration: 0.7 }),
        flow.stop('request', { duration: 0.4 }),
      ),
    ),
  );
  c.on('replay-context', () =>
    s.play(
      trace.setCell('parent', 'value', { value: RUN.packed[0].parentId, state: 'pass' }),
      trace.setCell('context', 'value', { value: 'E1 · complete rule', state: 'pass' }),
      trace.setCell('claim', 'value', { value: 'invented limit', state: 'fail' }),
      seq(
        flow.pass('request', { duration: 0.3 }),
        flow.move('request', 'Claim', { duration: 0.9 }),
        flow.stop('request', { duration: 0.4 }),
      ),
    ),
  );
  c.clear(
    flow.items.map((n) => n.content),
    0.8,
    0.01,
  );
  c.clear(flow.rails, 0.7, 0.2);
}
