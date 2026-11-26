// Full-bleed dark-cinema 23-scene Transformer Architecture End-to-End stage lesson.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTransformerModel } from './parts.mjs';
import intro from './scenes/intro.mjs';
import embedding from './scenes/embedding.mjs';
import normalization from './scenes/normalization.mjs';
import mask from './scenes/mask.mjs';
import attention from './scenes/attention.mjs';
import residual from './scenes/residual.mjs';
import feedForward from './scenes/feed-forward.mjs';
import causality from './scenes/causality.mjs';
import logits from './scenes/logits.mjs';
import feedback from './scenes/feedback.mjs';
import positionDesigns from './scenes/position-designs.mjs';
import matchingScale from './scenes/matching-scale.mjs';
import parallelHeads from './scenes/parallel-heads.mjs';
import ffnVariants from './scenes/ffn-variants.mjs';
import normContracts from './scenes/norm-contracts.mjs';
import causalTraining from './scenes/causal-training.mjs';
import apiAlignment from './scenes/api-alignment.mjs';
import executableContracts from './scenes/executable-contracts.mjs';
import vocabularyContract from './scenes/vocabulary-contract.mjs';
import architectureVisibility from './scenes/architecture-visibility.mjs';
import realScale from './scenes/real-scale.mjs';
import failureContract from './scenes/failure-contract.mjs';
import freshDecoder from './scenes/fresh-decoder.mjs';

export default cinematicLesson({
  id: 'transformer',
  accent: COSMOS.cyan,
  invariants: verifyTransformerModel,
  scenes: {
    intro,
    embedding,
    normalization,
    mask,
    attention,
    residual,
    'feed-forward': feedForward,
    causality,
    logits,
    feedback,
    'position-designs': positionDesigns,
    'matching-scale': matchingScale,
    'parallel-heads': parallelHeads,
    'ffn-variants': ffnVariants,
    'norm-contracts': normContracts,
    'causal-training': causalTraining,
    'api-alignment': apiAlignment,
    'executable-contracts': executableContracts,
    'vocabulary-contract': vocabularyContract,
    'architecture-visibility': architectureVisibility,
    'real-scale': realScale,
    'failure-contract': failureContract,
    'fresh-decoder': freshDecoder,
  },
});
