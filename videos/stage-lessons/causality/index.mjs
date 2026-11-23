import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import intro from './scenes/intro.mjs';
import policyDefinition from './scenes/policy-definition.mjs';
import simpson from './scenes/simpson.mjs';
import graph from './scenes/graph.mjs';
import graphJunctions from './scenes/graph-junctions.mjs';
import backdoorSet from './scenes/backdoor-set.mjs';
import intervene from './scenes/intervene.mjs';
import standardize from './scenes/standardize.mjs';
import standardizeUncertainty from './scenes/standardize-uncertainty.mjs';
import potential from './scenes/potential.mjs';
import estimands from './scenes/estimands.mjs';
import harmBounds from './scenes/harm-bounds.mjs';
import overlap from './scenes/overlap.mjs';
import weightedTickets from './scenes/weighted-tickets.mjs';
import weightChoices from './scenes/weight-choices.mjs';
import supportSampling from './scenes/support-sampling.mjs';
import instrument from './scenes/instrument.mjs';
import waldLate from './scenes/wald-late.mjs';
import weakInstrument from './scenes/weak-instrument.mjs';
import policyValue from './scenes/policy-value.mjs';
import drCorrection from './scenes/dr-correction.mjs';
import drAssumptions from './scenes/dr-assumptions.mjs';
import sequentialPolicy from './scenes/sequential-policy.mjs';
import clickExposure from './scenes/click-exposure.mjs';
import replayState from './scenes/replay-state.mjs';
import releaseReceipt from './scenes/release-receipt.mjs';
import selection from './scenes/selection.mjs';
import freshAudit from './scenes/fresh-audit.mjs';

export default narratedLesson({
  id: 'causality',
  scenes: {
    'intro': intro,
    'policy-definition': policyDefinition,
    'simpson': simpson,
    'graph': graph,
    'graph-junctions': graphJunctions,
    'backdoor-set': backdoorSet,
    'intervene': intervene,
    'standardize': standardize,
    'standardize-uncertainty': standardizeUncertainty,
    'potential': potential,
    'estimands': estimands,
    'harm-bounds': harmBounds,
    'overlap': overlap,
    'weighted-tickets': weightedTickets,
    'weight-choices': weightChoices,
    'support-sampling': supportSampling,
    'instrument': instrument,
    'wald-late': waldLate,
    'weak-instrument': weakInstrument,
    'policy-value': policyValue,
    'dr-correction': drCorrection,
    'dr-assumptions': drAssumptions,
    'sequential-policy': sequentialPolicy,
    'click-exposure': clickExposure,
    'replay-state': replayState,
    'release-receipt': releaseReceipt,
    'selection': selection,
    'fresh-audit': freshAudit,
  },
});
