import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import clockContract from './stages/clock-contract.mjs';
import additiveDecomposition from './stages/additive-decomposition.mjs';
import proportionalSeasonality from './stages/proportional-seasonality.mjs';
import seasonalBaseline from './stages/seasonal-baseline.mjs';
import fixedOrigin from './stages/fixed-origin.mjs';
import timeOrder from './stages/time-order.mjs';
import sarimaxContract from './stages/sarimax-contract.mjs';
import originFeatures from './stages/origin-features.mjs';
import multiHorizon from './stages/multi-horizon.mjs';
import patchCount from './stages/patch-count.mjs';
import foundationGenerations from './stages/foundation-generations.mjs';
import errorsAndResiduals from './stages/errors-and-residuals.mjs';
import quantileTarget from './stages/quantile-target.mjs';
import discreteQuantile from './stages/discrete-quantile.mjs';
import intervalCalibration from './stages/interval-calibration.mjs';
import normalErrorScale from './stages/normal-error-scale.mjs';
import finiteConformal from './stages/finite-conformal.mjs';
import onlineCalibration from './stages/online-calibration.mjs';
import alertReceipt from './stages/alert-receipt.mjs';
import reviewVolume from './stages/review-volume.mjs';
import alertState from './stages/alert-state.mjs';
import stateTraceStage from './stages/state-trace.mjs';
import jointDetector from './stages/joint-detector.mjs';
import alertUsefulness from './stages/alert-usefulness.mjs';
import telemetryIdentity from './stages/telemetry-identity.mjs';
import fixtureGates from './stages/fixture-gates.mjs';
import laterPolicyCheck from './stages/later-policy-check.mjs';
import wrap from './stages/wrap.mjs';
import freshState from './stages/fresh-state.mjs';
export { alphaUpdate, conformalRank, expectedDiscreteLoss, pinball } from './arithmetic.mjs';
export {
  forecastCueProgress,
  quietPeriodRevealOpacity,
  residualSnapshot,
} from './construction.mjs';
export { FORECAST_ROWS } from './fixtures.mjs';
export {
  deduplicateEvents,
  diagonalProjection,
  forecastComparisonGeometry,
  intervalCalibrationGeometry,
  patchContract,
  seasonalDescription,
  stateTrace,
  weeklyLookup,
} from './model.mjs';
export { validateExpandedForecast, validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'forecasting',
  validateModel,
  scenes: [
    intro,
    clockContract,
    additiveDecomposition,
    proportionalSeasonality,
    seasonalBaseline,
    fixedOrigin,
    timeOrder,
    sarimaxContract,
    originFeatures,
    multiHorizon,
    patchCount,
    foundationGenerations,
    errorsAndResiduals,
    quantileTarget,
    discreteQuantile,
    intervalCalibration,
    normalErrorScale,
    finiteConformal,
    onlineCalibration,
    alertReceipt,
    reviewVolume,
    alertState,
    stateTraceStage,
    jointDetector,
    alertUsefulness,
    telemetryIdentity,
    fixtureGates,
    laterPolicyCheck,
    wrap,
    freshState,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((s) => s.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
