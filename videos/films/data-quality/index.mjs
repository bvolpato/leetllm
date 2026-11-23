import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import intake from './stages/intake.mjs';
import contractSemantics from './stages/contract-semantics.mjs';
import normalization from './stages/normalization.mjs';
import unicodeRecipe from './stages/unicode-recipe.mjs';
import duplicates from './stages/duplicates.mjs';
import split from './stages/split.mjs';
import groupLeakage from './stages/group-leakage.mjs';
import similarity from './stages/similarity.mjs';
import minhashRankings from './stages/minhash-rankings.mjs';
import lshBands from './stages/lsh-bands.mjs';
import clusterChain from './stages/cluster-chain.mjs';
import contamination from './stages/contamination.mjs';
import contaminationAudit from './stages/contamination-audit.mjs';
import privacy from './stages/privacy.mjs';
import privacySpans from './stages/privacy-spans.mjs';
import corpusSelection from './stages/corpus-selection.mjs';
import perplexity from './stages/perplexity.mjs';
import syntheticGates from './stages/synthetic-gates.mjs';
import release from './stages/release.mjs';
import candidateBuilder from './stages/candidate-builder.mjs';
import candidateContract from './stages/candidate-contract.mjs';
import coverageAudit from './stages/coverage-audit.mjs';
import versionTrust from './stages/version-trust.mjs';
import freshCandidate from './stages/fresh-candidate.mjs';
export { freshRows, referenceRows, splitHash } from './fixtures.mjs';
export {
  bandCandidates,
  candidateInvariants,
  candidateRejectReason,
  contaminationTrace,
  fixtureNormalize,
  idealCandidateProbability,
  leakageComparison,
  leakageSceneSnapshot,
  minhashCases,
  normalizationStates,
  prepareCandidate,
  pythonFixtureJSONL,
  referenceBytes,
  referenceCandidate,
  referenceDigest,
  referenceSplit,
  releaseTrace,
  shingleComparison,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'data-quality',
  validateModel,
  scenes: [
    intro,
    intake,
    contractSemantics,
    normalization,
    unicodeRecipe,
    duplicates,
    split,
    groupLeakage,
    similarity,
    minhashRankings,
    lshBands,
    clusterChain,
    contamination,
    contaminationAudit,
    privacy,
    privacySpans,
    corpusSelection,
    perplexity,
    syntheticGates,
    release,
    candidateBuilder,
    candidateContract,
    coverageAudit,
    versionTrust,
    freshCandidate,
  ],
});
export const draw = definition.draw;
export default definition;
