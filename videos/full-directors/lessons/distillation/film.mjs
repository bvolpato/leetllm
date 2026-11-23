import { check } from './examples.mjs';
import { oneWord, compareWords, temperature, contributions, fit, scaling } from './impressions.mjs';
import { alignment, projection, response, prefixes } from './positions.mjs';
import { directions, sequences, cacheScene } from './distributions.mjs';
import { dataset, research, scope, generalization, release } from './release.mjs';

const scenes = [
  oneWord,
  compareWords,
  temperature,
  contributions,
  fit,
  scaling,
  alignment,
  projection,
  response,
  prefixes,
  directions,
  sequences,
  cacheScene,
  dataset,
  research,
  scope,
  generalization,
  release,
];
export default {
  title: 'Distillation: Match the Signal, Prefix and Release Contract',
  draw(ctx, clock) {
    scenes[clock.beat.chapterIndex](ctx, clock);
  },
  check,
};
