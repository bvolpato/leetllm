import { opening, lineage, coverage, growth, evolution, execute, verifier } from './search.mjs';
import {
  overlap,
  directions,
  judge,
  admission,
  economics,
  preference,
  dependencies,
} from './admission.mjs';
import { sampling, retention, identity, experiment, releasePractice } from './evaluation.mjs';
import { check } from './specimens.mjs';

const chapters = [
  opening,
  lineage,
  coverage,
  growth,
  evolution,
  execute,
  verifier,
  overlap,
  directions,
  judge,
  admission,
  economics,
  preference,
  dependencies,
  sampling,
  retention,
  identity,
  experiment,
  releasePractice,
];
export default {
  title: 'Build, Verify and Evaluate Synthetic Training Data',
  draw(ctx, clock) {
    chapters[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
