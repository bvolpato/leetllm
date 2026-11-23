import { stageLesson } from '../lib/stage-lesson.mjs';
import { createDefaults } from '../films/tokenization/defaults.mjs';
import { buildHook } from './tokenization/hook.mjs';
import { buildCut } from '../films/tokenization/stages/cut.mjs';
import { buildMerges } from '../films/tokenization/stages/merges.mjs';
import { buildUnseen } from './tokenization/unseen.mjs';
import { buildBoundaries } from '../films/tokenization/stages/boundaries.mjs';
import { buildBytes } from '../films/tokenization/stages/bytes.mjs';
import { buildWordpieceScore } from '../films/tokenization/stages/wordpiece-score.mjs';
import { buildWordpieceMatch } from '../films/tokenization/stages/wordpiece-match.mjs';
import { buildSentencepiece } from '../films/tokenization/stages/sentencepiece.mjs';
import { buildUnigramPath } from '../films/tokenization/stages/unigram-path.mjs';
import { buildUnigramPrune } from './tokenization/unigram-prune.mjs';
import { buildRegularization } from '../films/tokenization/stages/regularization.mjs';
import { buildNormalization } from '../films/tokenization/stages/normalization.mjs';
import { buildLookup } from '../films/tokenization/stages/lookup.mjs';
import { buildEconomics } from '../films/tokenization/stages/economics.mjs';
import { buildInflation } from '../films/tokenization/stages/inflation.mjs';
import { buildNumbers } from '../films/tokenization/stages/numbers.mjs';
import { buildCodeWhitespace } from '../films/tokenization/stages/code-whitespace.mjs';
import { buildGlitch } from '../films/tokenization/stages/glitch.mjs';
import { buildRequest } from '../films/tokenization/stages/request.mjs';
import { buildYourTurn } from '../films/tokenization/stages/your-turn.mjs';
import { buildClose } from './tokenization/close.mjs';
export { trainMerges, applyRules, wordpiece } from '../films/tokenization/model.mjs';

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
    buildUnigramPrune(stage, narration, defaults);
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
    buildClose(stage, narration, defaults);
  },
);
