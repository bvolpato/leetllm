// Full-bleed dark-cinema 26-scene Multimodal Fusion stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyMultimodalInvariants } from './parts.mjs';
import adaptiveCrops from './scenes/adaptive-crops.mjs';
import artifactLineage from './scenes/artifact-lineage.mjs';
import attention from './scenes/attention.mjs';
import audioClock from './scenes/audio-clock.mjs';
import budget from './scenes/budget.mjs';
import cacheBytes from './scenes/cache-bytes.mjs';
import cacheLifetime from './scenes/cache-lifetime.mjs';
import caseContract from './scenes/case-contract.mjs';
import closing from './scenes/closing.mjs';
import connector from './scenes/connector.mjs';
import decodedBudget from './scenes/decoded-budget.mjs';
import diagnosisRelease from './scenes/diagnosis-release.mjs';
import encoderDirections from './scenes/encoder-directions.mjs';
import evidenceTime from './scenes/evidence-time.mjs';
import freshIncident from './scenes/fresh-incident.mjs';
import jointAndPosttraining from './scenes/joint-and-posttraining.mjs';
import multiBlockInterface from './scenes/multi-block-interface.mjs';
import opening from './scenes/opening.mjs';
import patches from './scenes/patches.mjs';
import readyRecovery from './scenes/ready-recovery.mjs';
import routeChoice from './scenes/route-choice.mjs';
import routes from './scenes/routes.mjs';
import safetyBoundary from './scenes/safety-boundary.mjs';
import scoreWork from './scenes/score-work.mjs';
import trainingStages from './scenes/training-stages.mjs';
import zeroInsertion from './scenes/zero-insertion.mjs';

export default cinematicLesson({
  id: 'multimodal-fusion',
  accent: COSMOS.violet,
  invariants: verifyMultimodalInvariants,
  scenes: {
    opening,
    'case-contract': caseContract,
    patches,
    'decoded-budget': decodedBudget,
    'encoder-directions': encoderDirections,
    connector,
    'multi-block-interface': multiBlockInterface,
    routes,
    budget,
    'score-work': scoreWork,
    attention,
    'zero-insertion': zeroInsertion,
    'training-stages': trainingStages,
    'joint-and-posttraining': jointAndPosttraining,
    'adaptive-crops': adaptiveCrops,
    'audio-clock': audioClock,
    'evidence-time': evidenceTime,
    'artifact-lineage': artifactLineage,
    'cache-lifetime': cacheLifetime,
    'cache-bytes': cacheBytes,
    'ready-recovery': readyRecovery,
    'safety-boundary': safetyBoundary,
    'diagnosis-release': diagnosisRelease,
    'route-choice': routeChoice,
    closing,
    'fresh-incident': freshIncident,
  },
});
