import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import sampling from './stages/sampling.mjs';
import scoreInterval from './stages/score-interval.mjs';
import accumulatingEvidence from './stages/accumulating-evidence.mjs';
import boundary from './stages/boundary.mjs';
import sampleDesign from './stages/sample-design.mjs';
import resampling from './stages/resampling.mjs';
import priorAndCalibration from './stages/prior-and-calibration.mjs';
import targetAndMissing from './stages/target-and-missing.mjs';
import clusterEvidence from './stages/cluster-evidence.mjs';
import biasAndPrior from './stages/bias-and-prior.mjs';
import missingLabelTransfer from './stages/missing-label-transfer.mjs';
import report from './stages/report.mjs';
export {
  accumulationSnapshot,
  bootstrapFrame,
  decisionFrame,
  designFrame,
  introFrame,
  priorFrame,
  samplingFrame,
  scoreFrame,
} from './construction.mjs';
export {
  bootstrapBins,
  bootstrapRange,
  bootstrapSamples,
  coverageIntervals,
  sliceModel,
  weeklyQueue,
  weeklySample,
} from './fixtures.mjs';
export {
  biasVarianceState,
  bootstrapBin,
  clusterBootstrapModel,
  missingLabelBounds,
  scoreStatistic,
  wilson,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'estimation',
  validateModel,
  scenes: [
    intro,
    sampling,
    scoreInterval,
    accumulatingEvidence,
    boundary,
    sampleDesign,
    resampling,
    priorAndCalibration,
    targetAndMissing,
    clusterEvidence,
    biasAndPrior,
    missingLabelTransfer,
    report,
  ],
});
export function draw(ctx, scene, state, api) {
  if (definition.scenes.some((stage) => stage.id === scene.id))
    return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
