import {
  pairedEvidence,
  incidentsPerMillion,
} from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';
import { assertEqual, draw, line, place, rect, to } from 'vizmatic/stage';
import { heading } from '../../kit-narrated.mjs';
import {
  PAIRED,
  PAIR_FIXTURE,
  outcomes,
  outcomeColors,
  outcomeOf,
  work,
  caption,
  ledger,
} from '../parts.mjs';

export default function typedComparison(s, c) {
  const matchTitle = heading(c.title);
  const countTitle = heading('Which inputs can we count?');
  const reviewTitle = heading('How would you check this label?');
  const [pairs, status] = work.rows([2.8, 1]);
  const rows = [
    PAIR_FIXTURE.find((r) => r.baseline && !r.candidate),
    PAIR_FIXTURE.find((r) => !r.baseline && r.candidate),
  ];
  const [leftReport, rightReport] = pairs.columns(2, 310);
  const reports = [leftReport, rightReport].map((side, i) => {
    const [head, ...slots] = side.rows([0.65, 1, 1], 'normal');
    const order = i ? [...rows].reverse() : rows;
    const entries = slots.map((slot, j) => {
      const r = order[j];
      const hit = i ? r.candidate : r.baseline;
      return [
        place(
          rect(slot.width, slot.height * 0.72, {
            fill: 'surface',
            stroke: 'gridStrong',
            width: 3,
            radius: 12,
          }),
          slot,
        ),
        caption(slot, r.id + '     ' + (hit ? 'hit' : 'miss'), 'ink', 47),
      ];
    });
    return {
      head: caption(head, i ? 'Candidate' : 'Baseline', i ? 'cyan' : 'blue', 53),
      entries,
      slots,
    };
  });
  const edges = rows.map((_, i) =>
    line(reports[0].slots[i].point('right'), reports[1].slots[1 - i].point('left'), {
      stroke: i ? 'cyan' : 'pink',
      width: 9,
    }),
  );
  const records = reports.flatMap((report) => [report.head, report.entries]);
  const pending = caption(status, 'Find the same query in both reports.', 'yellow');
  const lost = caption(status, rows[0].id + '   ·   hit → miss', 'pink', 48);
  const follow = caption(status, 'Follow ' + rows[1].id, 'cyan', 48);
  const gained = caption(status, rows[1].id + '   ·   miss → hit', 'cyan', 48);
  const rejected = caption(status, 'Validate the input before counting hits.', 'dim');
  const numeric = caption(status, '1 fails the literal Boolean check.', 'red');
  const baseline = Object.fromEntries(PAIR_FIXTURE.map((r) => [r.id, r.baseline]));
  const candidate = Object.fromEntries([...PAIR_FIXTURE].reverse().map((r) => [r.id, r.candidate]));
  const joinedPairs = pairedEvidence(baseline, candidate);
  const tally = Object.values(joinedPairs.counts);
  assertEqual(
    tally.reduce((a, b) => a + b, 0),
    PAIRED.n,
    'each frozen query reaches one cell',
  );
  const counted = caption(
    status,
    tally.join(' + ') + ' = ' + joinedPairs.n + ' accepted IDs',
    'green',
  );
  const checks = ledger(
    pairs,
    ['Trial', 'Input to the program', 'Outcome'],
    [
      { id: 'empty', Trial: 'Population', 'Input to the program': 'Two empty maps', Outcome: ' ' },
      {
        id: 'keys',
        Trial: 'Key equality',
        'Input to the program': 'Different query IDs',
        Outcome: ' ',
      },
      { id: 'type', Trial: 'Hit type', 'Input to the program': '1 instead of true', Outcome: ' ' },
      {
        id: 'exposure',
        Trial: 'Request exposure',
        'Input to the program': 'Fractional count',
        Outcome: ' ',
      },
    ],
  );
  function reject(cue, id, run, expectedError) {
    try {
      run();
    } catch (error) {
      if (!(error instanceof expectedError)) throw error;
      c.after(cue, () => s.play(checks.light(id), checks.setCell(id, 'Outcome', 'Rejected')));
      return;
    }
    throw new Error('The invalid ' + id + ' fixture was accepted.');
  }
  const sample = rows[0],
    k = outcomeOf(sample);
  const [input, bins] = pairs.columns([1, 1.3], 'loose');
  const bands = bins.rows(4, 'tight');
  const targets = bands.map((band) => band.columns([1.2, 1, 0.5], 'normal'));
  const boxes = bands.map((band, i) =>
    place(
      rect(band.width, band.height, {
        stroke: null,
        fill: i === k ? 'grid' : 'surface',
        radius: 12,
        width: 3,
      }),
      band,
    ),
  );
  const names = targets.map((slots, i) => caption(slots[1], outcomes[i], outcomeColors[i], 34));
  const counts = targets.map((slots, i) => caption(slots[2], String(tally[i]), outcomeColors[i]));
  const [key, fields] = input.rows(2, 'normal');
  const types = caption(
    fields,
    'Baseline ' + sample.baseline + '   ·   candidate ' + sample.candidate,
    'dim',
    35,
  );
  const token = caption(key, sample.id, 'pink');
  const cell = targets[k][0].point('center');
  const reason = caption(status, 'One accepted ID enters one outcome.', 'dim');
  const accepted = [boxes, names, types, token];
  const strict = caption(status, 'Exposure must be a positive integer.');
  const [exampleQuery, guide] = pairs.columns(2, 'loose');
  const review = [exampleQuery, guide].map((area, i) => {
    const card = area.inset('wide');
    const [header, body] = card.inset('normal').rows([0.65, 1.5], 'tight');
    return [
      place(
        rect(card.width, card.height, {
          fill: 'surface',
          stroke: 'gridStrong',
          width: 3,
          radius: 16,
        }),
        card,
      ),
      caption(header, i ? 'Labeled runbook' : 'Example support question', i ? 'cyan' : 'blue', 42),
      caption(
        body,
        i ? 'DNS troubleshooting\nguide' : 'Why did my DNS\nlookup time out?',
        'ink',
        58,
      ),
    ];
  });
  const askExpert = caption(
    status,
    'Would this guide help the engineer diagnose the timeout?',
    'yellow',
    43,
  );
  s.add(matchTitle, records, pending);
  c.on('id', () => s.play(to(reports[0].entries[0][0], (n) => n.stroke('yellow'))));
  c.on('lookup', () => s.play(draw(edges[0]), { duration: 0.6 }));
  c.swap('miss', pending, lost, { after: true });
  c.hide('gain', edges[0], { fade: 0.15 });
  c.on('gain', () =>
    s.play(
      draw(edges[1]),
      to(reports[0].entries[0][0], (n) => n.stroke('gridStrong')),
      to(reports[0].entries[1][0], (n) => n.stroke('cyan')),
      { duration: 0.6 },
    ),
  );
  c.swap('gain', lost, follow);
  c.swap('gained', follow, gained, { after: true });
  c.swap('empty', [records, edges[1], gained, matchTitle], [checks, rejected, countTitle]);
  reject('empty', 'empty', () => pairedEvidence({}, {}), RangeError);
  reject('different', 'keys', () => pairedEvidence({ a: true }, { b: true }), RangeError);
  reject('invalid', 'type', () => pairedEvidence({ a: true }, { a: 1 }), TypeError);
  reject('fractional', 'exposure', () => incidentsPerMillion(1, 0.5), RangeError);
  c.swap('invalid', rejected, numeric, { after: true });
  c.swap('accepted', checks, accepted);
  c.swap('accepted', numeric, reason);
  c.on(
    'accepted',
    () =>
      s.play(
        to(token, (n) => n.moveTo(cell)),
        { duration: 1.1 },
      ),
    0.5,
  );
  c.show('sum', counts, { after: true });
  c.swap('sum', reason, counted, { after: true });
  c.swap('exposure', [accepted, counts], checks);
  c.on('exposure', () => s.play(checks.light('exposure')), 0.7);
  c.swap('exposure', counted, strict);
  c.swap('review', [checks, strict, countTitle], [reviewTitle, review]);
  c.show('expert', askExpert);
}
