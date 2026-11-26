// Cinematic Vizmatic 0.10.0 stage film for Designing an LLM-Powered Search Engine (29 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySearchEngineInvariants } from './parts.mjs';
import answerContract from './scenes/answer-contract.mjs';
import authorityScope from './scenes/authority-scope.mjs';
import cacheAuthority from './scenes/cache-authority.mjs';
import capacity from './scenes/capacity.mjs';
import capacityBounds from './scenes/capacity-bounds.mjs';
import citationSupport from './scenes/citation-support.mjs';
import clockArithmetic from './scenes/clock-arithmetic.mjs';
import contextCompression from './scenes/context-compression.mjs';
import economics from './scenes/economics.mjs';
import eligible from './scenes/eligible.mjs';
import exactSpan from './scenes/exact-span.mjs';
import failureAttribution from './scenes/failure-attribution.mjs';
import freshSearch from './scenes/fresh-search.mjs';
import fusion from './scenes/fusion.mjs';
import ingestIdentity from './scenes/ingest-identity.mjs';
import intro from './scenes/intro.mjs';
import labeledMetrics from './scenes/labeled-metrics.mjs';
import latency from './scenes/latency.mjs';
import miniatureRun from './scenes/miniature-run.mjs';
import packing from './scenes/packing.mjs';
import publish from './scenes/publish.mjs';
import residentTensor from './scenes/resident-tensor.mjs';
import retrievalArithmetic from './scenes/retrieval-arithmetic.mjs';
import routeCosts from './scenes/route-costs.mjs';
import rrfRule from './scenes/rrf-rule.mjs';
import sourceRouter from './scenes/source-router.mjs';
import sseIdentity from './scenes/sse-identity.mjs';
import typedReducer from './scenes/typed-reducer.mjs';
import untrustedSource from './scenes/untrusted-source.mjs';

export default cinematicLesson({
  id: 'design-llm-powered-search-engine',
  accent: COSMOS.cyan,
  invariants: verifySearchEngineInvariants,
  scenes: {
    intro,
    'answer-contract': answerContract,
    'ingest-identity': ingestIdentity,
    'authority-scope': authorityScope,
    eligible,
    'source-router': sourceRouter,
    'retrieval-arithmetic': retrievalArithmetic,
    'rrf-rule': rrfRule,
    fusion,
    'miniature-run': miniatureRun,
    packing,
    'exact-span': exactSpan,
    'context-compression': contextCompression,
    'citation-support': citationSupport,
    'untrusted-source': untrustedSource,
    publish,
    'sse-identity': sseIdentity,
    'typed-reducer': typedReducer,
    latency,
    'clock-arithmetic': clockArithmetic,
    capacity,
    'resident-tensor': residentTensor,
    'capacity-bounds': capacityBounds,
    economics,
    'route-costs': routeCosts,
    'cache-authority': cacheAuthority,
    'labeled-metrics': labeledMetrics,
    'failure-attribution': failureAttribution,
    'fresh-search': freshSearch,
  },
});
