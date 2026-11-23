import assert from 'node:assert/strict';
import * as bench from './workshop.mjs';
import * as measures from './measurements.mjs';
import * as files from './artifacts.mjs';
import {
  checkStudy,
  opening,
  tapeState,
  restore,
  controlState,
  verdict,
  shaping,
} from './study.mjs';

const scenes = [
  bench.race,
  bench.paperStudy,
  bench.earlyPairs,
  bench.predicates,
  bench.history,
  bench.boundary,
  bench.environment,
  bench.bonus,
  bench.telescoping,
  bench.limits,
  (c, k) => bench.qtable(c, k, false),
  (c, k) => bench.qtable(c, k, true),
  bench.tapes,
  bench.control,
  measures.covariance,
  measures.freeze,
  measures.ablations,
  measures.attempts,
  measures.deltaPlot,
  measures.drawPairs,
  measures.bootstrap,
  measures.lowerLimit,
  measures.tied,
  measures.frozenPolicy,
  measures.workBudget,
  files.provenance,
  files.manifest,
  files.digests,
  files.exporter,
  files.failed,
  files.branching,
  files.milestones,
  files.defend,
  files.teams,
  measures.rebuild,
  measures.finalPractice,
];
function state(index, cues = {}) {
  return { beat: { beatIndex: index }, reveal: (phrase) => cues[phrase] ?? 0 };
}
function check() {
  checkStudy();
  assert.deepEqual(opening(state(0, { 'Seed fourteen': 1 })).pos, [2, 5]);
  assert.deepEqual(opening(state(1, { 'Play the last move': 0.5 })).pos, [1.5, 5.5]);
  assert.deepEqual(opening(state(2)).pos, [1, 6]);
  assert.deepEqual(tapeState(state(1)).used, [6, 12]);
  assert.deepEqual(tapeState(state(1)).pointers, [
    [0, 5],
    [0, 11],
  ]);
  assert.deepEqual(tapeState(state(2)).pointers, [
    [1, 0],
    [1, 0],
  ]);
  assert.deepEqual(tapeState(state(3)).pointers, [
    [1, 3],
    [1, 3],
  ]);
  assert.deepEqual(controlState(state(2, { 'let that same right action slip left': 1 })).rows, [
    [0, 0],
    [0, 0],
  ]);
  assert.equal(controlState(state(3, { 'Our faulty candidate credits left': 1 })).match, false);
  assert.equal(controlState(state(4, { 'Write to the intended action': 1 })).match, true);
  assert.deepEqual(
    [
      restore(state(0)).gain,
      restore(state(1, { 'Its nine lost goals': 1 })).gain,
      restore(state(2)).gain,
    ],
    [136, 127, 103],
  );
  assert(!restore(state(2)).answer);
  assert(!verdict({ early: { mean: 10, low: 0 }, final: { low: -2, mean: 0, high: 2 } }).early);
  for (const path of [
    [0, 1, 2, 3, 4, 5, 6],
    [0, 1, 0, 1, 2, 3, 4, 5, 6],
  ]) {
    const total = path.slice(1).reduce((n, s, i) => n + 0.95 ** i * shaping(path[i], s), 0);
    assert(Math.abs(total - 1) < 1e-12);
  }
  assert.equal(scenes.length, 36);
  return true;
}
export default {
  title: 'What Makes a Learning Result Believable?',
  draw(c, k) {
    scenes[k.beat.chapterIndex](c, k);
  },
  check,
};
