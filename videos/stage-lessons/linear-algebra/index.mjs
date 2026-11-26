// Linear Algebra: Which Direction Can We Afford to Lose?
// 28-scene full-bleed cinematic stage lesson (vizmatic@0.10.0+).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyLinearAlgebraInvariants } from './shared.mjs';
import { basis, commonOutput, contrastOutput, intro, tickets } from './scenes/act1-directions.mjs';
import {
  gram,
  gramAction,
  svdEmbed,
  svdRotate,
  svdSign,
  svdStretch,
} from './scenes/act2-gram-svd.mjs';
import {
  pcaCenter,
  pcaNew,
  pcaSparse,
  pcaSpread,
  retrievalCheck,
  truncate,
} from './scenes/act3-compression-pca.mjs';
import {
  fitProjection,
  rankCollapse,
  rankFit,
  rankNull,
} from './scenes/act4-leastsquares-rank.mjs';
import {
  conditioningMap,
  conditioningNoise,
  conditioningSolve,
  decision,
  energyCutoff,
  lowRankUpdate,
  newRoutingObjective,
} from './scenes/act5-conditioning-lora-decision.mjs';

export default cinematicLesson({
  id: 'linear-algebra',
  accent: COSMOS.cyan,
  invariants: verifyLinearAlgebraInvariants,
  scenes: {
    intro,
    tickets,
    basis,
    'common-output': commonOutput,
    'contrast-output': contrastOutput,
    gram,
    'gram-action': gramAction,
    'svd-rotate': svdRotate,
    'svd-stretch': svdStretch,
    'svd-embed': svdEmbed,
    'svd-sign': svdSign,
    truncate,
    'retrieval-check': retrievalCheck,
    'pca-center': pcaCenter,
    'pca-spread': pcaSpread,
    'pca-new': pcaNew,
    'pca-sparse': pcaSparse,
    'fit-projection': fitProjection,
    'rank-collapse': rankCollapse,
    'rank-fit': rankFit,
    'rank-null': rankNull,
    'conditioning-map': conditioningMap,
    'conditioning-noise': conditioningNoise,
    'conditioning-solve': conditioningSolve,
    'energy-cutoff': energyCutoff,
    'low-rank-update': lowRankUpdate,
    'new-routing-objective': newRoutingObjective,
    decision,
  },
});
