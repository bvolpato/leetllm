import { stageLesson } from '../../lib/stage-lesson.mjs';
import { createDefaults } from './defaults.mjs';
import { buildHook } from './stages/hook.mjs';
import { buildVectors } from './stages/vectors.mjs';
import { buildScore } from './stages/score.mjs';
import { buildSoftmax } from './stages/softmax.mjs';
import { buildMix } from './stages/mix.mjs';
import { buildMatrix } from './stages/matrix.mjs';
import { buildMask } from './stages/mask.mjs';
import { buildWhyScale } from './stages/why-scale.mjs';
import { buildTypes } from './stages/types.mjs';
import { buildHeads } from './stages/heads.mjs';
import { buildPaperReference } from './stages/paper-reference.mjs';
import { buildLearn } from './stages/learn.mjs';
import { buildCost } from './stages/cost.mjs';
import { buildDecode } from './stages/decode.mjs';
import { buildStable } from './stages/stable.mjs';
import { buildFlash } from './stages/flash.mjs';
import { buildMistakes } from './stages/mistakes.mjs';
import { buildYourTurn } from './stages/your-turn.mjs';
import { buildClose } from './stages/close.mjs';
export default stageLesson(
  {
    look: 'midnight',
    bloom: 0.13,
  },
  (stage, narration) => {
    const defaults = createDefaults(stage);
    const sentenceWords = buildHook(stage, narration, defaults);
    const vectorGeometry = buildVectors(stage, narration, defaults);
    buildScore(stage, narration, defaults, vectorGeometry);
    buildSoftmax(stage, narration, defaults);
    buildMix(stage, narration, defaults, sentenceWords);
    buildMatrix(stage, narration, defaults, vectorGeometry);
    buildMask(stage, narration, defaults);
    buildWhyScale(stage, narration, defaults);
    buildTypes(stage, narration, defaults);
    buildHeads(stage, narration, defaults);
    buildPaperReference(stage, narration, sentenceWords);
    buildLearn(stage, narration, defaults);
    buildCost(stage, narration, defaults);
    buildDecode(stage, narration, defaults);
    buildStable(stage, narration, defaults);
    buildFlash(stage, narration, defaults);
    buildMistakes(stage, narration, defaults);
    buildYourTurn(stage, narration, defaults);
    buildClose(stage, narration, defaults);
  },
);
