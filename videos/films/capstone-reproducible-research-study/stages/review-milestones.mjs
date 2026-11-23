import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
} from '../defaults.mjs';
export function drawReviewMilestones(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('review-milestones', state),
    currentBeat = modelState.b;
  api.focus.target('rs-review-milestones-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Advance evidence status by exercising the actual layer',
    );
    const names = [
      '1 source +plan',
      '2 pilot +control',
      '3 every seed +resample',
      '4 clean clone +defense',
    ];
    names.forEach((v, i) => {
      const x = 210 + i * 420;
      drawResearchConstructionBox(
        ctx,
        api,
        v,
        x,
        380,
        350,
        110,
        i <= currentBeat ? themeColors.cyan : themeColors.muted,
        28,
      );
      if (i < 3)
        drawResearchConstructionArrow(ctx, api, x + 360, 435, x + 405, 435, themeColors.muted);
    });
    const jobs = [
      'Trace equation; predict a rejecting outcome',
      'Inspect a transition; verify exact zero-potential control',
      'Recompute headline; rerun an identified pair',
      'Produce primary table; identify an unsupported inference',
    ];
    drawResearchConstructionBox(
      ctx,
      api,
      jobs[Math.min(currentBeat, 3)],
      300,
      660,
      1320,
      145,
      themeColors.yellow,
      34,
    );
    drawResearchConstructionFooter(
      ctx,
      api,
      'A manifest or review directory is not a performed check',
    );
  });
}
export default {
  id: 'review-milestones',
  draw: drawReviewMilestones,
  cues: [
    'rs-review-milestones-0',
    'rsx-review-milestones-b0-s0',
    'rsx-review-milestones-b0-s1',
    'rs-review-milestones-1',
    'rsx-review-milestones-b1-s0',
    'rsx-review-milestones-b1-s1',
    'rs-review-milestones-2',
    'rsx-review-milestones-b2-s0',
    'rsx-review-milestones-b2-s1',
    'rsx-review-milestones-b2-s2',
    'rs-review-milestones-3',
    'rsx-review-milestones-b3-s0',
    'rsx-review-milestones-b3-s1',
    'rsx-review-milestones-b3-s2',
  ],
};
