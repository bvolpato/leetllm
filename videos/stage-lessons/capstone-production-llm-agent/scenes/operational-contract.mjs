import { circle, dot, line, place, to } from 'vizmatic/stage';
import { C, field, records } from '../parts.mjs';
import { transactionTrace } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function contract(s, c) {
  s.add(heading('What must survive the connection?'));
  const [matrix, work, foot] = area.rows([5, 3, 1], 'normal');
  const rows = records(
    matrix,
    [
      ['id', 'Local fixture', 0.45],
      ['needs', 'Production dependency', 0.55],
    ],
    [
      { id: 'Planner and policy' },
      { id: 'Ticket and account' },
      { id: 'Packet and decision' },
      { id: 'Local effect table' },
      { id: 'Step cap and episodes' },
    ],
    { size: 30 },
  );
  const lanes = work.columns(3, 'loose');
  const sites = ['Connection', 'Handler', 'Review store'].map((name, i) => {
    const [title, station, detail] = lanes[i].rows([1, 1, 1], 'tight');
    return {
      name: place(label(name, { color: i === 2 ? C.review : 'ink', size: 33 }), title),
      ring: place(
        circle(31, { fill: 'surface', stroke: i === 2 ? C.review : C.stored, width: 4 }),
        station,
      ),
      p: station.point('center'),
      detail,
    };
  });
  const wire = line(sites[0].p, sites[1].p, { width: 4, stroke: C.stored });
  const durable = line(sites[1].p, sites[2].p, { width: 3, stroke: 'grid', dash: [9, 7] });
  const live = dot(15, C.active).moveTo(sites[1].p);
  const recovered = dot(11, C.review).moveTo(sites[2].p);
  const retained = dot(17, C.review).moveTo(sites[2].p);
  const disconnected = place(note('Disconnected', { color: C.blocked }), sites[0].detail);
  const localWait = place(note('Local wait', { color: C.active }), sites[1].detail);
  const localGone = place(note('Wait lost', { color: C.blocked }), sites[1].detail);
  const [cancelSide, continueSide] = sites[1].detail.columns(2, 'normal');
  const cancelled = place(note('Cancelled', { color: C.blocked }), cancelSide);
  const continues = place(note('Running', { color: C.active }), continueSide);
  const either = note('or').moveTo(sites[1].p);
  const httpWait = dot(15, C.active).moveTo(sites[1].p);
  const secondCase = field(foot, 'Separate HTTP request', C.stored);
  const newHandler = place(note('New handler', { color: C.review }), sites[1].detail);
  const branchPoint = (region) => [region.point('center')[0], sites[1].p[1]];
  const stopped = place(label('×', { size: 46, color: C.blocked }), cancelSide).moveTo(
    branchPoint(cancelSide),
  );
  const running = dot(15, C.active).moveTo(branchPoint(continueSide));
  const saved = place(note('Pending packet', { color: C.review }), sites[2].detail);
  const host = field(foot, 'Local fixture requirements for a live service', C.stored);
  const lost = field(foot, 'Process loss', C.blocked);
  const recover = field(foot, 'A new handler can recover the retained review.', C.review);
  const reenter = field(foot, 'LangGraph resumes by restarting the interrupted node.', C.stored);
  const [headers, upper, lower] = area.rows([0.65, 3, 3], 'wide');
  const divide = (r) => r.columns([5, 1.4], 'wide');
  const [eventsHead, readerHead] = divide(headers);
  const headings = [
    heading('Does a rollback remove this restore?'),
    field(eventsHead, 'Order of events in SQLite', C.stored, 43),
    field(readerHead, 'Reader count', C.stored, 43),
  ];

  function attempt(region, title, events, trace) {
    const [eventsArea, result] = divide(region);
    const [name, stages, guide] = eventsArea.rows([1, 1.1, 1], 'tight');
    const stations = stages.columns(4, 'normal');
    const points = guide.columns(4, 'normal').map((slot) => slot.point('center'));
    const track = line(points[0], points[events.length - 1], { stroke: 'dim', width: 3 });
    const cursor = dot(15, C.active).moveTo(points[0]);
    const count = trace.at(-1).committed;
    return {
      face: [field(name, title, 'ink', 46), track,
        events.map((word, i) => place(mono(word, {
          size: 37, color: word === 'Failure' ? C.blocked : C.stored,
        }), stations[i]))],
      cursor, points,
      count: place(mono(String(count), { color: count ? C.effect : C.stored, size: 106 }), result),
    };
  }
  const committed = attempt(upper, 'Failure after commit', ['INSERT', 'COMMIT', 'Failure', 'ROLLBACK'], transactionTrace(false));
  const aborted = attempt(lower, 'Failure before commit', ['INSERT', 'Failure', 'ROLLBACK'], transactionTrace(true));
  const retainedEffect = dot(20, C.effect).moveTo(committed.points[1]);
  s.add(
    rows,
    durable,
    sites.map((x) => [x.name, x.ring]),
    host,
  );
  c.on('operational-contract-b1', () => s.play(rows.light(null, 'id')));
  const fill = (id, value) => s.play(rows.light(id), rows.setCell(id, 'needs', value));
  c.on('model-dependency', () => fill('Planner and policy', 'Validated adapter and quality tests'));
  c.on('principal-dependency', () => fill('Ticket and account', 'Authenticated, current grants'));
  c.on('operational-contract-b2', () =>
    fill('Packet and decision', 'Trusted review store and revocation'),
  );
  c.show('operational-contract-b2', [retained, saved]);
  c.show('process-loss', [live, localWait]);
  c.hide('lose-wait', [live, localWait], { lead: 0, fade: 0.1 });
  c.show('lose-wait', localGone, { lead: -0.1, fade: 0.1 });
  c.swap('lose-wait', host, lost);
  c.swap('disconnect', [localGone, lost], [httpWait, wire, secondCase], { lead: 0, fade: 0.12 });
  c.hide('cut-http', wire, { lead: 0, fade: 0.12 });
  c.show('cut-http', disconnected, { lead: 0 });
  c.hide('may-cancel', httpWait);
  c.show('may-cancel', [stopped, cancelled]);
  c.show('connection-only', [running, continues, either]);
  c.hide('independent-review', [stopped, cancelled, running, continues, either]);
  c.swap('independent-review', secondCase, recover);
  c.show('resume-handler', [newHandler, recovered], { lead: 0 });
  c.on('resume-handler', () => s.play(to(recovered, (n) => n.moveTo(sites[1].p))), 0.35);
  c.swap('restart-node', recover, reenter);
  c.on('operational-contract-b3', () => {
    fill('Local effect table', 'Destination key and reconciliation');
    fill('Step cap and episodes', 'Runtime limits and held-out tests');
  });
  c.swapAll('rollback-proof', [...headings, committed.face, committed.cursor, aborted.face]);
  const advance = (cue, row, i) => c.on(cue, () =>
    s.play(to(row.cursor, (n) => n.moveTo(row.points[i]), { duration: 0.4 })));
  advance('counterfactual-commit', committed, 1);
  c.show('counterfactual-commit', retainedEffect, { after: true });
  advance('injected-failure', committed, 2);
  advance('durable-counterfactual-result', committed, 3);
  c.show('durable-counterfactual-result', committed.count, { after: true });
  c.show('rollback-test', aborted.cursor);
  advance('fail-before-commit', aborted, 1);
  advance('test-rollback', aborted, 2);
  c.show('test-count', aborted.count, { after: true });
}
