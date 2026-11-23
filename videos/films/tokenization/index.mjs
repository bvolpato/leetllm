import { stageLesson } from '../../lib/stage-lesson.mjs';
import { createDefaults } from './defaults.mjs';
import { buildHook } from './stages/hook.mjs';
import { buildCut } from './stages/cut.mjs';
import { buildMerges } from './stages/merges.mjs';
import { buildUnseen } from './stages/unseen.mjs';
import { buildBoundaries } from './stages/boundaries.mjs';
import { buildBytes } from './stages/bytes.mjs';
import { buildWordpieceScore } from './stages/wordpiece-score.mjs';
import { buildWordpieceMatch } from './stages/wordpiece-match.mjs';
import { buildSentencepiece } from './stages/sentencepiece.mjs';
import { buildUnigramPath } from './stages/unigram-path.mjs';
import { buildUnigramPrune } from './stages/unigram-prune.mjs';
import { buildRegularization } from './stages/regularization.mjs';
import { buildNormalization } from './stages/normalization.mjs';
import { buildLookup } from './stages/lookup.mjs';
import { buildEconomics } from './stages/economics.mjs';
import { buildInflation } from './stages/inflation.mjs';
import { buildNumbers } from './stages/numbers.mjs';
import { buildCodeWhitespace } from './stages/code-whitespace.mjs';
import { buildGlitch } from './stages/glitch.mjs';
import { buildRequest } from './stages/request.mjs';
import { buildYourTurn } from './stages/your-turn.mjs';
import { buildClose } from './stages/close.mjs';
export default stageLesson(
  {
    look: 'midnight',
    bloom: 0.1,
  },
  (stage, narration) => {
    const defaults = createDefaults(stage);
    buildHook(stage, narration, defaults);
    buildCut(stage, narration, defaults);
    const mergeRecipe = buildMerges(stage, narration, defaults);
    buildUnseen(stage, narration, defaults, mergeRecipe);
    buildBoundaries(stage, narration, defaults);
    buildBytes(stage, narration, defaults);
    buildWordpieceScore(stage, narration, defaults);
    buildWordpieceMatch(stage, narration, defaults);
    buildSentencepiece(stage, narration, defaults);
    const latticeLayout = buildUnigramPath(stage, narration, defaults);
    buildUnigramPrune(stage, narration, defaults, latticeLayout);
    buildRegularization(stage, narration, defaults, latticeLayout);
    buildNormalization(stage, narration, defaults);
    buildLookup(stage, narration, defaults);
    buildEconomics(stage, narration, defaults);
    buildInflation(stage, narration, defaults);
    buildNumbers(stage, narration, defaults);
    buildCodeWhitespace(stage, narration, defaults);
    buildGlitch(stage, narration, defaults);
    buildRequest(stage, narration, defaults);
    buildYourTurn(stage, narration, defaults);
    buildClose(stage, narration, defaults, latticeLayout);
  },
);
