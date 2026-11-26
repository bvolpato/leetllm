// Cinematic Vizmatic 0.10.0 stage film for `hypothesis-testing` (Would You Switch the Coding Assistant?: 20 scenes).
// All numerical values derive from videos/films/hypothesis-testing/ and pass build-time invariant checks.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyHypothesisInvariants } from './shared.mjs';
import {
  fortyTasks,
  intro,
  nullModel,
  pairedDesign,
  protocolIdentity,
} from './scenes/act1-paired-setup.mjs';
import {
  errorsAndPower,
  nullContract,
  pValue,
  search,
  varianceConstruction,
} from './scenes/act2-inference-power.mjs';
import {
  intervalContract,
  pairedUncertainty,
  passAtKScene,
  passkTarget,
  usefulLift,
} from './scenes/act3-bootstrap-passk.mjs';
import {
  estimatorBias,
  holdout,
  macroConstruction,
  protocolRepair,
  reportContract,
} from './scenes/act4-bias-macro-holdout.mjs';

export default cinematicLesson({
  id: 'hypothesis-testing',
  accent: COSMOS.cyan,
  invariants: verifyHypothesisInvariants,
  scenes: {
    intro,
    'paired-design': pairedDesign,
    'protocol-identity': protocolIdentity,
    'forty-tasks': fortyTasks,
    'null-model': nullModel,
    'p-value': pValue,
    'null-contract': nullContract,
    'errors-and-power': errorsAndPower,
    search,
    'variance-construction': varianceConstruction,
    'paired-uncertainty': pairedUncertainty,
    'interval-contract': intervalContract,
    'useful-lift': usefulLift,
    'pass-at-k': passAtKScene,
    'passk-target': passkTarget,
    'estimator-bias': estimatorBias,
    'macro-construction': macroConstruction,
    'protocol-repair': protocolRepair,
    'report-contract': reportContract,
    holdout,
  },
});
