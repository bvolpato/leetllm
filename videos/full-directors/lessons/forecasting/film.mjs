import assert from 'node:assert/strict';
import { studio, mean, sum } from './instrument.mjs';
import * as m from './observatory.mjs';
import {
  opening,
  calendar,
  decompose,
  seasons,
  monday,
  reach,
  backtest,
  sarimax,
  features,
  horizon,
} from './origin.mjs';
import {
  patches,
  generations,
  errorLedger,
  tariff,
  printshop,
  empirical,
  gaussian,
  finite,
  adaptive,
} from './calibration.mjs';
import {
  routing,
  volume,
  relay,
  joint,
  usefulness,
  identity,
  gates,
  narrower,
  wrap,
} from './operations.mjs';

const scenes = [
  opening,
  calendar,
  decompose,
  seasons,
  monday,
  reach,
  backtest,
  sarimax,
  features,
  horizon,
  patches,
  generations,
  errorLedger,
  tariff,
  printshop,
  empirical,
  gaussian,
  finite,
  adaptive,
  routing,
  volume,
  (p) => relay(p, 0),
  (p) => relay(p, 1),
  joint,
  usefulness,
  identity,
  gates,
  narrower,
  wrap,
  (p) => relay(p, 2),
];

function check() {
  const { counts, actual, errors, earlier, baseline, observed, width, streams } = m;
  assert.deepEqual(
    m.rows.map(
      (r) => Number(new Date(r.date).getTime()) - Number(new Date(m.rows[0].date).getTime()),
    ),
    counts.map((_, i) => i * 86400000),
  );
  assert.deepEqual(
    [baseline, observed, observed - baseline, baseline - width, baseline + width],
    [132, 160, 28, 129, 135],
  );
  assert.deepEqual([counts[19], counts[20], m.rows[25].launch_event], [83, 78, true]);
  assert.equal(mean(counts.slice(0, 7)), 105);
  assert.equal(105 + m.offset + m.launch, 152);
  assert.equal(observed - (105 + m.offset + m.launch), 8);
  const desc = m.seasonalDescription(120);
  assert.deepEqual([desc.additive, desc.proportional.toFixed(2)], [147, '150.86']);
  assert.deepEqual(
    [Math.abs(actual[0] - counts[20]), Math.abs(actual[0] - m.forecast[0])],
    [25, 1],
  );
  assert.equal(m.weeklyLookup(27, 20).value, 78);
  assert.throws(() => m.weeklyLookup(28, 20));
  assert.equal(counts[28 - 2 * 7], 104);
  assert.equal(m.mae(earlier.slice(7)).toFixed(1), '0.9');
  assert.equal(observed - m.launch - baseline, 8);
  assert.equal(Math.floor((336 - 16) / 8) + 1, m.patchContract().unpadded);
  assert.deepEqual([m.patchContract().tokens, m.patchContract().mapRatio], [42, 64]);
  assert.deepEqual(
    m.chronosBlocks.map((block) => block.map(({ date }) => Number(date.slice(-2)))),
    [
      [5, 6],
      [7, 8],
      [9, 10],
      [11, 12],
    ],
  );
  assert.deepEqual(
    m.chronosBlocks.flat().map(({ volume, transformed }) => [volume, transformed.toFixed(2)]),
    [
      [100, '-0.26'],
      [112, '0.41'],
      [115, '0.56'],
      [118, '0.70'],
      [132, '1.23'],
      [82, '-1.07'],
      [76, '-1.27'],
      [102, '-0.15'],
    ],
  );
  assert.deepEqual(
    m.holdout.map(({ date, launch_event }, i) => [date, errors[i], launch_event]),
    [
      ['2026-01-26', -1, false],
      ['2026-01-27', 3, false],
      ['2026-01-28', -2, false],
      ['2026-01-29', 1, false],
      ['2026-01-30', 28, true],
      ['2026-01-31', 1, false],
      ['2026-02-01', -1, false],
    ],
  );
  assert.deepEqual(errors, [-1, 3, -2, 1, 28, 1, -1]);
  assert.deepEqual(
    [sum(errors), sum(errors.map(Math.abs)), m.mae(errors).toFixed(1)],
    [29, 37, '5.3'],
  );
  assert.deepEqual([m.pinball(110, 100, 0.9), Number(m.pinball(90, 100, 0.9).toFixed(2))], [9, 1]);
  for (let f = 10; f <= 100; f++) assert.ok(Math.abs(m.rail(m.mornings, f).average - 8.1) < 1e-10);
  assert.ok(m.rail(m.mornings, 9).average > 8.1 && m.rail(m.mornings, 101).average > 8.1);
  assert.deepEqual(
    [9, 10].map((f) => m.rail(m.mornings, f).fit),
    [0, 9],
  );
  assert.deepEqual(
    [10, 39, 40].map((f) => m.rail(m.schoolOrder, f).fit),
    [8, 8, 9],
  );
  assert.equal(m.rail(m.mornings, 19).large.toFixed(1), '72.9');
  assert.deepEqual(
    [mean(earlier), sum(earlier.map((v) => v * v)), m.normalRMS.toFixed(2)],
    [0.5, 43, '1.75'],
  );
  assert.equal(m.covered(width, earlier), 14);
  assert.deepEqual([m.covered(3), m.covered(2)], [6, 5]);
  assert.deepEqual(
    errors.flatMap((e, i) => (Math.abs(e) > 2 ? [i] : [])),
    [1, 4],
  );
  assert.deepEqual(m.conformalRank(14), { rank: 15, finite: false });
  assert.deepEqual(m.conformalRank(19), { rank: 19, finite: true });
  assert.equal(m.extended[m.conformalRank(19).rank - 1], 4);
  const a = m.alphaUpdate(0.1, 0.1, 0.05, 1);
  assert.deepEqual([a.toFixed(3), m.alphaUpdate(a, 0.1, 0.05, 0).toFixed(3)], ['0.055', '0.060']);
  assert.deepEqual(
    [m.route(m.docket, false), m.route(m.docket, true)],
    ['Review planned launch', 'Page for capacity impact'],
  );
  assert.deepEqual(
    streams.map((vs) =>
      m
        .stateTrace(vs)
        .filter((s) => s.transition)
        .map((s) => s.minute),
    ),
    [
      [5, 20],
      [5, 35],
      [15, 35],
    ],
  );
  for (const vs of streams) {
    const trace = m.stateTrace(vs);
    for (const [i, s] of trace.entries())
      if (s.error === null)
        assert.deepEqual([s.breaches, s.clean, s.active], [0, 0, trace[i - 1].active]);
  }
  assert.deepEqual(
    [
      [1, -1],
      [5, 5],
    ].map((v) => {
      const d = m.diagonalProjection(v);
      return [d.inside, d.score];
    }),
    [
      [true, 2],
      [false, 0],
    ],
  );
  assert.deepEqual(m.auditLabels(m.labels), {
    alerted: 3,
    actionable: 3,
    caught: 2,
    precision: 2 / 3,
    recall: 2 / 3,
  });
  for (const change of [false, true]) {
    const d = m.deduplicateEvents(m.eventRows(change));
    assert.deepEqual(
      [d.raw, d.unique.length, d.duplicates, d.conflicts.length],
      [3, 2, Number(!change), Number(change)],
    );
    assert.equal(d.unique[0].job_id, 'batch-100');
  }
  assert.equal(m.checks.length, 9);
  assert.ok(m.checks.every(([, pass]) => pass));
  assert.ok(m.hasFields([]));
  assert.ok(!m.hasFields([{}]));
  assert.equal(m.mae(m.routineErrors), 1.5);
}

export default {
  title: 'Forecast the Next Count and Audit the Alert',
  preparePicture(schedule) {
    const phrases = {
      'c29-b02': ['Across those seven days', 'six observations landed inside the band', 'The average absolute miss was five point three jobs', 'Keep the launch day in the overall score', 'and also look at the six routine days', 'Their average absolute miss was one and a half jobs'],
      'c29-b03': ['For the original Friday', 'the record assigns capacity operations a review', 'Its resolution is pending'],
    };
    for (const entry of schedule) {
      if (!phrases[entry.beat.id]) continue;
      for (const phrase of phrases[entry.beat.id]) entry.markCaption(phrase);
      entry.cueWordIndices = new Set(entry.cueWordIndices);
    }
  },
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](studio(ctx, clock));
  },
  check,
};
