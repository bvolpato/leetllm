import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawTalkDefense(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('talk-defense', state),
    currentBeat = modelState.b;
  api.focus.target('rs-talk-defense-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Eight minutes of evidence, then two minutes of questions',
    );
    const durations = [45, 60, 75, 90, 105, 60, 45],
      names = ['problem', 'source', 'hypothesis', 'design', 'result', 'checks', 'limits'];
    let x = 200;
    durations.forEach((v, i) => {
      const w = (v / 600) * 1500;
      drawResearchConstructionRect(
        ctx,
        api,
        x,
        425,
        w,
        160,
        i % 2 ? themeColors.cyan : themeColors.blue,
        themeColors.muted,
      );
      drawResearchConstructionMid(ctx, api, v + 's', x + w / 2, 485, 28, themeColors.ink);
      drawResearchConstructionText(ctx, api, names[i], x + 6, 635, 26, themeColors.muted);
      x += w;
    });
    drawResearchConstructionRect(ctx, api, x, 425, 300, 160, themeColors.panel, themeColors.yellow);
    drawResearchConstructionMid(ctx, api, 'Q&A   120 s', x + 150, 525, 32, themeColors.yellow);
    drawResearchConstructionMid(
      ctx,
      api,
      '45 + 60 + 75 + 90 + 105 + 60 + 45 = 480 seconds',
      960,
      770,
      34,
      themeColors.cyan,
    );
    if (currentBeat >= 1)
      drawResearchConstructionBox(
        ctx,
        api,
        'Questions about precision, regressions, theory and absolute scores',
        340,
        865,
        1240,
        85,
        themeColors.yellow,
        30,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'One retained table feeds the figure, report and answers',
    );
  });
}
export default {
  id: 'talk-defense',
  draw: drawTalkDefense,
  cues: [
    'rs-talk-defense-0',
    'rsx-talk-defense-b0-s0',
    'rsx-talk-defense-b0-s1',
    'rsx-talk-defense-b0-s2',
    'rs-talk-defense-1',
    'rsx-talk-defense-b1-s0',
    'rsx-talk-defense-b1-s1',
    'rsx-talk-defense-b1-s2',
    'rsx-talk-defense-b1-s3',
    'rsx-talk-defense-b1-s4',
    'rsx-talk-defense-b1-s5',
    'rsx-talk-defense-b1-s6',
    'rsx-talk-defense-b1-s7',
    'rsx-talk-defense-b1-s8',
    'rs-talk-defense-2',
    'rsx-talk-defense-b2-s0',
    'rsx-talk-defense-b2-s1',
    'rsx-talk-defense-b2-s2',
    'rsx-talk-defense-b2-s3',
  ],
};
