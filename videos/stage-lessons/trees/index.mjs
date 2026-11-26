// Cinematic Vizmatic 0.10.0 stage film for `trees` (How Trees Learn to Divide a Space: 13 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTreesInvariants } from './shared.mjs';
import {
  criteriaCompare,
  depth,
  geometryLimits,
  impurity,
  intro,
  search,
} from './scenes/act1-splits.mjs';
import {
  boosting,
  classification,
  evaluate,
  forest,
  importanceExplanation,
  missingContract,
  transfer,
} from './scenes/act2-ensembles.mjs';

export default cinematicLesson({
  id: 'trees',
  accent: COSMOS.gold,
  invariants: verifyTreesInvariants,
  scenes: {
    intro,
    'geometry-limits': geometryLimits,
    impurity,
    'criteria-compare': criteriaCompare,
    search,
    depth,
    forest,
    boosting,
    classification,
    evaluate,
    'importance-explanation': importanceExplanation,
    'missing-contract': missingContract,
    transfer,
  },
});
