import assert from 'node:assert/strict';
import { paint, timing, wordings } from './counter.mjs';
import { opening, harms, matching, manifest, denominators, cutoff } from './claims.mjs';
import { criteria, calibration, uncertainty, gapInterval } from './measurements.mjs';
import { intervention, scope, release } from './release.mjs';
import {
  baseline,
  p4,
  dec,
  rates,
  served,
  flips,
  register,
  cutoffState,
  channelRows,
  band,
  population,
  scoreExample,
  mean,
  scoreCut,
  wilson,
  intervals,
  gapPass,
  toy,
  candidate,
  second,
  releaseRows,
  stripState,
  fixtureResult,
} from './audit.mjs';

const painters = [
  opening,
  harms,
  matching,
  manifest,
  denominators,
  cutoff,
  criteria,
  calibration,
  uncertainty,
  gapInterval,
  intervention,
  scope,
  release,
];
function draw(ctx, clock) {
  ctx.save();
  try {
    painters[clock.beat.chapterIndex](paint(ctx), timing(clock));
  } finally {
    ctx.restore();
  }
}

function check() {
  assert.deepEqual(
    [p4.formal, p4.conversational, served(p4.formal), served(p4.conversational)],
    [0.78, 0.67, true, false],
  );
  assert.equal(dec(p4.formal - p4.conversational), '0.11');
  assert.deepEqual(flips(0.7, baseline), ['p4', 'p5', 'n1']);
  function beat(n, progress = {}) {
    const at = (b, phrase) => (b < n ? 1 : b > n ? 0 : (progress[phrase] ?? 0));
    return { b: n, at, after: (b, phrase) => at(b, phrase) === 1 };
  }
  const missing = register(beat(3, { 'drops both versions': 1 }));
  assert.equal(missing.rows.length, 9);
  assert.deepEqual(missing.missing, [p4]);
  assert.deepEqual(register(beat(4, { 'Restore P four': 1 })).rows, baseline);
  function counts(rows, cut) {
    return wordings.map((key) => {
      const { tp, fp, ready, unclear } = rates(key, cut, rows);
      return [tp, fp, ready, unclear];
    });
  }
  assert.deepEqual(counts(baseline, 0.7), [
    [5, 1, 6, 4],
    [3, 0, 6, 4],
  ]);
  for (const [time, cut, rows, expected] of [
    [
      beat(1),
      0.7,
      baseline,
      [
        [5, 1, 6, 4],
        [3, 0, 6, 4],
      ],
    ],
    [
      beat(1, { 'lower the cutoff': 0.5 }),
      0.6,
      baseline,
      [
        [6, 4, 6, 4],
        [5, 2, 6, 4],
      ],
    ],
    [
      beat(2),
      0.5,
      baseline,
      [
        [6, 4, 6, 4],
        [6, 4, 6, 4],
      ],
    ],
    [
      beat(3),
      0.95,
      baseline,
      [
        [0, 0, 6, 4],
        [0, 0, 6, 4],
      ],
    ],
    [
      beat(4),
      0.7,
      candidate,
      [
        [5, 0, 6, 4],
        [5, 0, 6, 4],
      ],
    ],
  ]) {
    const current = cutoffState(time);
    assert.equal(current.cut, cut);
    assert.equal(current.rows, rows);
    assert.deepEqual(counts(current.rows, current.cut), expected);
  }
  assert.equal(served(0.7, 0.7), true);
  assert.deepEqual(
    wordings.map((k) => {
      const d = band(k);
      return [d.rows.map((r) => r.id), d.mean.toFixed(3), d.expected.toFixed(2), d.ready];
    }),
    [
      [['p2', 'p3', 'p4', 'p5', 'n1'], '0.790', '3.95', 4],
      [['p1', 'p2', 'p3'], '0.777', '2.33', 3],
    ],
  );
  assert.deepEqual(counts(channelRows('Chat'), 0.7), [
    [3, 1, 3, 2],
    [3, 0, 3, 2],
  ]);
  assert.deepEqual(counts(channelRows('Email'), 0.7), [
    [2, 0, 3, 2],
    [0, 0, 3, 2],
  ]);
  assert.deepEqual(
    [50, 20].map((n) => population(n, 0.2)),
    [
      { ready: 50, tp: 40, fp: 10, selected: 50, precision: 0.8 },
      { ready: 20, tp: 16, fp: 16, selected: 32, precision: 0.5 },
    ],
  );
  assert.deepEqual(
    [50, 20].map((n) => population(n, 0).precision),
    [1, 1],
  );
  assert.deepEqual(
    scoreExample.map((s) => [dec(mean(s)), s.filter((v) => served(v, scoreCut)).length]),
    [
      ['0.60', 1],
      ['0.60', 0],
    ],
  );
  assert.deepEqual(
    [
      [5, 6],
      [3, 6],
      [6, 7],
      [4, 7],
      [0, 6],
    ].map(([a, b]) => wilson(a, b).map((v) => (v * 100).toFixed(1))),
    [
      ['43.6', '97.0'],
      ['18.8', '81.2'],
      ['48.7', '97.4'],
      ['25.0', '84.2'],
      ['0.0', '39.0'],
    ],
  );
  assert.deepEqual(intervals.map(gapPass), [true, false]);
  assert.deepEqual(
    [0.11, 0].map((p) => toy(p).map((r) => [r.score, r.auto])),
    [
      [
        [0.78, true],
        [0.67, false],
      ],
      [
        [0.78, true],
        [0.78, true],
      ],
    ],
  );
  assert.deepEqual(releaseRows(beat(2, { 'P one falls to point six': 0.9 })), candidate);
  const one = releaseRows(beat(2, { 'P one falls to point six': 1, 'P six rises to point eight': 0.9 }));
  assert.deepEqual(counts(one, 0.7), [
    [5, 0, 6, 4],
    [4, 0, 6, 4],
  ]);
  assert.deepEqual(stripState(one).changes, [{ id: 'p1', delta: -1 }]);
  assert.deepEqual(
    releaseRows(beat(2, { 'P one falls to point six': 1, 'P six rises to point eight': 1 })),
    second,
  );
  assert.deepEqual(releaseRows(beat(3)), second);
  assert.deepEqual(releaseRows(beat(4)), candidate);
  assert.deepEqual(stripState(candidate).changes, []);
  assert.deepEqual(stripState(second).shared, ['P2', 'P3', 'P4', 'P5']);
  assert.deepEqual(stripState(second).flips, ['p1', 'p6']);
  assert.deepEqual(stripState(second).changes, [
    { id: 'p1', delta: -1 },
    { id: 'p6', delta: 1 },
  ]);
  assert.deepEqual(
    [stripState(second).formal, stripState(second).conversational],
    [
      [true, true, true, true, true, false],
      [false, true, true, true, true, true],
    ],
  );
  for (const [rows, passes] of [
    [candidate, true],
    [second, false],
  ]) {
    const gate = fixtureResult(rows);
    assert.deepEqual(counts(rows, 0.7), [
      [5, 0, 6, 4],
      [5, 0, 6, 4],
    ]);
    assert.equal(gate.rateChecksPass, true);
    assert.equal(gate.passed, passes);
  }
  return true;
}
export default {
  title: 'How to Audit Fairness in an LLM Routing System',
  preparePicture(schedule) {
    const phrases = {
      'c05-b02': ['Five of six with formal wording', 'Three of six with conversational wording', 'Follow the two missing places', 'back to P four and P five', 'Two out of six makes the access gap', 'thirty-three point three percentage points', 'This ready-case service rate is the true positive rate'],
      'c05-b04': ['Only the formal version of N one got through', 'One out of four versus zero out of four', 'gives a twenty-five point gap', 'in the false positive rate', 'Check fulfillment records to find out', 'whether a replacement was actually issued'],
    };
    for (const entry of schedule) {
      if (!phrases[entry.beat.id]) continue;
      for (const phrase of phrases[entry.beat.id]) entry.markCaption(phrase);
      entry.cueWordIndices = new Set(entry.cueWordIndices);
    }
  },
  draw,
  check,
};
