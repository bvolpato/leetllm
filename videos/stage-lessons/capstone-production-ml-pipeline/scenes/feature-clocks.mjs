import { assertEqual, dot, indicate, line, place, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { admittedFeature } from '../../../films/capstone-production-ml-pipeline/model.mjs';
import { VALIDATION_STATES, BODY, open } from '../parts.mjs';

const prediction = '2026-05-28T12:00:00Z';
const scans = [
  ['A', '10:00', '11:00', 9],
  ['B', '11:30', '12:30', 99],
  ['C', '13:00', '13:01', 100],
].map(([name, observed, available, delay]) => ({
  name,
  entity: 'eval-1',
  observed: '2026-05-28T' + observed + ':00Z',
  available: '2026-05-28T' + available + ':00Z',
  delay,
}));
const winner = admittedFeature(scans, prediction, 'eval-1');
assertEqual(winner.delay, 9, 'latest scan available at noon');

export default function featureClocks(s, c) {
  const [guide, timeline, decision, evidence] = BODY.rows([0.9, 2.9, 0.85, 2.6], 'normal');
  const [names, tracks, verdicts] = timeline.columns([2.3, 6.5, 2.4], 'normal');
  const x = (stamp) =>
    tracks.left +
    ((Date.parse(stamp) - Date.parse(scans[0].observed)) / (3.5 * 3600000)) * tracks.width;
  const noon = x(prediction);
  const rows = tracks.rows(3, 'normal');
  const labels = names.rows(3, 'normal');
  const wins = verdicts.rows(3, 'normal');
  const guideText = place(
    label('eval-1     ·     carrier observation → service availability     ·     UTC', {
      color: 'cyan',
      size: 38,
    }),
    guide,
  );
  const boundary = line([noon, timeline.top + 18], [noon, timeline.bottom], {
    stroke: 'yellow',
    width: 4,
    dash: [10, 8],
  });
  const marks = scans.map((scan, i) => {
    const y = rows[i].point('center')[1];
    const a = x(scan.observed),
      b = x(scan.available);
    const rise = 15;
    return [
      place(mono(scan.name + '   ' + scan.delay + ' min', { size: 37 }), labels[i]),
      line([a, y - rise], [b, y + rise], { stroke: 'grid', width: 5 }),
      dot(9, 'cyan').moveTo([a, y - rise]),
      dot(9, 'pink').moveTo([b, y + rise]),
      mono(scan.observed.slice(11, 16), { size: 27, color: 'cyan' }).moveTo([
        a + (i === 0 ? 58 : -58),
        y - rise,
      ]),
      mono(scan.available.slice(11, 16), { size: 27, color: 'pink' }).moveTo([b + 58, y + rise]),
    ];
  });
  const footer = (v, color) => place(label(v, { color, size: 38 }), decision);
  const cutoff = footer(
    'Prediction at noon   ·   both clocks must be at or before 12:00',
    'yellow',
  );
  const ballot = footer('At noon, which delay can eval-1 use?', 'yellow');
  const answer = footer('eval-1  →  delay_minutes = ' + winner.delay, 'cyan');
  const late = place(note('After cutoff', { color: 'red' }), wins[1]);
  const future = place(note('Future scan', { color: 'red' }), wins[2]);
  const admitted = place(note('Eligible', { color: 'green' }), wins[0]);
  const t = place(
    table(
      [
        { key: 'operation', label: 'Builder check' },
        {
          key: 'rule',
          label: 'What enters the dataset',
          marks: true,
          sample: 'one request to one outcome',
        },
      ],
      [
        { id: 'join', operation: 'Join by request ID', rule: 'one request to one outcome' },
        { id: 'feature', operation: 'No eligible scan', rule: 'missing delay' },
        { id: 'train', operation: 'Training labels', rule: 'available by May 25' },
        { id: 'eval', operation: 'Evaluation labels', rule: 'May 28 request · May 31 snapshot' },
      ],
      { states: VALIDATION_STATES, width: evidence.width, size: 32, leading: 1.4 },
    ),
    evidence,
  );
  open(s, c);
  s.add(
    guideText,
    boundary,
    mono('12:00', { size: 30, color: 'yellow' }).moveTo([noon, timeline.top - 12]),
    cutoff,
  );
  c.show('clock-a', marks);
  c.on('clock-b', () => s.play(indicate(marks[1][3], { scale: 1.6, color: 'yellow' })));
  c.swap('clock-c', cutoff, ballot);
  c.swap('clock-chosen', ballot, answer, { after: true, lead: 0 });
  c.show('clock-chosen', admitted, { after: true, lead: 0 });
  c.show('clock-b-excluded', late);
  c.show('clock-c-excluded', future);
  c.show('clock-join', t);
  c.on('clock-duplicate', () =>
    s.play(
      t.setCell('join', 'rule', { value: 'duplicate → reject', state: 'fail' }),
      t.light('join'),
    ),
  );
  c.on('clock-missing', () => s.play(t.light('feature')));
  c.on('clock-train', () => s.play(t.light('train')));
  c.on('clock-eval', () => s.play(t.light('eval')));
  c.on('clock-label', () => s.play(t.setCell('eval', 'rule', 'answer key only'), t.light('eval')));
}
