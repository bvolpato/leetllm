import { stageLesson } from '../lib/stage-lesson.mjs';
import { createDefaults } from '../films/attention/defaults.mjs';
import { buildVectors } from '../films/attention/stages/vectors.mjs';
import { buildScore } from './attention/score.mjs';
import { buildSoftmax } from '../films/attention/stages/softmax.mjs';
import { buildMix } from '../films/attention/stages/mix.mjs';
import { buildMatrix } from '../films/attention/stages/matrix.mjs';
import { buildMask } from '../films/attention/stages/mask.mjs';
import { buildWhyScale } from '../films/attention/stages/why-scale.mjs';
import { buildTypes } from '../films/attention/stages/types.mjs';
import { buildHeads } from './attention/heads.mjs';
import { buildPaperReference } from '../films/attention/stages/paper-reference.mjs';
import { buildCost } from '../films/attention/stages/cost.mjs';
import { buildDecode } from '../films/attention/stages/decode.mjs';
import { buildStable } from '../films/attention/stages/stable.mjs';
import { buildFlash } from './attention/flash.mjs';
import { buildMistakes } from '../films/attention/stages/mistakes.mjs';
import { buildHook } from './attention/hook.mjs';
import { buildLearn } from './attention/learn.mjs';
import { buildYourTurn, buildClose } from './attention/transfer.mjs';

export {
  Q,
  K,
  V,
  SCORES,
  SCALED,
  WEIGHTS,
  OUTPUT,
  COLUMN_SUMS,
  SHORT_KEY,
  LONG_KEY,
  EXPS,
  DROPPED_SHARE,
  DROPPED_OUTPUT,
  HEAD2,
  HEAD2_SCORES,
  HEAD2_WEIGHTS,
  HEAD2_OUTPUT,
  UNSCALED_WEIGHTS,
  TIED_SLOPE,
  LEAD_SLOPE,
  GAP_SHARES,
  BIRDS_PULL,
  SCORE_BYTES,
  cacheBytes,
  STABLE_SHARES,
  FP16_MAX,
  TRACE,
  NEW_STATE,
  NEW_QUERY,
  NEW_SCORES,
  NEW_WEIGHTS,
  NEW_OUTPUT,
} from '../films/attention/model.mjs';
export default stageLesson({ look: 'midnight', bloom: 0.13 }, (stage, narration) => {
  const defaults = createDefaults(stage);
  const sentence = buildHook(stage, narration, defaults);
  const geometry = buildVectors(stage, narration, defaults);
  buildScore(stage, narration, defaults, geometry);
  buildSoftmax(stage, narration, defaults);
  buildMix(stage, narration, defaults, sentence);
  buildMatrix(stage, narration, defaults, geometry);
  buildMask(stage, narration, defaults);
  buildWhyScale(stage, narration, defaults);
  buildTypes(stage, narration, defaults);
  buildHeads(stage, narration, defaults);
  buildPaperReference(stage, narration, sentence);
  buildLearn(stage, narration, defaults);
  buildCost(stage, narration, defaults);
  buildDecode(stage, narration, defaults);
  buildStable(stage, narration, defaults);
  buildFlash(stage, narration, defaults);
  buildMistakes(stage, narration, defaults);
  const read = buildYourTurn(stage, narration, defaults);
  buildClose(stage, narration, defaults, read);
});
