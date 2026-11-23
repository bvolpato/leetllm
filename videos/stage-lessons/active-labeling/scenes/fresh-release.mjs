import { assertEqual, dot, indicate, line, place, row } from 'vizmatic/stage';
import { chip, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import { baseRow } from '../../../films/active-labeling/fixtures.mjs';
import {
  cohenKappa,
  overlapFindings,
  releaseSummaryGate,
} from '../../../films/active-labeling/model.mjs';
import { hash } from '../../../films/active-labeling/arithmetic.mjs';
import { footer, picture, reviewerMatrix, sourceBand } from '../parts.mjs';

export default function freshRelease(s, c) {
  const counts = [
      [32, 8],
      [8, 32],
    ],
    threshold = 0.65;
  const stats = cohenKappa(counts);
  const frozen = {
    id: 'incident-seven',
    family: 'incident-seven',
    parents: [],
    text: 'Frozen incident.',
  };
  const rows = [
    baseRow('fresh-permitted', 'Request canary approval.'),
    baseRow('ticket-nine', 'Copied incident evidence.', frozen.family, [frozen.id]),
    baseRow('ticket-nine-copy', 'Derived incident evidence.', frozen.family, ['ticket-nine']),
  ];
  const clean = rows.filter((r) => r.family !== frozen.family);
  const findings = overlapFindings(rows, [frozen]);
  const checked = {
    redaction: true,
    completed: true,
    findings,
    kappa: stats.kappa,
    threshold,
    unsafe: 0,
    unresolved: 0,
  };
  const oldHash = hash(rows),
    newHash = hash(clean);
  assertEqual(stats.kappa.toFixed(2), '0.60', 'fresh kappa');
  assertEqual(findings.length, 2, 'both training derivatives have lineage findings');
  assertEqual(
    releaseSummaryGate({ ...checked, findings: [] }),
    false,
    'low agreement alone blocks release',
  );
  assertEqual(
    releaseSummaryGate({ ...checked, kappa: 1 }),
    false,
    'family overlap alone blocks release',
  );
  assertEqual(overlapFindings(clean, [frozen]).length, 0, 'rebuilt rows exclude this family');
  assertEqual(oldHash === newHash, false, 'new rows require their own report');
  const prefix = (digest) => digest.slice(0, 10) + '…';
  const title = heading(c.title);
  const [left, right] = picture.columns([1, 1.15], 'loose');
  const [axes, matrix, formulas] = left.rows([1, 4, 2], 'normal');
  const table = reviewerMatrix(matrix, counts, ['A', 'B']);
  const axis = place(note('Rows  ·  reviewer 1      Columns  ·  reviewer 2'), axes);
  const gate = place(note('80 pairs  ·  required κ ≥ ' + threshold.toFixed(2)), sourceBand, 'left');
  const calcRows = formulas.rows(3, 'tight');
  const matches = stats.total - stats.disagreements;
  const obs = place(
    mono('Observed   ' + matches + '/' + stats.total + ' = ' + stats.observed.toFixed(2), {
      size: 32,
    }),
    calcRows[0],
  );
  const chance = place(
    mono('Chance   ½ × ½ + ½ × ½ = ' + stats.expected.toFixed(2), { size: 32 }),
    calcRows[1],
  );
  const kappa = place(
    mono('κ = (0.80 − 0.50) / 0.50 = ' + stats.kappa.toFixed(2), { size: 31, color: 'yellow' }),
    calcRows[2],
  );

  const [frozenLane, headerLane, ...lanes] = right.rows([1.3, 0.7, 1, 1, 1, 1, 1], 'tight');
  const test = place(
    row([note('Private test'), chip(frozen.id, { color: 'pink' })], { gap: 'normal' }),
    frozenLane,
    'left',
  );
  const trainCols = headerLane.columns([1.15, 1], 'wide');
  const trainHead = [
    place(note('Training row'), trainCols[0], 'left'),
    place(note('Direct parent'), trainCols[1], 'left'),
  ];
  const training = rows.map((r, i) => {
    const [id, parent] = lanes[i].columns([1.15, 1], 'wide');
    return [
      place(chip(r.id, { color: 'cyan' }), id, 'left'),
      place(mono(r.parents[0] ?? 'none', { size: 31, color: 'dim' }), parent, 'left'),
    ];
  });
  const hashTag = (kind, digest, region, color) =>
    place(
      row([note(kind), mono(prefix(digest), { color, size: 31 })], { gap: 'normal' }),
      region,
      'left',
    );
  const draft = hashTag('Snapshot  ·  3 rows', oldHash, lanes[3], 'cyan');
  const rebuilt = hashTag('Snapshot  ·  1 row', newHash, lanes[3], 'cyan');
  const report = hashTag('Audited snapshot', oldHash, lanes[4], 'pink');
  const ask = place(label('Which two findings hold up this release?', { color: 'yellow' }), footer);
  const hold = place(label('Check the disagreement cases against the evidence.'), footer);
  const audit = place(
    label('New snapshot  ·  audits and agreement check required', { color: 'yellow' }),
    footer,
  );

  const [historyHead, dataLane, modelLane, testLane] = picture.rows([0.8, 1.3, 1.3, 1.3], 'normal');
  const historyTitle = heading('Which test is still independent?');
  const history = place(
    note('Suppose training already happened.', { color: 'yellow' }),
    historyHead,
    'left',
  );
  const historyRow = (region, name, content, color) => {
    const [tag, value] = region.columns([1, 2.75], 'normal');
    return [
      place(label(name), tag, 'left'),
      place(row([chip(content[0], { color }), note(content[1])], { gap: 'wide' }), value, 'left'),
    ];
  };
  const original = historyRow(
    dataLane,
    'Dataset on disk',
    [prefix(oldHash), '3 rows  ·  includes the frozen family'],
    'cyan',
  );
  const changed = historyRow(
    dataLane,
    'Dataset on disk',
    [prefix(newHash), '1 permitted row'],
    'cyan',
  );
  const checkpoint = historyRow(
    modelLane,
    'Existing checkpoint',
    [prefix(oldHash), 'snapshot used for training'],
    'blue',
  );
  const oldTest = historyRow(
    testLane,
    'Private test',
    [frozen.id, 'case family appears in the original snapshot'],
    'pink',
  );
  const scoreQuestion = place(
    label('Can this model count incident-seven as unseen?', { color: 'yellow' }),
    footer,
  );
  const exposed = place(
    label('This model trained on the incident family.', { color: 'pink' }),
    footer,
  );

  const [routeHead, routeOne, routeTwo] = picture.rows([1, 2.2, 2.2], 'wide');
  const headers = routeHead.columns([1.35, 2, 1.55], 'wide');
  const headings = ['Starting checkpoint', 'Training action', 'Independent test'].map((name, i) =>
    place(note(name), headers[i], 'left'),
  );
  const route = (region, name, action, target, color) => {
    const [source, train, test] = region.columns([1.35, 2, 1.55], 'wide');
    return [
      place(chip(name, { color }), source, 'left'),
      place(label(action, { size: 34 }), train, 'left'),
      place(chip(target, { color: 'pink' }), test, 'left'),
    ];
  };
  const retrain = route(
    routeOne,
    'Clean checkpoint',
    'Train on audited clean rows',
    frozen.id,
    'cyan',
  );
  const fresh = route(
    routeTwo,
    'Existing checkpoint',
    'Keep its weights',
    'Fresh independent cases',
    'blue',
  );
  const logTitle = heading('The approval check on a fresh case');
  const logSource = place(
    note('Existing checkpoint   ·   new independent canary family   ·   simulated action log'),
    sourceBand,
    'left',
  );
  const [trafficLane, approvalLane, timeLane, verdictLane] = picture.rows([2, 2, 1, 1.5], 'normal');
  const time = (minute, lane) => {
    const scale = lane.columns([1, 3], 'wide')[1].inset(72, 0);
    return [scale.left + (scale.width * minute) / 3, scale.point('center')[1]];
  };
  const clock = (minute) => '10:0' + minute;
  const eventLane = (region, name, minute) => ({
    base: [
      place(label(name, { size: 42 }), region.columns([1, 3], 'wide')[0], 'left'),
      line(time(0, region), time(3, region), { stroke: 'grid', width: 6 }),
    ],
    mark: dot(18, 'blue').moveTo(time(minute, region)),
  });
  const trafficAt = 1,
    approvedAt = 2;
  const traffic = eventLane(trafficLane, 'Traffic changed', trafficAt);
  const approval = eventLane(approvalLane, 'Sign-off recorded', approvedAt);
  const ticks = [0, 1, 2, 3].map((m) => mono(clock(m), { size: 36 }).moveTo(time(m, timeLane)));
  const early = approvedAt - trafficAt;
  const waited = (change, signOff) => change >= signOff;
  assertEqual(waited(trafficAt, approvedAt), false, 'traffic moved before approval');
  assertEqual(waited(3, approvedAt), true, 'traffic moved after approval');
  const earlySpan = line(time(trafficAt, verdictLane), time(approvedAt, verdictLane), {
    stroke: 'yellow',
    width: 7,
  });
  const earlyLabel = mono(early + ' min early', { color: 'yellow', size: 36 }).moveTo([
    time((trafficAt + approvedAt) / 2, verdictLane)[0],
    verdictLane.top + 12,
  ]);
  const prompt = place(label('Did this run wait for approval?', { color: 'yellow' }), footer);
  const verdict = place(
    label(waited(trafficAt, approvedAt) ? 'Approval check passed' : 'Approval check failed', {
      color: waited(trafficAt, approvedAt) ? 'green' : 'red',
    }),
    footer,
  );
  s.add(title, gate);
  c.show('fresh-table', [axis, table.nodes]);
  c.show('fresh-rows', [test, trainHead, training.map((r) => r[0]), draft]);
  c.show(
    'fresh-links',
    training.map((r) => r[1]),
  );
  c.show('ask-findings', ask);
  c.after('fresh-matches', () =>
    s.play(tint(table.cells[0][0], 'green'), tint(table.cells[1][1], 'green')),
  );
  c.show('fresh-matches', obs, { after: true });
  c.show('fresh-chance', chance, { after: true });
  c.show('fresh-kappa', kappa, { after: true });
  c.swap('fresh-triage', ask, hold, { after: true });
  c.after('fresh-triage', () =>
    s.play(tint(table.cells[0][1], 'yellow'), tint(table.cells[1][0], 'yellow')),
  );
  c.on('fresh-overlap', () => s.play(tint(training[1][0], 'pink')));
  c.on('fresh-copy', () => s.play(tint(training[2][0], 'pink')));
  c.swap('fresh-rebuild', [training.slice(1), draft], rebuilt, { after: true });
  c.show('fresh-report', report);
  c.swap('fresh-report', hold, audit, { after: true });
  c.swapAll('old-checkpoint', [historyTitle, history, original, checkpoint, oldTest]);
  c.swap('after-cleanup', original, changed, { after: true });
  c.show('ask-score', scoreQuestion);
  c.swap('old-exposure', scoreQuestion, exposed, { after: true });
  c.after('old-exposure', () => s.play(indicate(checkpoint, { color: 'yellow', scale: 1 })));
  c.swapAll('clean-path', [headings, retrain], { keep: [historyTitle], after: true });
  c.show('fresh-path', fresh, { after: true });
  c.swapAll('behavior', [logTitle, logSource, traffic.base, approval.base, ticks]);
  c.show('traffic-event', traffic.mark, { after: true });
  c.show('approval-event', approval.mark, { after: true });
  c.show('ask-behavior', prompt);
  c.swap('behavior-result', prompt, [earlySpan, earlyLabel], { after: true });
  c.show('record-failure', verdict, { after: true });
}
