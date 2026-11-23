import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import projectIdentity from './stages/project-identity.mjs';
import workspaceAccounting from './stages/workspace-accounting.mjs';
import tiles from './stages/tiles.mjs';
import online from './stages/online.mjs';
import recurrenceDomain from './stages/recurrence-domain.mjs';
import layoutHeads from './stages/layout-heads.mjs';
import mask from './stages/mask.mjs';
import windowEmpty from './stages/window-empty.mjs';
import packed from './stages/packed.mjs';
import packedPageContract from './stages/packed-page-contract.mjs';
import pagePadding from './stages/page-padding.mjs';
import backward from './stages/backward.mjs';
import gradientRule from './stages/gradient-rule.mjs';
import gradientWorked from './stages/gradient-worked.mjs';
import returnDependencies from './stages/return-dependencies.mjs';
import generationSchedules from './stages/generation-schedules.mjs';
import publishedEvidence from './stages/published-evidence.mjs';
import sdpaDispatch from './stages/sdpa-dispatch.mjs';
import paddingPolarity from './stages/padding-polarity.mjs';
import contracts from './stages/contracts.mjs';
import mixedShapeCache from './stages/mixed-shape-cache.mjs';
import synthesis from './stages/synthesis.mjs';
import measurementProfile from './stages/measurement-profile.mjs';
import freshDispatch from './stages/fresh-dispatch.mjs';
export {
  gradientFixture,
  keepMask,
  localMask,
  meanMask,
  mergeSummaries,
  packedAverage,
  referenceCases,
  summary,
  tileSummary,
} from './arithmetic.mjs';
export { sampleModel } from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'deep-dive-flashattention',
  validateModel,
  scenes: [
    intro,
    workspaceAccounting,
    tiles,
    online,
    recurrenceDomain,
    mask,
    windowEmpty,
    packed,
    packedPageContract,
    pagePadding,
    backward,
    gradientRule,
    gradientWorked,
    projectIdentity,
    layoutHeads,
    returnDependencies,
    generationSchedules,
    publishedEvidence,
    sdpaDispatch,
    paddingPolarity,
    contracts,
    mixedShapeCache,
    synthesis,
    measurementProfile,
    freshDispatch,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
