import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import predictionContract from './stages/prediction-contract.mjs';
import clocks from './stages/clocks.mjs';
import history from './stages/history.mjs';
import arrivalTargets from './stages/arrival-targets.mjs';
import conformalCalibration from './stages/conformal-calibration.mjs';
import freshness from './stages/freshness.mjs';
import cost from './stages/cost.mjs';
import costThreshold from './stages/cost-threshold.mjs';
import selection from './stages/selection.mjs';
import temporalFit from './stages/temporal-fit.mjs';
import fittedPredictions from './stages/fitted-predictions.mjs';
import artifactReplay from './stages/artifact-replay.mjs';
import monitor from './stages/monitor.mjs';
import servingRecovery from './stages/serving-recovery.mjs';
import synthesis from './stages/synthesis.mjs';
export { costSnapshot, sampleModel } from './construction.mjs';
export { fittedEtaFixture } from './fixtures.mjs';
export { admitted, decisions, historySummary } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-delivery-eta-prediction',
  validateModel,
  scenes: [
    intro,
    predictionContract,
    clocks,
    history,
    arrivalTargets,
    conformalCalibration,
    freshness,
    cost,
    costThreshold,
    selection,
    temporalFit,
    fittedPredictions,
    artifactReplay,
    monitor,
    servingRecovery,
    synthesis,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
