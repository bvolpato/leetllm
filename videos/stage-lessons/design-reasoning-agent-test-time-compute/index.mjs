import { cinematicLesson, COSMOS, glowDot, guardedDynamic } from '../cinematic-kit.mjs';
import { clampDur, verifyTestTimeInvariants } from './parts.mjs';

import { buildIntro } from './scenes/intro.mjs';
import { buildApiControls } from './scenes/api-controls.mjs';
import { buildXmlContract } from './scenes/xml-contract.mjs';
import { buildEvidence } from './scenes/evidence.mjs';
import { buildCandidates } from './scenes/candidates.mjs';
import { buildCoverageOperation } from './scenes/coverage-operation.mjs';
import { buildVotingBaseline } from './scenes/voting-baseline.mjs';
import { buildTree } from './scenes/tree.mjs';
import { buildTreeContract } from './scenes/tree-contract.mjs';
import { buildPuctAllocation } from './scenes/puct-allocation.mjs';
import { buildProcess } from './scenes/process.mjs';
import { buildVerifierEvidence } from './scenes/verifier-evidence.mjs';
import { buildAnswerBias } from './scenes/answer-bias.mjs';
import { buildTrainedPolicy } from './scenes/trained-policy.mjs';
import { buildRouterEvaluation } from './scenes/router-evaluation.mjs';
import { buildBudget } from './scenes/budget.mjs';
import { buildReservationReconcile } from './scenes/reservation-reconcile.mjs';
import { buildIncompleteAdvisory } from './scenes/incomplete-advisory.mjs';
import { buildMemory } from './scenes/memory.mjs';
import { buildKvByteModel } from './scenes/kv-byte-model.mjs';
import { buildPrefixLease } from './scenes/prefix-lease.mjs';
import { buildEvictionArchitecture } from './scenes/eviction-architecture.mjs';
import { buildStopping } from './scenes/stopping.mjs';
import { buildSafeProgress } from './scenes/safe-progress.mjs';
import { buildEvaluationRelease } from './scenes/evaluation-release.mjs';
import { buildFreshDeadline } from './scenes/fresh-deadline.mjs';
import { buildSynthesis } from './scenes/synthesis.mjs';

function withCadence(sceneFn, extraCues = []) {
  if (!extraCues.length) return sceneFn;
  return (s, c) => {
    sceneFn(s, c);
    const beat = s.value(0);
    s.add(
      guardedDynamic(
        () => 1,
        () => {
          const b = beat.value;
          const pulse = 0.28 + 0.42 * Math.abs(Math.sin(b * Math.PI));
          return glowDot(830, 468, {
            radius: 4.5 + 1.5 * (pulse - 0.28),
            color: COSMOS.cyan,
            glow: 7,
            opacity: pulse,
          });
        },
      ),
    );
    extraCues.forEach((id, idx) => {
      c.on(id, () => {
        s.play(beat.to(idx + 1, { duration: clampDur(c, c.cue(id).start, 0.35) }));
      });
    });
  };
}

export default cinematicLesson({
  id: 'design-reasoning-agent-test-time-compute',
  accent: COSMOS.cyan,
  invariants: verifyTestTimeInvariants,
  scenes: {
    intro: withCadence(buildIntro, ['intro-smoke', 'intro-meter', 'intro-revision', 'intro-match']),
    'api-controls': withCadence(buildApiControls, [
      'ra-api-controls-0-0',
      'ra-api-controls-0-1',
      'ra-api-controls-1-0',
      'ra-api-controls-1-2',
      'ra-api-controls-1-3',
    ]),
    'xml-contract': withCadence(buildXmlContract, ['xml-invalid', 'xml-parse']),
    evidence: buildEvidence,
    candidates: withCadence(buildCandidates, ['paths-introduce', 'paths-branches', 'paths-follow']),
    'coverage-operation': withCadence(buildCoverageOperation, [
      'ra-coverage-operation-0-0',
      'ra-coverage-operation-0-3',
      'ra-coverage-operation-1-0',
      'ra-coverage-operation-1-1',
      'ra-coverage-operation-1-3',
    ]),
    'voting-baseline': withCadence(buildVotingBaseline, [
      'ra-voting-baseline-0-0',
      'ra-voting-baseline-0-1',
      'ra-voting-baseline-0-3',
      'ra-voting-baseline-1-0',
      'ra-voting-baseline-1-2',
      'ra-voting-baseline-1-3',
    ]),
    tree: withCadence(buildTree, [
      'ra-tree-0-0',
      'ra-tree-0-1',
      'ra-tree-0-2',
      'ra-tree-0-3',
      'ra-tree-1-0',
      'ra-tree-1-1',
      'ra-tree-1-2',
      'ra-tree-1-3',
    ]),
    'tree-contract': withCadence(buildTreeContract, [
      'ra-tree-contract-0-0',
      'ra-tree-contract-0-1',
      'ra-tree-contract-0-3',
      'ra-tree-contract-1-0',
      'ra-tree-contract-1-2',
      'ra-tree-contract-1-3',
      'ra-tree-contract-1-4',
    ]),
    'puct-allocation': withCadence(buildPuctAllocation, [
      'puct-input',
      'puct-priors',
      'puct-visit',
      'puct-good',
      'puct-good-result',
      'puct-zero',
    ]),
    process: withCadence(buildProcess, [
      'process-first',
      'process-second',
      'process-third',
      'process-nan',
    ]),
    'verifier-evidence': withCadence(buildVerifierEvidence, [
      'ra-verifier-evidence-0-0',
      'ra-verifier-evidence-0-1',
      'ra-verifier-evidence-0-2',
      'ra-verifier-evidence-0-3',
      'ra-verifier-evidence-1-0',
      'ra-verifier-evidence-1-1',
      'ra-verifier-evidence-1-3',
      'ra-verifier-evidence-2-0',
      'ra-verifier-evidence-2-2',
      'ra-verifier-evidence-2-3',
    ]),
    'answer-bias': withCadence(buildAnswerBias, ['bias-lock', 'bias-study', 'bias-solver-count']),
    'trained-policy': withCadence(buildTrainedPolicy, [
      'ra-trained-policy-0-0',
      'ra-trained-policy-0-1',
      'training-failed',
      'ra-trained-policy-0-3',
      'training-below',
      'ra-trained-policy-1-1',
      'ra-trained-policy-1-2',
    ]),
    'router-evaluation': withCadence(buildRouterEvaluation, [
      'ra-router-evaluation-0-0',
      'ra-router-evaluation-0-1',
      'ra-router-evaluation-0-2',
      'ra-router-evaluation-1-1',
      'ra-router-evaluation-1-2',
      'ra-router-evaluation-1-3',
      'ra-router-evaluation-2-0',
      'ra-router-evaluation-2-2',
      'ra-router-evaluation-2-3',
    ]),
    budget: withCadence(buildBudget, ['budget-held']),
    'reservation-reconcile': withCadence(buildReservationReconcile, [
      'receipt-repeat',
      'receipt-reject',
      'receipt-over-result',
    ]),
    'incomplete-advisory': withCadence(buildIncompleteAdvisory, [
      'ra-incomplete-advisory-0-0',
      'ra-incomplete-advisory-0-1',
      'ra-incomplete-advisory-0-3',
      'ra-incomplete-advisory-1-0',
      'ra-incomplete-advisory-1-2',
      'ra-incomplete-advisory-1-3',
    ]),
    memory: withCadence(buildMemory, [
      'memory-beat-1-focus-1',
      'ra-memory-0-0',
      'ra-memory-0-1',
      'ra-memory-0-2',
      'ra-memory-1-0',
      'ra-memory-1-1',
      'ra-memory-1-2',
      'ra-memory-1-3',
    ]),
    'kv-byte-model': withCadence(buildKvByteModel, [
      'ra-kv-byte-model-0-0',
      'ra-kv-byte-model-0-1',
      'ra-kv-byte-model-0-2',
      'ra-kv-byte-model-0-3',
      'ra-kv-byte-model-1-1',
      'ra-kv-byte-model-1-3',
      'ra-kv-byte-model-1-5',
    ]),
    'prefix-lease': withCadence(buildPrefixLease, [
      'ra-prefix-lease-0-0',
      'ra-prefix-lease-0-1',
      'ra-prefix-lease-0-2',
      'ra-prefix-lease-0-3',
      'ra-prefix-lease-0-4',
      'ra-prefix-lease-1-0',
      'ra-prefix-lease-1-3',
      'ra-prefix-lease-2-1',
      'ra-prefix-lease-2-2',
    ]),
    'eviction-architecture': withCadence(buildEvictionArchitecture, [
      'ra-eviction-architecture-0-0',
      'ra-eviction-architecture-0-2',
      'ra-eviction-architecture-0-3',
      'ra-eviction-architecture-1-1',
      'ra-eviction-architecture-1-2',
      'ra-eviction-architecture-1-3',
    ]),
    stopping: withCadence(buildStopping, [
      'stopping-beat-1-focus-1',
      'ra-stopping-0-0',
      'ra-stopping-0-1',
      'ra-stopping-0-2',
      'ra-stopping-0-3',
      'ra-stopping-1-0',
      'ra-stopping-1-1',
      'ra-stopping-1-2',
      'ra-stopping-1-3',
    ]),
    'safe-progress': withCadence(buildSafeProgress, [
      'ra-safe-progress-0-0',
      'ra-safe-progress-0-1',
      'ra-safe-progress-0-2',
      'ra-safe-progress-1-1',
      'ra-safe-progress-1-2',
      'ra-safe-progress-1-3',
    ]),
    'evaluation-release': withCadence(buildEvaluationRelease, [
      'ra-evaluation-release-0-0',
      'ra-evaluation-release-0-1',
      'ra-evaluation-release-0-2',
      'ra-evaluation-release-0-3',
      'ra-evaluation-release-1-0',
      'ra-evaluation-release-1-1',
      'ra-evaluation-release-1-2',
      'ra-evaluation-release-2-1',
      'ra-evaluation-release-2-2',
    ]),
    'fresh-deadline': withCadence(buildFreshDeadline, [
      'ra-fresh-deadline-0-0',
      'ra-fresh-deadline-0-1',
      'ra-fresh-deadline-0-2',
      'ra-fresh-deadline-0-3',
      'ra-fresh-deadline-0-4',
      'ra-fresh-deadline-0-5',
      'ra-fresh-deadline-0-6',
      'ra-fresh-deadline-0-7',
      'ra-fresh-deadline-1-3',
      'ra-fresh-deadline-1-5',
    ]),
    synthesis: withCadence(buildSynthesis, ['last-clock', 'last-edge', 'last-predict']),
  },
});
