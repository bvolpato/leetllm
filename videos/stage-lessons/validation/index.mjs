// Cinematic Vizmatic 0.10.0 stage film for `validation` (Can a Model Handle New Data?: 18 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyValidationInvariants } from './shared.mjs';
import {
  foldCalculation,
  folds,
  intro,
  risk,
  roles,
  targetLeak,
} from './scenes/act1-leakage-folds.mjs';
import {
  asOfHistory,
  featureSelection,
  nestedSelection,
  pipeline,
  time,
  usersScene,
} from './scenes/act2-pipelines-time.mjs';
import {
  benchmarkScreen,
  counterfactual,
  documents,
  selection,
  selectiveLabels,
  sourceTransfer,
} from './scenes/act3-selection-transfer.mjs';

export default cinematicLesson({
  id: 'validation',
  accent: COSMOS.cyan,
  invariants: verifyValidationInvariants,
  scenes: {
    intro,
    'target-leak': targetLeak,
    risk,
    roles,
    folds,
    'fold-calculation': foldCalculation,
    users: usersScene,
    pipeline,
    'feature-selection': featureSelection,
    time,
    'as-of-history': asOfHistory,
    'nested-selection': nestedSelection,
    selection,
    'selective-labels': selectiveLabels,
    documents,
    'benchmark-screen': benchmarkScreen,
    counterfactual,
    'source-transfer': sourceTransfer,
  },
});
