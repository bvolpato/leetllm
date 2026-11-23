import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import tickets from './stages/tickets.mjs';
import basis from './stages/basis.mjs';
import commonOutput from './stages/common-output.mjs';
import contrastOutput from './stages/contrast-output.mjs';
import gram from './stages/gram.mjs';
import gramAction from './stages/gram-action.mjs';
import svdRotate from './stages/svd-rotate.mjs';
import svdStretch from './stages/svd-stretch.mjs';
import svdEmbed from './stages/svd-embed.mjs';
import svdSign from './stages/svd-sign.mjs';
import truncate from './stages/truncate.mjs';
import retrievalCheck from './stages/retrieval-check.mjs';
import pcaCenter from './stages/pca-center.mjs';
import pcaSpread from './stages/pca-spread.mjs';
import pcaNew from './stages/pca-new.mjs';
import pcaSparse from './stages/pca-sparse.mjs';
import fitProjection from './stages/fit-projection.mjs';
import rankCollapse from './stages/rank-collapse.mjs';
import rankFit from './stages/rank-fit.mjs';
import rankNull from './stages/rank-null.mjs';
import conditioningMap from './stages/conditioning-map.mjs';
import conditioningNoise from './stages/conditioning-noise.mjs';
import conditioningSolve from './stages/conditioning-solve.mjs';
import energyCutoff from './stages/energy-cutoff.mjs';
import lowRankUpdate from './stages/low-rank-update.mjs';
import newRoutingObjective from './stages/new-routing-objective.mjs';
import decision from './stages/decision.mjs';
export { A, B, U, V, common, contrast, labels, mean, severity, strengths } from './fixtures.mjs';
export {
  basisFrame,
  compressionFrame,
  conditioningResult,
  conditioningState,
  decisionFrame,
  duplicateFitFrame,
  gramCalculation,
  gramConstruction,
  leastSquaresFit,
  leastSquaresFrame,
  pairedSignFrame,
  pcaFrame,
  rankFrame,
  retrievalFrame,
  solverRoundingExample,
  sparseFrame,
  spreadFrame,
  strengthFrame,
  svdBuild,
  svdFrame,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'linear-algebra',
  validateModel,
  scenes: [
    intro,
    tickets,
    basis,
    commonOutput,
    contrastOutput,
    gram,
    gramAction,
    svdRotate,
    svdStretch,
    svdEmbed,
    svdSign,
    truncate,
    retrievalCheck,
    pcaCenter,
    pcaSpread,
    pcaNew,
    pcaSparse,
    fitProjection,
    rankCollapse,
    rankFit,
    rankNull,
    conditioningMap,
    conditioningNoise,
    conditioningSolve,
    energyCutoff,
    lowRankUpdate,
    newRoutingObjective,
    decision,
  ],
});
export const draw = definition.draw;
export default definition;
