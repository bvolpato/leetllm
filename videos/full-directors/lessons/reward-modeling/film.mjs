import assert from 'node:assert/strict';
import { state } from './art.mjs';
import { checkExamples } from './examples.mjs';
import {
  opening,
  likelihood,
  ballots,
  scorer,
  inputs,
  exactInputs,
  splitGroup,
  weighting,
} from './comparisons.mjs';
import { head, padding, probability, loss, stable, gradient } from './score-head.mjs';
import { fitHead, origin, center, calibration, correction, fresh } from './fit-and-test.mjs';
import {
  ensemble,
  benchmark,
  signals,
  artifact,
  support,
  finalTrial,
  replayState,
} from './policy-trial.mjs';

const painters = [
  opening,
  likelihood,
  ballots,
  scorer,
  inputs,
  exactInputs,
  splitGroup,
  weighting,
  head,
  padding,
  probability,
  loss,
  stable,
  gradient,
  fitHead,
  origin,
  center,
  calibration,
  correction,
  fresh,
  ensemble,
  benchmark,
  signals,
  artifact,
  support,
  finalTrial,
];
function draw(ctx, clock) {
  ctx.save();
  try {
    ctx.scale(2, 2);
    painters[clock.beat.chapterIndex](ctx, state(clock));
  } finally {
    ctx.restore();
  }
}
function check() {
  checkExamples();
  const cues = [
    'First the assistant holds',
    'Then the reviewer approves',
    'At step three',
    'A two passes',
  ];
  const replay = (through) =>
    replayState({ beat: 7, cue: (n, p) => n < 7 || cues.indexOf(p) <= through });
  assert.deepEqual(
    [-1, 0, 1, 2, 3].map((k) => {
      const s = replay(k);
      return [s.step, s.current.approved, s.current.granted, s.passed];
    }),
    [
      [0, false, false, false],
      [1, false, false, false],
      [2, true, false, false],
      [3, true, true, false],
      [3, true, true, true],
    ],
  );
}
export default {
  title: 'Reward Modeling: Scores, Data, Calibration and the Approval Rule',
  draw,
  check,
};
