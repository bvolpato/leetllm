import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import answerContractStage from './stages/answer-contract.mjs';
import ingestIdentityStage from './stages/ingest-identity.mjs';
import authorityScopeStage from './stages/authority-scope.mjs';
import eligibleStage from './stages/eligible.mjs';
import sourceRouterStage from './stages/source-router.mjs';
import retrievalArithmeticStage from './stages/retrieval-arithmetic.mjs';
import rrfRuleStage from './stages/rrf-rule.mjs';
import fusionStage from './stages/fusion.mjs';
import miniatureRunStage from './stages/miniature-run.mjs';
import packingStage from './stages/packing.mjs';
import exactSpanStage from './stages/exact-span.mjs';
import contextCompressionStage from './stages/context-compression.mjs';
import citationSupportStage from './stages/citation-support.mjs';
import untrustedSourceStage from './stages/untrusted-source.mjs';
import publishStage from './stages/publish.mjs';
import sseIdentityStage from './stages/sse-identity.mjs';
import typedReducerStage from './stages/typed-reducer.mjs';
import latencyStage from './stages/latency.mjs';
import clockArithmeticStage from './stages/clock-arithmetic.mjs';
import capacityStage from './stages/capacity.mjs';
import residentTensorStage from './stages/resident-tensor.mjs';
import capacityBoundsStage from './stages/capacity-bounds.mjs';
import economicsStage from './stages/economics.mjs';
import routeCostsStage from './stages/route-costs.mjs';
import cacheAuthorityStage from './stages/cache-authority.mjs';
import labeledMetricsStage from './stages/labeled-metrics.mjs';
import failureAttributionStage from './stages/failure-attribution.mjs';
import freshSearchStage from './stages/fresh-search.mjs';
export { SEARCH_TEXT } from './fixtures.mjs';
export {
  fuse,
  rrfContributions,
  searchCosine,
  searchWords,
  sourceDigest,
  wordCount,
} from './arithmetic.mjs';
export {
  apply,
  capacityTeachingState,
  capacityTrace,
  checkedClocks,
  economicsTrace,
  freshSearchState,
  fusionTeachingState,
  lexicalScores,
  publicationTeachingState,
  quoteReceipt,
  sampleModel,
  searchCapacity,
  searchMetrics,
  searchRoutePlan,
  sharedFleet,
  strictPublication,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'design-llm-powered-search-engine',
  validateModel,
  scenes: [
    introStage,
    answerContractStage,
    ingestIdentityStage,
    authorityScopeStage,
    eligibleStage,
    sourceRouterStage,
    retrievalArithmeticStage,
    rrfRuleStage,
    fusionStage,
    miniatureRunStage,
    packingStage,
    exactSpanStage,
    contextCompressionStage,
    citationSupportStage,
    untrustedSourceStage,
    publishStage,
    sseIdentityStage,
    typedReducerStage,
    latencyStage,
    clockArithmeticStage,
    capacityStage,
    residentTensorStage,
    capacityBoundsStage,
    economicsStage,
    routeCostsStage,
    cacheAuthorityStage,
    labeledMetricsStage,
    failureAttributionStage,
    freshSearchStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['answer-contract', answerContractStage],
  ['ingest-identity', ingestIdentityStage],
  ['authority-scope', authorityScopeStage],
  ['eligible', eligibleStage],
  ['source-router', sourceRouterStage],
  ['retrieval-arithmetic', retrievalArithmeticStage],
  ['rrf-rule', rrfRuleStage],
  ['fusion', fusionStage],
  ['miniature-run', miniatureRunStage],
  ['packing', packingStage],
  ['exact-span', exactSpanStage],
  ['context-compression', contextCompressionStage],
  ['citation-support', citationSupportStage],
  ['untrusted-source', untrustedSourceStage],
  ['publish', publishStage],
  ['sse-identity', sseIdentityStage],
  ['typed-reducer', typedReducerStage],
  ['latency', latencyStage],
  ['clock-arithmetic', clockArithmeticStage],
  ['capacity', capacityStage],
  ['resident-tensor', residentTensorStage],
  ['capacity-bounds', capacityBoundsStage],
  ['economics', economicsStage],
  ['route-costs', routeCostsStage],
  ['cache-authority', cacheAuthorityStage],
  ['labeled-metrics', labeledMetricsStage],
  ['failure-attribution', failureAttributionStage],
  ['fresh-search', freshSearchStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
