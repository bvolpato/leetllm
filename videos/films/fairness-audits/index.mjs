import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { rejectUnknownScene } from './compatibility.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import harmsAndOutcomesStage from './stages/harms-and-outcomes.mjs';
import matchedPairsStage from './stages/matched-pairs.mjs';
import pairFlipsStage from './stages/pair-flips.mjs';
import confusionMatricesStage from './stages/confusion-matrices.mjs';
import criterionChoiceStage from './stages/criterion-choice.mjs';
import metricTradeoffsStage from './stages/metric-tradeoffs.mjs';
import uncertaintyGateStage from './stages/uncertainty-gate.mjs';
import scoreCalibrationStage from './stages/score-calibration.mjs';
import uncertaintyAndSlicesStage from './stages/uncertainty-and-slices.mjs';
import interventionsStage from './stages/interventions.mjs';
import benchmarkScopeStage from './stages/benchmark-scope.mjs';
import releaseGateStage from './stages/release-gate.mjs';
export { THRESHOLD, candidateScores, matchedPairs } from './fixtures.mjs';
export { route, toyRoutingScore, wilson } from './arithmetic.mjs';
export {
  candidateMetrics,
  candidateRows,
  criterionMetrics,
  criterionState,
  flips,
  matchedCondition,
  pairFlipSnapshot,
  offsetRows,
  rates,
  validateModel,
} from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'fairness-audits',
  validateModel,
  scenes: [
    subjectIntroStage,
    harmsAndOutcomesStage,
    matchedPairsStage,
    pairFlipsStage,
    confusionMatricesStage,
    criterionChoiceStage,
    metricTradeoffsStage,
    scoreCalibrationStage,
    uncertaintyAndSlicesStage,
    uncertaintyGateStage,
    interventionsStage,
    benchmarkScopeStage,
    releaseGateStage,
  ],
});
const stages = new Map([
  ['subject-intro', subjectIntroStage],
  ['harms-and-outcomes', harmsAndOutcomesStage],
  ['matched-pairs', matchedPairsStage],
  ['pair-flips', pairFlipsStage],
  ['confusion-matrices', confusionMatricesStage],
  ['criterion-choice', criterionChoiceStage],
  ['metric-tradeoffs', metricTradeoffsStage],
  ['uncertainty-gate', uncertaintyGateStage],
  ['score-calibration', scoreCalibrationStage],
  ['uncertainty-and-slices', uncertaintyAndSlicesStage],
  ['interventions', interventionsStage],
  ['benchmark-scope', benchmarkScopeStage],
  ['release-gate', releaseGateStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id);
  return stage ? stage.draw(ctx, scene, state, api) : rejectUnknownScene(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
