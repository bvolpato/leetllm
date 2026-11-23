import { assertEqual, lanes, place, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame } from '../parts.mjs';
export default function latency(s, c) {
  const f = frame(c);
  const [clockRegion, traceRegion] = f.body.columns([1.65, 1], 'loose');
  const flow = place(
    lanes(
      ['Authorization', 'Lexical', 'Dense', 'Fusion'],
      [
        { lane: 'Authorization', start: 0, end: 10, label: '10 ms', color: 'dim' },
        { lane: 'Lexical', start: 10, end: 22, label: '12 ms', color: 'cyan' },
        { lane: 'Dense', start: 10, end: 50, label: '40 ms', color: 'pink' },
        { lane: 'Fusion', start: 50, end: 58, label: '8 ms', color: 'yellow' },
      ],
      {
        width: clockRegion.width - 260,
        pitch: 100,
        domain: [0, 65],
        ticks: [0, 10, 22, 50, 58],
        size: 34,
        deadline: { at: 50, label: '50 ms request budget', drain: true },
      },
    ),
    clockRegion,
  );
  const fallback = place(
    label('Empty ≠ timed out · record degraded mode', { color: 'red' }),
    f.foot,
  );
  const result = place(
    mono(`${10 + Math.max(12, 40) + 8} ms > 50 ms`, { color: 'yellow' }),
    f.foot,
  );
  const trace = place(
    table(
      [
        { key: 'field', label: 'Request trace' },
        { key: 'value', label: 'Value', sample: 'complete: 0' },
      ],
      [
        { id: 'lane', field: 'lane depth', value: '≤ 2 per lane' },
        { id: 'fused', field: 'fused retained', value: '≤ 3 IDs' },
        { id: 'rerank', field: 'reranker input', value: '≤ 3 reads' },
        { id: 'context', field: 'final context', value: '≤ 1 passage' },
        { id: 'lexical', field: 'lexical state', value: 'pending' },
        { id: 'mode', field: 'mode', value: 'normal' },
        { id: 'ids', field: 'IDs / ranks', value: 'captured' },
        { id: 'versions', field: 'lane / index', value: 'v1 / v1' },
        { id: 'date', field: 'effective date', value: 'captured' },
        { id: 'grants', field: 'grant revision', value: 'captured' },
        { id: 'timing', field: 'time / deadline', value: 'pending' },
      ],
      { width: traceRegion.width, size: 34, leading: 1.42 },
    ),
    traceRegion,
  );
  const traceNote = place(label('Access-controlled request trace'), f.foot);
  assertEqual(10 + Math.max(12, 40) + 8, 58, 'parallel critical path');
  const clock = place(label('50 ms request deadline', { color: 'yellow' }), f.foot);
  s.add(f.title, trace);
  c.take(f.shelf.nodes);
  for (const [cue, id] of [
    ['budget-lane', 'lane'],
    ['budget-fused', 'fused'],
    ['budget-rerank', 'rerank'],
    ['budget-context', 'context'],
  ])
    c.on(cue, () => s.play(trace.light(id)));
  c.on('lane-empty', () =>
    s.play(trace.setCell('lexical', 'value', 'complete: 0'), trace.light('lexical')),
  );
  c.on('lane-timeout', () =>
    s.play(
      trace.setCell('lexical', 'value', 'timeout: ?'),
      trace.setCell('mode', 'value', 'degraded'),
      trace.light('mode'),
    ),
  );
  c.show('lane-timeout', fallback);
  c.show(1, flow);
  c.swap(1, fallback, clock);
  c.on('request-clock', () =>
    s.play(
      flow.advance(10, { duration: 0.9 }),
      trace.setCell('lexical', 'value', 'pending'),
      trace.setCell('mode', 'value', 'normal'),
      trace.light('timing'),
    ),
  );
  c.after('lexical-finish', () =>
    s.play(flow.advance(22, { duration: 0.45 }), trace.setCell('lexical', 'value', 'complete')),
  );
  c.after('dense-finish', () => s.play(flow.advance(50, { duration: 0.6 })));
  c.after('deadline-result', () => s.play(flow.advance(58, { duration: 1.1 })));
  c.swap('deadline-result', clock, result, { after: true });
  c.after('deadline-result', () => s.play(trace.setCell('timing', 'value', '58 / 50 ms')));
  c.swap(2, result, traceNote);
  for (const [cue, id] of [
    ['trace-ids', 'ids'],
    ['trace-versions', 'versions'],
    ['trace-date', 'date'],
    ['trace-grants', 'grants'],
    ['trace-budgets', 'lane'],
    ['trace-timing', 'timing'],
  ])
    c.on(cue, () => s.play(trace.light(id)));
}
