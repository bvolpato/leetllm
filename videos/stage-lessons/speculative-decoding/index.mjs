// Cinematic Vizmatic 0.10.0 stage film for `speculative-decoding` (29 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifySpeculativeInvariants } from './shared.mjs';
import { accept, draft, intro, proof, residual } from './scenes/act1-foundations.mjs';
import {
  chain,
  eventMapping,
  rowAlignment,
  servingLaws,
  wrongCorrection,
} from './scenes/act2-laws-and-chains.mjs';
import {
  commit,
  roundCpu,
  sequenceCheck,
  weightReuse,
  weightRoofline,
} from './scenes/act3-state-and-roofline.mjs';
import {
  cost,
  loadCost,
  positionYield,
  verificationBudgetScene,
} from './scenes/act4-economics.mjs';
import {
  blockContract,
  eagleFamily,
  lookupMethods,
  medusaContract,
  treeLeak,
  treeMask,
} from './scenes/act5-trees-and-methods.mjs';
import {
  diagnose,
  freshState,
  pairedService,
  transfer,
} from './scenes/act6-serving-and-mastery.mjs';

export default cinematicLesson({
  id: 'speculative-decoding',
  accent: COSMOS.cyan,
  invariants: verifySpeculativeInvariants,
  scenes: {
    intro,
    draft,
    accept,
    residual,
    proof,
    'wrong-correction': wrongCorrection,
    'serving-laws': servingLaws,
    'event-mapping': eventMapping,
    chain,
    'row-alignment': rowAlignment,
    commit,
    'round-cpu': roundCpu,
    'sequence-check': sequenceCheck,
    'weight-roofline': weightRoofline,
    'weight-reuse': weightReuse,
    cost,
    'position-yield': positionYield,
    'load-cost': loadCost,
    'verification-budget': verificationBudgetScene,
    'tree-mask': treeMask,
    'tree-leak': treeLeak,
    'medusa-contract': medusaContract,
    'eagle-family': eagleFamily,
    'lookup-methods': lookupMethods,
    'block-contract': blockContract,
    'paired-service': pairedService,
    diagnose,
    transfer,
    'fresh-state': freshState,
  },
});
