import { checkGeometry } from './geometry.mjs';
import { opening, lookup, selection, concordance, chance, compression } from './lookup.mjs';
import { trainingWindow, trainingStep, draws, residual, spelling } from './training.mjs';
import { stretch, bankMix, midpoint, elmo, visibility, neighbors, pooling } from './context.mjs';
import { translated, anisotropy, contract, substitute, practice } from './retrieval.mjs';

const scenes = {
  c01: opening,
  c02: lookup,
  c03: selection,
  c04: concordance,
  c05: chance,
  c06: compression,
  c07: trainingWindow,
  c08: trainingStep,
  c09: draws,
  c10: residual,
  c11: spelling,
  c12: stretch,
  c13: bankMix,
  c14: midpoint,
  c15: elmo,
  c16: visibility,
  c17: neighbors,
  c18: pooling,
  c19: translated,
  c20: anisotropy,
  c21: contract,
  c22: substitute,
  c23: practice,
};
export default {
  title: 'Words as Points and Context as Motion',
  check: checkGeometry,
  draw(ctx, clock) {
    scenes[clock.beat.chapterId](ctx, clock);
  },
};
