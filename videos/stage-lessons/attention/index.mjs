// Full-bleed dark-cinema 19-scene Scaled Dot-Product Attention stage lesson.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyAttentionModel } from './parts.mjs';
import hook from './scenes/hook.mjs';
import vectors from './scenes/vectors.mjs';
import score from './scenes/score.mjs';
import softmaxScene from './scenes/softmax.mjs';
import mix from './scenes/mix.mjs';
import matrix from './scenes/matrix.mjs';
import mask from './scenes/mask.mjs';
import whyScale from './scenes/why-scale.mjs';
import types from './scenes/types.mjs';
import heads from './scenes/heads.mjs';
import paperReference from './scenes/paper-reference.mjs';
import learn from './scenes/learn.mjs';
import cost from './scenes/cost.mjs';
import decode from './scenes/decode.mjs';
import stable from './scenes/stable.mjs';
import flash from './scenes/flash.mjs';
import mistakes from './scenes/mistakes.mjs';
import yourTurn from './scenes/your-turn.mjs';
import close from './scenes/close.mjs';

export default cinematicLesson({
  id: 'attention',
  accent: COSMOS.cyan,
  invariants: verifyAttentionModel,
  scenes: {
    hook,
    vectors,
    score,
    softmax: softmaxScene,
    mix,
    matrix,
    mask,
    'why-scale': whyScale,
    types,
    heads,
    'paper-reference': paperReference,
    learn,
    cost,
    decode,
    stable,
    flash,
    mistakes,
    'your-turn': yourTurn,
    close,
  },
});
