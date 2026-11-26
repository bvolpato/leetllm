// Cinematic Vizmatic 0.10.0 stage film for GPU Kernel Performance Engineering Lab (19 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyPerfLabInvariants } from './parts.mjs';
import banks from './scenes/banks.mjs';
import barrier from './scenes/barrier.mjs';
import bitContract from './scenes/bit-contract.mjs';
import edgeOwnership from './scenes/edge-ownership.mjs';
import edgeSectors from './scenes/edge-sectors.mjs';
import freshTrial from './scenes/fresh-trial.mjs';
import intro from './scenes/intro.mjs';
import logicalRate from './scenes/logical-rate.mjs';
import primitives from './scenes/primitives.mjs';
import profileBoundary from './scenes/profile-boundary.mjs';
import raceRecovery from './scenes/race-recovery.mjs';
import resourceBudget from './scenes/resource-budget.mjs';
import sectors from './scenes/sectors.mjs';
import strideTransfer from './scenes/stride-transfer.mjs';
import synthesis from './scenes/synthesis.mjs';
import targetBuild from './scenes/target-build.mjs';
import tiles from './scenes/tiles.mjs';
import timingWindow from './scenes/timing-window.mjs';
import unrollIssue from './scenes/unroll-issue.mjs';

export default cinematicLesson({
  id: 'gpu-kernel-performance-engineering-lab',
  accent: COSMOS.cyan,
  invariants: verifyPerfLabInvariants,
  scenes: {
    intro,
    'bit-contract': bitContract,
    'target-build': targetBuild,
    'timing-window': timingWindow,
    sectors,
    'edge-sectors': edgeSectors,
    'logical-rate': logicalRate,
    'profile-boundary': profileBoundary,
    tiles,
    'edge-ownership': edgeOwnership,
    banks,
    'stride-transfer': strideTransfer,
    'unroll-issue': unrollIssue,
    'resource-budget': resourceBudget,
    barrier,
    'race-recovery': raceRecovery,
    primitives,
    synthesis,
    'fresh-trial': freshTrial,
  },
});
