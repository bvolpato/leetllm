import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionResult,
  drawResearchConstructionSmallGrid,
  formatResearchSigned,
} from '../defaults.mjs';
export function drawActualUpdate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('actual-update', state),
    currentBeat = modelState.b;
  api.focus.target('rs-actual-update-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Study step size α = 0.35   /   State 1, intended right, successor 0',
    );
    drawResearchConstructionSmallGrid(
      ctx,
      api,
      [
        ['Q entry', 'old Q', 'training reward', 'next max'],
        ['Q(1,right)', '0', modelState.reward.toFixed(6), modelState.nextVisible ? '.400000' : '0'],
      ],
      230,
      370,
      1460,
      170,
      [themeColors.muted, themeColors.cyan],
    );
    const targetVisible = modelState.nextVisible
      ? modelState.changedVisible
      : modelState.negativeVisible;
    drawResearchConstructionMid(
      ctx,
      api,
      'target = reward + .95 × next max',
      960,
      650,
      39,
      themeColors.ink,
    );
    if (targetVisible) {
      drawResearchConstructionMid(
        ctx,
        api,
        `${modelState.reward.toFixed(6)} + .95 × ${modelState.next.toFixed(1)} = ${modelState.target.toFixed(6)}`,
        960,
        735,
        38,
        themeColors.yellow,
      );
      drawResearchConstructionResult(
        ctx,
        api,
        `Qnew = 0 + .35 × target = ${formatResearchSigned(ctx, api, modelState.updated, 6)}`,
        modelState.updated < 0 ? themeColors.pink : themeColors.green,
        855,
      );
    } else
      drawResearchConstructionMid(
        ctx,
        api,
        'target and update pending',
        960,
        760,
        34,
        themeColors.muted,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Earlier constructed picture: α=.20. Executed study: α=.35.'
        : 'Ownership remains Q(starting state, intended action), despite the slip',
    );
  });
}
export default {
  id: 'actual-update',
  draw: drawActualUpdate,
  cues: [
    'rs-actual-update-0',
    'rsx-actual-update-b0-s0',
    'rsx-actual-update-b0-s1',
    'rsx-actual-update-b0-s2',
    'rs-actual-update-1',
    'rsx-actual-update-b1-s0',
    'rsx-actual-update-b1-s1',
    'rsx-actual-update-b1-s2',
    'rsx-actual-update-b1-s3',
    'rs-actual-update-2',
    'rsx-actual-update-b2-s0',
    'rsx-actual-update-b2-s1',
    'rsx-actual-update-b2-s2',
    'rsx-actual-update-b2-s3',
  ],
};
