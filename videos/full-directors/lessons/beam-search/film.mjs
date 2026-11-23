import { studio } from './studio.mjs';
import { checkExamples } from './examples.mjs';
import { opening, space, softmax, limits, greedy, penalty, temperature, stream } from './press.mjs';
import {
  openings,
  conditional,
  frontier,
  lattice,
  finish,
  length,
  work,
  squeeze,
  conventions,
  replayMia,
} from './mia.mjs';
import { rank, cumulative, relative, ties, compose, practice } from './filters.mjs';
import {
  grammar,
  laws,
  outcome,
  processScores,
  thoughts,
  balance,
  verifyBlock,
  auditAnswers,
} from './judgments.mjs';

const painters = [
  opening,
  space,
  softmax,
  limits,
  greedy,
  openings,
  conditional,
  frontier,
  lattice,
  finish,
  length,
  work,
  squeeze,
  conventions,
  penalty,
  temperature,
  stream,
  rank,
  cumulative,
  relative,
  ties,
  compose,
  grammar,
  laws,
  outcome,
  processScores,
  thoughts,
  balance,
  verifyBlock,
  auditAnswers,
  replayMia,
  practice,
];

export default {
  title: 'From Scores to a Sentence',
  check: checkExamples,
  draw(ctx, clock) {
    const stage = studio(ctx, clock);
    stage.ground();
    painters[clock.beat.chapterIndex](stage);
  },
};
