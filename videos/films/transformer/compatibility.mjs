import { EXTENDED_SCENES } from './fixtures.mjs';
import { withTransformerExtendedFrame, withTransformerLegacyFrame } from './defaults.mjs';
import { paintIntro } from './stages/intro.mjs';
import { paintEmbedding } from './stages/embedding.mjs';
import { paintNormalization } from './stages/normalization.mjs';
import { paintMask } from './stages/mask.mjs';
import { paintAttention } from './stages/attention.mjs';
import { paintResidual } from './stages/residual.mjs';
import { paintFeedForward } from './stages/feed-forward.mjs';
import { paintCausality } from './stages/causality.mjs';
import { paintLogits } from './stages/logits.mjs';
import { paintFeedback } from './stages/feedback.mjs';
import { paintPositionDesigns } from './stages/position-designs.mjs';
import { paintMatchingScale } from './stages/matching-scale.mjs';
import { paintParallelHeads } from './stages/parallel-heads.mjs';
import { paintFfnVariants } from './stages/ffn-variants.mjs';
import { paintNormContracts } from './stages/norm-contracts.mjs';
import { paintCausalTraining } from './stages/causal-training.mjs';
import { paintApiAlignment } from './stages/api-alignment.mjs';
import { paintExecutableContracts } from './stages/executable-contracts.mjs';
import { paintVocabularyContract } from './stages/vocabulary-contract.mjs';
import { paintArchitectureVisibility } from './stages/architecture-visibility.mjs';
import { paintRealScale } from './stages/real-scale.mjs';
import { paintFailureContract } from './stages/failure-contract.mjs';
import { paintFreshDecoder } from './stages/fresh-decoder.mjs';
function selectTransformerLegacy(ctx, scene, state, api, C, b, P, f) {
  if (scene.id === 'intro') {
    return paintIntro(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'embedding') {
    return paintEmbedding(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'normalization') {
    return paintNormalization(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'mask') {
    return paintMask(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'attention') {
    return paintAttention(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'residual') {
    return paintResidual(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'feed-forward') {
    return paintFeedForward(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'causality') {
    return paintCausality(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'logits') {
    return paintLogits(ctx, scene, state, api, C, b, P, f);
  } else if (scene.id === 'feedback') {
    return paintFeedback(ctx, scene, state, api, C, b, P, f);
  } else throw new Error('Unknown transformer scene ' + scene.id);
}
function selectTransformerExtended(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors) {
  if (id === 'position-designs') {
    return paintPositionDesigns(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'matching-scale') {
    return paintMatchingScale(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'parallel-heads') {
    return paintParallelHeads(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'ffn-variants') {
    return paintFfnVariants(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'norm-contracts') {
    return paintNormContracts(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'causal-training') {
    return paintCausalTraining(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'api-alignment') {
    return paintApiAlignment(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'executable-contracts') {
    return paintExecutableContracts(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'vocabulary-contract') {
    return paintVocabularyContract(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'architecture-visibility') {
    return paintArchitectureVisibility(
      ctx,
      scene,
      state,
      api,
      C,
      id,
      s,
      b,
      p,
      f,
      mix,
      known,
      colors,
    );
  } else if (id === 'real-scale') {
    return paintRealScale(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'failure-contract') {
    return paintFailureContract(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  } else if (id === 'fresh-decoder') {
    return paintFreshDecoder(ctx, scene, state, api, C, id, s, b, p, f, mix, known, colors);
  }
}
export function draw(ctx, scene, state, api) {
  if (EXTENDED_SCENES.has(scene.id))
    return withTransformerExtendedFrame(ctx, scene, state, api, selectTransformerExtended);
  withTransformerLegacyFrame(ctx, scene, state, api, selectTransformerLegacy);
}
