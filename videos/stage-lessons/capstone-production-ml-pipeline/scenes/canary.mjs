import { assertEqual, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { canary as decide } from '../../../films/capstone-production-ml-pipeline/arithmetic.mjs';
import {
  BODY,
  matureQuality,
  open,
  passingWindow,
  pendingWindow,
  regressingHistory,
} from '../parts.mjs';

const passing = [pendingWindow, passingWindow];
const percent = (q) => Math.round(100 * q.delta);
const signed = (n) => (n < 0 ? '−' : n > 0 ? '+' : '') + Math.abs(n) + '%';

function windowMark(room, w, tone) {
  const quality = matureQuality(w);
  const delta = quality && percent(quality);
  const [day, scale, value] = room.rows([1, 1, 1], 'tight');
  const y = scale.point('center')[1];
  const x = (n) => scale.left + ((n + 20) / 40) * scale.width;
  const color = tone ?? (delta > 0 ? 'red' : 'green');
  return [
    place(note('Day ' + w.day), day),
    line([x(-20), y], [x(20), y], { stroke: 'grid', width: 3 }),
    line([x(0), y - 15], [x(0), y + 15], { stroke: 'yellow', width: 3 }),
    ...(quality
      ? [
          line([x(0), y], [x(delta), y], { stroke: color, width: 8 }),
          dot(12, color).moveTo([x(delta), y]),
          place(
            mono(quality.candidateCost + ' / ' + quality.baselineCost + '   ' + signed(delta), {
              size: 33,
              color,
            }),
            value,
          ),
        ]
      : [place(note('no labels', { color: 'yellow' }), value)]),
  ];
}

export default function canary(s, c) {
  const [healthBand, stream, cards, sumRoom, statusRoom] = BODY.rows([1, 1, 3.5, 1, 1], 'normal');
  const [dayRoom, metricRoom] = healthBand.columns([1, 3], 'normal');
  const day0 = place(label('Day 0', { color: 'cyan' }), dayRoom);
  const day7 = place(label('Day 7', { color: 'cyan' }), dayRoom);
  const health = (window) =>
    place(
      mono(
        'p95 ' + window.ms + ' ms (limit 250)     errors ' + window.error * 100 + '% (limit 1%)',
        {
          size: 35,
        },
      ),
      metricRoom,
    );
  const firstHealth = health(pendingWindow);
  const laterHealth = health(passingWindow);
  const observations = passingWindow.qualityRows;
  const slots = cards.columns(observations.length, 'wide');
  const origins = stream.columns(20, 'none').map((r) => r.point('center'));
  const destinations = slots.map((r) => [r.point('center')[0], r.top + 22]);
  const diverted = s.value(0);
  const lineY = stream.point('center')[1];
  const streamLine = line([origins[0][0], lineY], [origins.at(-1)[0], lineY], {
    stroke: 'grid',
    width: 3,
  });
  const marks = dynamic(() =>
    origins.map(([x, y], i) => {
      if (i % 5 !== 0) return dot(10, 'blue').moveTo([x, y]);
      const end = destinations[i / 5];
      const p = diverted.value;
      return dot(12, p > 0 ? 'green' : 'blue').moveTo([x + (end[0] - x) * p, y + (end[1] - y) * p]);
    }),
  );
  const packets = slots.map((r, i) => {
    const [id, outcome, cost] = r.inset('normal').rows(3, 'tight');
    const item = observations[i];
    const frame = rect(r.width, r.height, { fill: null, stroke: 'grid', width: 2 }).moveTo(
      r.point('center'),
    );
    return {
      frame,
      id: place(mono(item.id, { size: 38, color: 'green' }), id),
      pending: place(note('label pending'), outcome),
      outcome: place(label(item.late ? 'Late' : 'On time', { size: 41, color: 'pink' }), outcome),
      cost: place(mono(item.candidateCost + ' / ' + item.baselineCost, { size: 39 }), cost),
    };
  });
  const q = matureQuality(passingWindow);
  const total = place(
    label('Candidate ' + q.candidateCost + ' units    /    baseline ' + q.baselineCost + ' units', {
      size: 39,
    }),
    sumRoom,
  );
  const delta = place(
    mono(q.candidateCost + ' / ' + q.baselineCost + ' − 1 = ' + signed(percent(q)), {
      size: 45,
      color: 'green',
    }),
    sumRoom,
  );
  const costKey = place(note('Supplied cost per delivery     ·     candidate / baseline'), sumRoom);
  const exposure = place(
    label('v0 keeps 16 requests     ·     v1 serves these 4', { size: 35 }),
    sumRoom,
  );
  const waiting = place(label('Canary v1 · awaiting requests', { size: 35 }), sumRoom);
  const status = (words, color = 'ink') => place(label(words, { size: 37, color }), statusRoom);
  const awaiting = status('Labels received   0 / 4     ·     cost change unknown', 'yellow');
  const question = status('0 / 4 labels     ·     expand exposure or hold?', 'yellow');
  const held = status('HOLD     ·     canary v1     ·     production v0', 'yellow');
  const measured = status('4 / 4 labels     ·     production v0', 'blue');

  const [guide, header, earlyRow, altRow, foot] = BODY.rows([1, 0.75, 2.3, 2.3, 1], 'normal');
  const grid = (r) => r.columns([1.1, 2.8, 2.8, 1.6], 'loose');
  const [, earlyHead, latestHead, decisionHead] = grid(header);
  const historyHead = [
    place(label('Every mature window must have cost change ≤ 0%', { size: 42 }), guide),
    place(note('Earlier window'), earlyHead),
    place(note('Latest window'), latestHead),
    place(note('Canary receipt'), decisionHead),
  ];
  const one = grid(earlyRow);
  const two = grid(altRow);
  const rowA = [
    place(label('A'), one[0]),
    windowMark(one[1], pendingWindow),
    windowMark(one[2], passingWindow),
  ];
  const facts = place(note('Both windows pass latency and error checks'), foot);
  const altFacts = place(
    note('Both histories finish at −8%. Can B stay open?', { color: 'yellow' }),
    foot,
  );
  const ready = place(label(decide(passing), { color: 'green' }), one[3]);
  const aborted = place(label(decide(regressingHistory), { color: 'red' }), two[3]);
  const breach = place(
    note(
      'Earlier window: ' +
        signed(percent(matureQuality(regressingHistory[0]))) +
        ' exceeds the 0% limit',
      { color: 'red' },
    ),
    foot,
  );
  const closed = place(
    label('Canary v1 removed     ·     production stays on v0', { color: 'yellow', size: 38 }),
    foot,
  );

  open(s, c);
  s.add(
    day0,
    streamLine,
    marks,
    packets.map((p) => p.frame),
    waiting,
  );
  c.on('canary-four', () => s.play(diverted.to(1, { duration: 0.95 })));
  c.swap('canary-four', waiting, [exposure, packets.map((p) => p.id)]);
  c.show('canary-fast', firstHealth);
  c.show('canary-pending', [packets.map((p) => p.pending), awaiting]);
  c.swap('canary-first-vote', awaiting, question);
  c.swap('canary-hold', question, held, { after: true, lead: 0 });
  c.swap('canary-day-seven', [day0, firstHealth], [day7, laterHealth]);
  packets.forEach((p, i) => c.swap('canary-match', p.pending, p.outcome, { lead: -i * 0.37 }));
  c.swap('canary-match', held, measured, { lead: -1.6 });
  c.swap('canary-pair', exposure, [costKey, packets.map((p) => p.cost)]);
  c.swap('canary-sum', costKey, total);
  c.swap('canary-delta', total, delta);
  const quartet = [
    day7,
    laterHealth,
    streamLine,
    marks,
    packets.map((p) => [p.frame, p.id, p.outcome, p.cost]),
    measured,
    delta,
  ];
  c.swap('canary-history', quartet, [historyHead, rowA, facts]);
  c.show('canary-ready', ready);
  c.show('canary-alternative', place(label('B'), two[0]));
  c.show('canary-earlier', windowMark(two[1], regressingHistory[0], 'cyan'));
  c.show('canary-later', windowMark(two[2], regressingHistory[1], 'cyan'));
  c.swap('canary-vote', facts, altFacts);
  c.show('canary-abort', aborted, { after: true, lead: 0 });
  c.swap('canary-abort', altFacts, breach, { after: true, lead: 0 });
  c.swap('canary-remove', breach, closed);
}

assertEqual(decide([pendingWindow]), 'HOLD', 'pending single window');
assertEqual(decide(passing), 'READY', 'passing history');
assertEqual(decide(regressingHistory), 'ABORT', 'earlier regression');
