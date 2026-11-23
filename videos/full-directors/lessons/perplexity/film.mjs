import assert from 'node:assert/strict';
import { canvas, fix, cat, fresh, rain, loss, bytes, rate, sum } from './studio.mjs';
import { openingShares, cover, prefixes, curve, mean, choices, microtype } from './probability.mjs';
import {
  objective,
  logspace,
  aggregate,
  ruler,
  normalization,
  stable,
  logits,
  pool,
  workers,
  normalize,
} from './evaluation.mjs';
import {
  contextWindow,
  batch,
  protocol,
  provenance,
  windows,
  targetPositions,
  padded,
  validCount,
  rowLosses,
  training,
  held,
  renamed,
  checkpoints,
  checkpointPPL,
} from './bookkeeping.mjs';
import {
  report,
  incident,
  exportJob,
  byteContest,
  reportFor,
  resample,
  pairedDraw,
  policy,
  job,
  incidentAnswers,
  jobAnswers,
  matching,
} from './decisions.mjs';

const scenes = [
  cover,
  prefixes,
  curve,
  mean,
  choices,
  objective,
  logspace,
  aggregate,
  ruler,
  normalization,
  contextWindow,
  batch,
  protocol,
  provenance,
  report,
  incident,
  exportJob,
  byteContest,
];
function draw(ctx, clock) {
  scenes[clock.beat.chapterIndex](canvas(ctx), clock);
}
function check() {
  assert.equal(sum(openingShares.map((s) => s[1])), 1);
  assert.deepEqual(
    openingShares.find(([w]) => w === 'under'),
    ['under', 0.3],
  );
  assert.equal(fix(loss(cat.probs)), '3.219');
  assert.equal(fix(Math.exp(loss(cat.probs) / 3), 2), '2.92');
  for (const letter of ['A', 'B']) {
    const type = microtype(letter);
    assert.equal(type.length, 100);
    assert.equal(type.filter((c) => c.letter === letter).length, 1);
  }
  const a = stable(logits, 0),
    b = stable(logits, 1);
  assert.deepEqual(a.shifted, [0, -2, -3]);
  assert.equal(fix(a.nll), '0.170');
  assert.deepEqual(a.probs, stable(a.shifted, 0).probs);
  assert.equal(fix(b.nll - a.nll), '2.000');
  assert.equal(Math.exp(-5000 * a.nll), 0);
  assert.ok(Number.isFinite(a.nll * 5000));
  const corpus = pool(workers);
  assert.equal(corpus.total, 17);
  assert.equal(corpus.n, 10);
  assert.equal(fix(corpus.ppl, 2), '5.47');
  assert.equal(pool([]).mean, null);
  assert.equal(bytes(fresh.pieces.join('')), 16);
  assert.equal(fix(rate(loss(fresh.probs), 16)), '0.415');
  for (const value of ['Ａ  a', 'A a', 'a a']) assert.equal(normalize(value), 'a a');
  assert.equal(bytes('Ａ  a'), 6);
  assert.equal(bytes(normalize('Ａ  a')), 3);
  assert.equal(fix(rate(1.2, 6)), '0.289');
  assert.equal(fix(rate(1.2, 3)), '0.577');
  for (const w of windows) {
    const scored = targetPositions(w);
    assert.ok(scored.every((i) => i > w[0] && i < w[1]));
  }
  assert.deepEqual(windows.flatMap(targetPositions), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(validCount(padded), 3);
  assert.equal(fix(sum(rowLosses.flat()) / 3, 1), '0.8');
  assert.deepEqual(
    checkpoints.map((r) => fix(checkpointPPL(r), 2)),
    ['3.18', '2.31'],
  );
  assert.equal(held[0].id, training[2].id);
  assert.notEqual(renamed.id, training[2].id);
  assert.equal(renamed.text, training[2].text);
  for (const n of [-1, true, 1.5]) assert.equal(reportFor(1, n), 'invalid count');
  assert.equal(reportFor(0, 0), 'undefined mean');
  assert.equal(reportFor(NaN, 1), 'invalid loss');
  assert.equal(reportFor(Infinity, 1), 'infinite loss');
  assert.deepEqual(reportFor(1000, 1), { mean: 1000, ppl: Infinity });
  assert.deepEqual(resample(['A', 'A']), ['Doc 1', 'Doc 2', 'Doc 1', 'Doc 2']);
  const paired = pairedDraw(['A', 'A']);
  assert.deepEqual(
    paired.totals.map((v) => fix(v, 1)),
    ['6.0', '5.2', '6.0'],
  );
  assert.equal(fix(paired.difference), '-0.133');
  for (const [answers, contract] of [
    [incidentAnswers, policy],
    [jobAnswers, job],
  ]) {
    assert.deepEqual(
      answers.map((a) => matching(a, contract)),
      [
        [true, false, false],
        [true, true, true],
      ],
    );
  }
  assert.equal(bytes(rain.line), 14);
  for (const row of rain.readings) assert.equal(row.pieces.join(''), rain.line);
  assert.deepEqual(
    rain.readings.map((r) => r.pieces.length),
    [4, 14],
  );
  assert.deepEqual(
    rain.readings.map((r) => fix(Math.exp(r.nats / r.pieces.length), 2)),
    ['8.17', '1.90'],
  );
  assert.deepEqual(
    rain.readings.map((r) => fix(rate(r.nats, bytes(rain.line)))),
    ['0.866', '0.927'],
  );
}
export default {
  title: 'Measuring a Model’s Surprise',
  preparePicture(schedule) {
    const phrases = {
      'c04-b02': ['Set the three lengths end to end', 'Together they measure three point two one nine nats', 'Cut the total into three equal lengths', 'Each measures about one point zero seven three nats', 'This is the mean negative log likelihood', 'per scored token under the supplied context'],
      'c04-b03': ['Here the score is about two point nine two', 'An equally likely choice problem', 'with that effective branching factor', 'has the same average surprise', 'The interpretation gives the loss a familiar scale', 'while the model’s actual vocabulary stays unchanged'],
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
