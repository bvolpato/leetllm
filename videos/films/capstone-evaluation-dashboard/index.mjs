import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import introStage from './stages/intro.mjs';
import rowsStage from './stages/rows.mjs';
import typedContractStage from './stages/typed-contract.mjs';
import inventoryStage from './stages/inventory.mjs';
import receiptProvenanceStage from './stages/receipt-provenance.mjs';
import gatesStage from './stages/gates.mjs';
import bootstrapStage from './stages/bootstrap.mjs';
import pairedStage from './stages/paired.mjs';
import passkSelectorStage from './stages/passk-selector.mjs';
import judgeOrderStage from './stages/judge-order.mjs';
import filtersStage from './stages/filters.mjs';
import emptyViewStage from './stages/empty-view.mjs';
import regressionPackageStage from './stages/regression-package.mjs';
import synthesisStage from './stages/synthesis.mjs';
import coverageOwnersStage from './stages/coverage-owners.mjs';
import freshAttackStage from './stages/fresh-attack.mjs';
import classifierHandoffStage from './stages/classifier-handoff.mjs';
export { DASHBOARD_FIXTURES } from './fixtures.mjs';
export {
  dashboardBootstrapState,
  dashboardDecision,
  dashboardFreshReveal,
  dashboardPairs,
  dashboardReceiptErrors,
  dashboardRows,
  filterSnapshot,
  gate,
  gradeDashboardOutput,
  histogram,
  pairedDraw,
  resamples,
  subsetAvailability,
} from './arithmetic.mjs';
export { sampleModel, validateDashboardExpansion, validateModel } from './model.mjs';
const orderedDefinition = defineCanvasLesson({
  id: 'capstone-evaluation-dashboard',
  validateModel,
  scenes: [
    introStage,
    rowsStage,
    typedContractStage,
    inventoryStage,
    receiptProvenanceStage,
    gatesStage,
    bootstrapStage,
    pairedStage,
    passkSelectorStage,
    judgeOrderStage,
    filtersStage,
    emptyViewStage,
    regressionPackageStage,
    synthesisStage,
    coverageOwnersStage,
    classifierHandoffStage,
    freshAttackStage,
  ],
});
const stages = new Map([
  ['intro', introStage],
  ['rows', rowsStage],
  ['typed-contract', typedContractStage],
  ['inventory', inventoryStage],
  ['receipt-provenance', receiptProvenanceStage],
  ['gates', gatesStage],
  ['bootstrap', bootstrapStage],
  ['paired', pairedStage],
  ['passk-selector', passkSelectorStage],
  ['judge-order', judgeOrderStage],
  ['filters', filtersStage],
  ['empty-view', emptyViewStage],
  ['regression-package', regressionPackageStage],
  ['synthesis', synthesisStage],
  ['coverage-owners', coverageOwnersStage],
  ['classifier-handoff', classifierHandoffStage],
  ['fresh-attack', freshAttackStage],
]);
export function draw(ctx, scene, state, api) {
  const stage = stages.get(scene.id) ?? synthesisStage;
  return stage.draw(ctx, scene, state, api);
}
const definition = Object.freeze({
  ...orderedDefinition,
  draw,
});
export default definition;
