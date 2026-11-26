// Pure Cinema Vizmatic 0.10.0 stage film for Sentence Embeddings & Contrastive Learning (30 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyContrastiveInvariants } from './parts.mjs';
import alignmentUniformity from './scenes/alignment-uniformity.mjs';
import architectures from './scenes/architectures.mjs';
import batchIdentity from './scenes/batch-identity.mjs';
import dropoutViews from './scenes/dropout-views.mjs';
import encode from './scenes/encode.mjs';
import evaluationScope from './scenes/evaluation-scope.mjs';
import falseNegatives from './scenes/false-negatives.mjs';
import freshEmbedding from './scenes/fresh-embedding.mjs';
import geometry from './scenes/geometry.mjs';
import intro from './scenes/intro.mjs';
import lossNumerics from './scenes/loss-numerics.mjs';
import maxsimReadout from './scenes/maxsim-readout.mjs';
import miningLoop from './scenes/mining-loop.mjs';
import multiplePositives from './scenes/multiple-positives.mjs';
import negatives from './scenes/negatives.mjs';
import nestedLoss from './scenes/nested-loss.mjs';
import objective from './scenes/objective.mjs';
import orderCollision from './scenes/order-collision.mjs';
import pairSupervision from './scenes/pair-supervision.mjs';
import poolingTensor from './scenes/pooling-tensor.mjs';
import prefixFailure from './scenes/prefix-failure.mjs';
import releaseMetrics from './scenes/release-metrics.mjs';
import retrieval from './scenes/retrieval.mjs';
import scores from './scenes/scores.mjs';
import shortlistBudget from './scenes/shortlist-budget.mjs';
import taskFormat from './scenes/task-format.mjs';
import teacherMargin from './scenes/teacher-margin.mjs';
import temperatureGradient from './scenes/temperature-gradient.mjs';
import transfer from './scenes/transfer.mjs';
import tripletMargin from './scenes/triplet-margin.mjs';

export default cinematicLesson({
  id: 'contrastive-learning',
  accent: COSMOS.cyan,
  invariants: verifyContrastiveInvariants,
  scenes: {
    intro,
    'order-collision': orderCollision,
    encode,
    'pooling-tensor': poolingTensor,
    scores,
    objective,
    'loss-numerics': lossNumerics,
    'triplet-margin': tripletMargin,
    'temperature-gradient': temperatureGradient,
    geometry,
    'alignment-uniformity': alignmentUniformity,
    'pair-supervision': pairSupervision,
    'dropout-views': dropoutViews,
    negatives,
    'batch-identity': batchIdentity,
    'false-negatives': falseNegatives,
    'multiple-positives': multiplePositives,
    'mining-loop': miningLoop,
    'teacher-margin': teacherMargin,
    architectures,
    'maxsim-readout': maxsimReadout,
    'task-format': taskFormat,
    'prefix-failure': prefixFailure,
    'nested-loss': nestedLoss,
    retrieval,
    'shortlist-budget': shortlistBudget,
    'evaluation-scope': evaluationScope,
    'release-metrics': releaseMetrics,
    transfer,
    'fresh-embedding': freshEmbedding,
  },
});
