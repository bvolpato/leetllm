import { sampleModel } from './model.mjs';
import { paintEvaluationResults } from './stages/evaluation.mjs';
export function drawUnknownSupportScene(ctx, scene, state, api) {
  if (drawSupportExtension(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(scene.id, state),
    currentBeat = modelState.b;
  if (state.cues) {
  }
  paintEvaluationResults(ctx, api, themeColors, teaching, modelState);
}
function drawSupportExtension(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C } = api;
  return true;
}
