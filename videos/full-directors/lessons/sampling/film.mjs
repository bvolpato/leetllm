import { prepareCaptions } from './captions.mjs';
import assert from 'node:assert/strict';
import { recorder, sum } from './recorder.mjs';
import * as d from './draws.mjs';
import * as e from './experiments.mjs';
import * as s from './decisions.mjs';
import {
  requests,
  latePrefixes,
  durationFromRank,
  durationCdf,
} from '../../../films/sampling/model.mjs';
import {
  mm1Means,
  tokenProbabilities,
  metropolisAcceptance,
} from '../../../films/sampling/arithmetic.mjs';
import { samplingFilmData as data } from '../../../films/sampling/fixtures.mjs';
import { cohort, targetRank } from '../../../films/sampling/cohort.mjs';

const scenes = [
  ['Arrival strips', 'Five replies against a timer', d.deadline],
  ['Request recorder', 'Four measurements on one receipt', d.receipt],
  ['Probability measures', 'What does the height measure?', d.probability],
  ['Duration model', 'From normal noise to positive time', d.transform],
  ['Duration model', 'How much falls between two marks?', d.area],
  ['Quantile reader', 'Turn a uniform rank into seconds', d.inverse],
  [
    'Quantile reader',
    (b) =>
      [
        'Find the first crossing',
        'Read a reply time back to its rank',
        'Turn a rank into service time',
        'One rank, two duration models',
        'Which ranks can the generator supply?',
        'Compare sample and model quantiles',
      ][b],
    d.inverseRules,
  ],
  ['Resolution counter', 'Count the ones in a hundred requests', d.resolutions],
  ['Route selector', 'Which route gets R18?', d.routing],
  ['Tool counter', 'When does the product stop?', d.poisson],
  ['Cost audit', 'Two batches, one tool budget', d.mixtures],
  ['Support check', 'A clock that finishes before it starts', e.impossible],
  ['Service clock', 'The next hundred milliseconds', e.service],
  ['Sample recorder', 'Keep each reply as it lands', e.sample],
  ['Monte Carlo', 'Extend thirty-two experiments', e.monte],
  ['Rare events', 'How long can the run stay empty?', e.detection],
  [
    'Replica recorder',
    (b) => (b === 0 ? 'Where does the log start?' : 'Which stream deserves a vote?'),
    e.replay,
  ],
  [
    'Posterior sampler',
    (b) =>
      b < 2
        ? 'Which resolution rates fit eight successes in ten?'
        : 'What prints in the next chain slot?',
    e.metropolis,
  ],
  ['Retained states', 'Read the flat step', e.chains],
  [
    'Chain diagnostics',
    (b) =>
      b === 1
        ? 'How many separate visits to the tail?'
        : b > 1
          ? 'Update one coordinate at a time'
          : 'Where did the chain spend its time?',
    e.diagnostics,
  ],
  ['Worker schedule', 'Three arrivals share one worker', (p) => s.queue(p, false)],
  ['Queue model', 'What happens near capacity?', s.stationary],
  ['Worker schedule', 'Which replies miss their own timer?', (p) => s.queue(p, true)],
  ['Token sampler', 'The sky is …', (p) => s.wheel(p, false)],
  ['Token sampler', 'Keep the needle in place', (p) => s.wheel(p, true)],
  ['Token sampler', 'Four scores race after a noisy push', s.gumbel],
  ['Launch report', 'Read a five-thousand-request run', s.launch],
  ['Matched requests', 'Which receipts trigger both alarms?', s.joints],
  ['Model check', 'Which side of the jump counts?', s.ks],
  ['Duration model', 'The median stays put', s.tail],
  ['Arrival audit', 'Who belongs in the denominator?', (p) => s.cohortDecision(p, false)],
  ['Deadline decision', 'Would fifteen seconds cover 95%?', (p) => s.cohortDecision(p, true)],
];

function draw(c, clock) {
  const [section, title, paint] = scenes[clock.beat.chapterIndex];
  c.save();
  try {
    c.scale(2, 2);
    const heading =
      clock.beat.chapterId === 'c27' && clock.beat.beatIndex >= 5
        ? 'Review a proposed launch model'
        : typeof title === 'function'
          ? title(clock.beat.beatIndex)
          : title;
    paint(recorder(c, clock, heading, section));
  } finally {
    c.restore();
  }
}

function check() {
  assert.deepEqual(
    d.runs.map((r) => r[2]),
    [6, 6],
  );
  assert.deepEqual(
    d.runs.map((r) => r.filter((t) => t > 10).length),
    [0, 2],
  );
  assert.equal(durationFromRank(0.5), 6);
  assert.equal(durationCdf(d.forwardSeconds), 0.5);
  for (const { lo, hi, start, end } of d.quartileIntervals) {
    assert.ok(Math.abs(durationCdf(start) - lo) < 1e-10 && Math.abs(durationCdf(end) - hi) < 1e-10);
    assert.equal(hi - lo, 0.25);
  }
  assert.deepEqual(
    d.quartileIntervals.map(({ start, end }) => [start.toFixed(2), end.toFixed(2)]),
    [
      ['4.14', '6.00'],
      ['6.00', '8.69'],
    ],
  );
  assert.equal(durationFromRank(0.95).toFixed(2), '14.83');
  assert.equal((100 * durationCdf(10)).toFixed(1), '82.3');
  assert.equal(sum(d.flags), 71);
  assert.deepEqual(d.flags.slice(0, 4), [0, 0, 0, 1]);
  assert.deepEqual([0.449, 0.45, 0.57, 0.65, 0.99].map(d.routeIndex), [0, 1, 1, 2, 3]);
  assert.equal(d.stopped, 4);
  assert.equal(d.zeroCutoff, 1);
  assert.ok(d.products[1] < d.zeroCutoff);
  assert.ok(d.products[4] > d.cutoff && d.products[5] < d.cutoff);
  assert.deepEqual(
    d.histStats.map((h) => [h.n, h.late]),
    [
      [5000, 126],
      [5000, 577],
    ],
  );
  assert.equal((d.histStats[1].variance / d.histStats[1].mean).toFixed(2), '4.65');
  assert.equal((e.survive(150) / e.survive(50)).toFixed(8), e.survive(100).toFixed(8));
  assert.equal(requests.filter((r) => r.late).length, 6);
  assert.equal(latePrefixes[0][20], requests.filter((r) => r.late).length);
  assert.equal(latePrefixes[0][10000], 1747);
  assert.equal(e.budget, 29956);
  assert.ok(e.empty(e.budget) <= 0.05 && e.empty(e.budget - 1) > 0.05);
  assert.equal(e.empty(5000).toFixed(3), '0.607');
  assert.deepEqual(
    data.replicaCounts.map((row) => row.at(-1)),
    [12, 17],
  );
  assert.deepEqual(data.replicaCounts[0], [16, 14, 16, 12]);
  assert.deepEqual(e.prior, [2, 2]);
  assert.deepEqual(e.posterior, [10, 4]);
  assert.equal(e.betaDensity(0.25, e.prior), e.betaDensity(0.75, e.prior));
  assert.ok(e.betaDensity(0.5, e.prior) > e.betaDensity(0.75, e.prior));
  assert.ok(e.betaDensity(0.75, e.posterior) > e.betaDensity(0.5, e.posterior));
  assert.ok(
    Math.abs(e.betaDensity(0.5, e.posterior) / e.betaDensity(0.6, e.posterior) - e.mh[1]) < 1e-12,
  );
  assert.deepEqual(
    e.tailWindows.map(({ states }) => states.length),
    [16, 16],
  );
  assert.deepEqual(
    e.tailWindows.map(({ first, states }) =>
      states.flatMap((v, i) => (v > e.tailThreshold ? [first + i] : [])),
    ),
    [
      [23, 24, 25],
      [94, 101, 103],
    ],
  );
  assert.equal(e.mh[1].toFixed(3), '0.379');
  assert.equal(e.mh[2], 0.5 * e.mh[1]);
  assert.deepEqual(
    [
      e.recordMove(0.5, 0.6, 1, e.mh[0]),
      e.recordMove(0.6, 0.5, 0.4, e.mh[1]),
      e.recordMove(0.6, 0.5, 0.25, e.mh[2]),
    ],
    [0.6, 0.6, 0.6],
  );
  assert.equal(metropolisAcceptance(0.5, 1.02), 0);
  assert.equal(data.chains[0].first240[1], data.chains[0].first240[2]);
  assert.deepEqual(e.gibbs[1], [0.8 * e.gibbs[0][1], e.gibbs[0][1]]);
  assert.equal((e.gibbs[1][0] * 0.8).toFixed(2), e.gibbs[2][1].toFixed(2));
  assert.deepEqual(
    s.firstBurst.map((r) => r.total),
    [50, 90, 130],
  );
  assert.deepEqual(
    [1, 2].map((n) => s.pool(n).filter((r) => r.total <= 40).length),
    [2, 4],
  );
  assert.deepEqual(
    s.pool(2).map((r) => r.start),
    [0, 5, 20, 25],
  );
  assert.equal(mm1Means(19, 20).queue, 0.95);
  assert.equal(mm1Means(20, 20).stable, false);
  assert.deepEqual(
    [1, 0.3, 2].map((t) => s.tokens[s.choose(tokenProbabilities(t), s.rank)]),
    ['clear', 'blue', 'clear'],
  );
  const kept = s.keepNucleus(tokenProbabilities(2), 0.9);
  assert.equal(kept[3], 0);
  assert.ok(Math.abs(sum(kept) - 1) < 1e-12 && kept.slice(0, 3).every((x) => x > 0));
  assert.equal(s.perturbed.indexOf(Math.max(...s.perturbed)), 1);
  assert.equal(data.launch.p95_seconds.toFixed(2), '15.69');
  assert.deepEqual(
    s.pairs.map((p) => sum(s.costlySlow(p).map(Number))),
    [2, 0, 1],
  );
  assert.deepEqual(s.costlySlow(s.pairs[2]), [false, false, true, false]);
  assert.equal(Math.max(...s.toyKs.map((r) => r.gap)), 0.4);
  s.distances.forEach((v, i) => assert.ok(Math.abs(v - data.ksDistances[i]) < 1e-5));
  assert.equal(cohort.byTen / cohort.byFifteen, 0.8);
  assert.equal(cohort.byTen / cohort.size, 0.64);
  assert.equal(targetRank - cohort.byFifteen, 38);
  return true;
}

export default { title: 'Will the Reply Beat the Timer?', preparePicture: prepareCaptions, draw, check };
