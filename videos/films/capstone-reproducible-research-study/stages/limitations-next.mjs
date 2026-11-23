import { researchConstructionModel } from '../model.mjs';
import { researchEvent } from '../construction.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionRect,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawLimitationsNext(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('limitations-next', state),
    currentBeat = modelState.b;
  api.focus.target('rs-limitations-next-mechanism', () => {
    drawResearchConstructionHeader(ctx, api, 'Give the learner a turn at square three.');
    const extension = researchEvent(scene.id, state, 0, 0);
    const grid = (x, y, branch) => {
      for (let j = 0; j < 7; j++)
        drawResearchConstructionRect(
          ctx,
          api,
          x + j * 75,
          y,
          58,
          58,
          themeColors.panel,
          themeColors.cyan,
        );
      if (branch)
        for (let j = 0; j < Math.ceil(3 * extension); j++)
          drawResearchConstructionRect(
            ctx,
            api,
            x + 225,
            y + 80 + j * 75,
            58,
            58,
            themeColors.panel,
            themeColors.yellow,
          );
    };
    grid(230, 390, false);
    drawResearchConstructionArrow(ctx, api, 815, 420, 1035, 420);
    grid(1100, 390, true);
    drawResearchConstructionMid(ctx, api, 'Observed corridor', 480, 335, 32, themeColors.cyan);
    drawResearchConstructionMid(
      ctx,
      api,
      'Proposed branching test',
      1380,
      335,
      32,
      themeColors.yellow,
    );
    const rows = [
      ['tabular learner', 'function approximation'],
      ['one potential/config', 'fixed family / crossed design'],
      ['synthetic transitions', 'new target-task evidence'],
    ];
    rows.slice(0, [0, 2, 3][currentBeat]).forEach((r, i) => {
      const y = 740 + i * 80;
      drawResearchConstructionText(ctx, api, r[0], 235, y, 31, themeColors.cyan);
      drawResearchConstructionArrow(ctx, api, 820, y - 10, 1040, y - 10, themeColors.muted);
      drawResearchConstructionText(ctx, api, r[1], 1100, y, 30, themeColors.yellow);
    });
    drawResearchConstructionFooter(
      ctx,
      api,
      [
        'Compare early goal rates on the new grid.',
        'Choose the seed budget for the precision you need.',
        'For a claim about a deployed agent, measure it on its intended task.',
      ][currentBeat],
    );
  });
}
export default {
  id: 'limitations-next',
  draw: drawLimitationsNext,
  cues: [
    'rs-limitations-next-0',
    'rsx-limitations-next-b0-s0',
    'rsx-limitations-next-b0-s1',
    'rsx-limitations-next-b0-s2',
    'rs-limitations-next-1',
    'rsx-limitations-next-b1-s0',
    'rsx-limitations-next-b1-s1',
    'rs-limitations-next-2',
    'rsx-limitations-next-b2-s0',
    'rsx-limitations-next-b2-s1',
    'rsx-limitations-next-b2-s2',
  ],
};
