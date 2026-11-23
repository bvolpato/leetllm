import { assertEqual, circle, dot, place, rect, to } from 'vizmatic/stage';
import { freshEvidence } from '../../../films/ai-lab-technical-presentation/model.mjs';
import { addTitle, caption, outcomeColors, outcomeOf, outcomes, readout, work } from '../parts.mjs';

export default function freshEvidenceScene(s, c) {
  addTitle(s, c);
  const before = freshEvidence(false);
  const after = freshEvidence(true);
  const service = after.service;
  const [intro, board, calculation, response] = work.rows([0.55, 3.6, 1, 0.85], 'normal');
  const rows = board.rows(4, 'normal');
  const lanes = rows.map((row) => row.columns([1.3, 5, 0.55], 'normal'));
  const max = Math.max(...Object.values(after.counts));
  const loc = (k, i) => lanes[k][1].columns(max, 'none')[i].point('center');
  const piles = outcomes.map((_, k) => before.rows.filter((row) => outcomeOf(row) === k));
  const marks = piles.map((pile, k) =>
    pile.map((_, i) => dot(16, outcomeColors[k]).moveTo(loc(k, i))),
  );
  const names = lanes.map(([name], i) => caption(name, outcomes[i], outcomeColors[i], 41));
  const number = (k, count) => caption(lanes[k][2], String(count), outcomeColors[k], 48);
  const counts = piles.map((pile, k) => number(k, pile.length));
  const afterCounts = [number(0, after.counts.both), number(1, after.counts.baselineOnly)];
  const results = new Map(after.rows.map((r) => [r.id, r]));
  const fixed = piles[1].flatMap((r, i) => (results.get(r.id).candidate ? [i] : []));
  assertEqual(fixed.length, 2, 'two lost hits were repaired');
  assertEqual(after.baselineHits, before.baselineHits, 'same baseline after the repair');
  const rings = fixed.map((i) =>
    circle(24, { stroke: 'yellow', fill: null, width: 4 }).moveTo(loc(1, i)),
  );
  const name = caption(intro, 'Fresh replay   ·   ' + before.n + ' labeled query IDs', 'ink', 42);
  const ask = caption(
    response,
    'After the repair, how many extra hits over the baseline?',
    'yellow',
    43,
  );
  const [left, right] = calculation.columns(2, 'normal');
  const baseline = caption(
    left,
    'Baseline   ' +
      before.counts.both +
      ' + ' +
      before.counts.baselineOnly +
      ' = ' +
      before.baselineHits,
    'blue',
    49,
  );
  const candidate = caption(
    right,
    'Candidate   ' +
      after.counts.both +
      ' + ' +
      after.counts.candidateOnly +
      ' = ' +
      after.candidateHits,
    'cyan',
    49,
  );
  const gain = after.candidateHits - before.baselineHits;
  const net = caption(
    response,
    gain +
      ' extra hits / ' +
      after.n +
      ' queries = +' +
      after.percentagePointChange +
      ' percentage points',
    'yellow',
    45,
  );
  s.add(name, names);
  for (const [i, cue] of ['shared', 'lost', 'new', 'neither'].entries()) {
    c.show(cue, [marks[i], counts[i]], { after: true });
  }
  c.show('repair', rings);
  c.show('old', baseline, { after: true });
  c.show('ask', ask);
  c.hide('move', [rings, counts[0], counts[1]], { fade: 0.16 });
  c.on(
    'move',
    () => {
      const middleY = (loc(0, 0)[1] + loc(1, 0)[1]) / 2;
      const repaired = fixed.map((index, i) => ({
        node: marks[1][index],
        from: loc(1, index),
        target: loc(0, piles[0].length + i),
      }));
      s.play(...repaired.map(({ node, from }) => to(node, (n) => n.moveTo([from[0], middleY]))), {
        duration: 0.23,
      });
      s.play(
        ...repaired.map(({ node, target }) => to(node, (n) => n.moveTo([target[0], middleY]))),
        { duration: 0.58 },
      );
      s.play(
        ...repaired.map(({ node, target }) =>
          to(node, (n) => n.moveTo(target).fill(outcomeColors[0])),
        ),
        { duration: 0.23 },
      );
    },
    0.18,
  );
  c.show('fixed', afterCounts, { after: true });
  c.show('hits', candidate, { after: true });
  c.swap('net', ask, net, { after: true });

  const [decisionBoard] = work.rows([4.7, 0.85], 'normal');
  const [retrievalSide, serviceSide] = decisionBoard.columns([1, 1.45], 'normal');
  const panels = [retrievalSide, serviceSide].map((r) =>
    place(rect(r.width, r.height, { fill: 'surface', stroke: 'grid', radius: 18, width: 3 }), r),
  );
  const [retrievalHead, result, loss] = retrievalSide.inset('normal').rows([1, 2, 1.5], 'normal');
  const [netHits, stillLost] = loss.rows(2, 'tight');
  const [serviceHead, latencyRow, attempts, attemptCount, policy] = serviceSide
    .inset('normal')
    .rows([0.8, 0.9, 1.65, 0.8, 0.7], 'tight');
  const supports = [
    caption(retrievalHead, 'Retrieval replay', 'ink', 46),
    readout(
      result,
      before.baselineHits + ' → ' + after.candidateHits,
      'top-five hits on ' + after.n + ' query IDs',
      'cyan',
    ),
    caption(netHits, '+' + gain + ' net hits', 'cyan', 46),
    caption(stillLost, after.counts.baselineOnly + ' remaining regression', 'pink', 38),
  ];
  const check = caption(serviceHead, 'Service check', 'ink', 46);
  const measured = caption(
    latencyRow,
    service.successfulP95Ms + ' ms successful p95   ·   limit < ' + service.latencyLimitMs + ' ms',
    'ink',
    40,
  );
  const attemptField = attempts.inset('normal');
  const slots = attemptField.rows(4, 'tight').flatMap((r) => r.columns(10, 'normal'));
  assertEqual(slots.length, service.attempts, 'one mark per attempted request');
  const successful = service.attempts - service.timeouts;
  const units = slots.map((cell) =>
    place(rect(40, 23, { stroke: 'dim', fill: 'surface', radius: 5, width: 2 }), cell),
  );
  const count = caption(
    attemptCount,
    service.timeouts + ' timeout / ' + service.attempts + ' attempts',
    'ink',
    40,
  );
  const threshold = caption(
    policy,
    'Required success rate ≥ ' + 100 * service.minimumSuccess + '%',
    'ink',
    40,
  );
  const askRelease = caption(response, 'Would you recommend moving more traffic?', 'yellow', 45);
  const fraction = caption(
    attemptCount,
    successful + ' / ' + service.attempts + ' succeeded = ' + 100 * service.successFraction + '%',
    'red',
    41,
  );
  const verdict = caption(
    response,
    service.passes ? 'Promote' : 'Hold promotion',
    service.passes ? 'green' : 'red',
    59,
  );
  c.swap(
    'service',
    [name, names, marks, afterCounts, counts[2], counts[3], baseline, candidate, net],
    [panels, supports, check, units],
  );
  c.show('latency', measured, { after: true });
  c.show('policy', threshold);
  c.after('timeout', () =>
    s.play(
      ...units.map((unit, i) =>
        to(unit, (n) =>
          n.fill(i < successful ? 'cyan' : 'red').stroke(i < successful ? 'cyan' : 'red'),
        ),
      ),
      { duration: 0.4 },
    ),
  );
  c.show('timeout', count, { after: true });
  c.show('recommend', askRelease);
  c.swap('fraction', count, fraction, { after: true });
  c.swap('hold', askRelease, verdict, { after: true });
}
