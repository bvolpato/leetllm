// Cinematic Vizmatic 0.10.0 stage film for Design a Multi-Tenant LLM Serving Platform (32 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyMultiTenantInvariants } from './parts.mjs';

import adapterRevisions from './scenes/adapter-revisions.mjs';
import admissionDimensions from './scenes/admission-dimensions.mjs';
import admissionRace from './scenes/admission-race.mjs';
import boundaryClose from './scenes/boundary-close.mjs';
import cacheScene from './scenes/cache.mjs';
import costScene from './scenes/cost.mjs';
import dispatchCommit from './scenes/dispatch-commit.mjs';
import extraWork from './scenes/extra-work.mjs';
import fairness from './scenes/fairness.mjs';
import freshDesignGate from './scenes/fresh-design-gate.mjs';
import goodputContract from './scenes/goodput-contract.mjs';
import idempotencyBinding from './scenes/idempotency-binding.mjs';
import identity from './scenes/identity.mjs';
import incidentEvidence from './scenes/incident-evidence.mjs';
import intro from './scenes/intro.mjs';
import iterationBoundary from './scenes/iteration-boundary.mjs';
import kvByteShape from './scenes/kv-byte-shape.mjs';
import kvGrowth from './scenes/kv-growth.mjs';
import pages from './scenes/pages.mjs';
import physicalReferences from './scenes/physical-references.mjs';
import prefixTrust from './scenes/prefix-trust.mjs';
import quotaScene from './scenes/quota.mjs';
import readerBeforeRanking from './scenes/reader-before-ranking.mjs';
import recovery from './scenes/recovery.mjs';
import remoteKv from './scenes/remote-kv.mjs';
import rolloutAndStreams from './scenes/rollout-and-streams.mjs';
import runtimeTrust from './scenes/runtime-trust.mjs';
import sharingContract from './scenes/sharing-contract.mjs';
import streamClocks from './scenes/stream-clocks.mjs';
import trustedEnvelope from './scenes/trusted-envelope.mjs';
import usageAndBill from './scenes/usage-and-bill.mjs';
import workCost from './scenes/work-cost.mjs';

export default cinematicLesson({
  id: 'design-multi-tenant-llm-serving-platform',
  accent: COSMOS.cyan,
  invariants: verifyMultiTenantInvariants,
  scenes: {
    intro,
    'sharing-contract': sharingContract,
    'stream-clocks': streamClocks,
    'goodput-contract': goodputContract,
    identity,
    'trusted-envelope': trustedEnvelope,
    'admission-dimensions': admissionDimensions,
    quota: quotaScene,
    'admission-race': admissionRace,
    'idempotency-binding': idempotencyBinding,
    'dispatch-commit': dispatchCommit,
    pages,
    'kv-byte-shape': kvByteShape,
    'kv-growth': kvGrowth,
    'physical-references': physicalReferences,
    'remote-kv': remoteKv,
    fairness,
    'iteration-boundary': iterationBoundary,
    'work-cost': workCost,
    'extra-work': extraWork,
    cache: cacheScene,
    'adapter-revisions': adapterRevisions,
    'reader-before-ranking': readerBeforeRanking,
    'prefix-trust': prefixTrust,
    'runtime-trust': runtimeTrust,
    cost: costScene,
    'usage-and-bill': usageAndBill,
    recovery,
    'rollout-and-streams': rolloutAndStreams,
    'incident-evidence': incidentEvidence,
    'fresh-design-gate': freshDesignGate,
    'boundary-close': boundaryClose,
  },
});
