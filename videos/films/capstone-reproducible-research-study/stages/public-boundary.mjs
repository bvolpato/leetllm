import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawPublicBoundary(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = researchConstructionModel('public-boundary', state),
    currentBeat = modelState.b;
  api.focus.target('rs-public-boundary-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Only simulated actions cross the experiment boundary',
    );
    components.panel({
      x: 190,
      y: 345,
      width: 1220,
      height: 545,
      fill: themeColors.panel,
      stroke: themeColors.cyan,
      radius: 10,
    });
    drawResearchConstructionText(ctx, api, 'LOCAL CPU + NUMPY', 230, 392, 31, themeColors.cyan);
    ['config', 'explore/action/tie/slip', 'left / right', 'generated rows'].forEach((v, i) => {
      drawResearchConstructionBox(
        ctx,
        api,
        v,
        250 + (i % 2) * 555,
        440 + Math.floor(i / 2) * 220,
        470,
        100,
        themeColors.cyan,
        28,
      );
      if (i < 2) drawResearchConstructionArrow(ctx, api, 485 + i * 555, 550, 485 + i * 555, 635);
    });
    ['network', 'account action', 'private logs'].forEach((v, i) => {
      const y = 445 + i * 145;
      drawResearchConstructionText(ctx, api, v, 1500, y + 15, 29, themeColors.muted);
      drawResearchConstructionLine(ctx, api, 1430, y, 1480, y, themeColors.pink, 5);
      drawResearchConstructionLine(ctx, api, 1455, y - 20, 1455, y + 20, themeColors.pink, 5);
    });
    drawResearchConstructionFooter(
      ctx,
      api,
      currentBeat
        ? 'Release review: credentials · machine paths · licenses'
        : 'Synthetic transitions bound this study; they do not prove deployed behavior',
    );
  });
}
export default {
  id: 'public-boundary',
  draw: drawPublicBoundary,
  cues: [
    'rs-public-boundary-0',
    'rsx-public-boundary-b0-s0',
    'rsx-public-boundary-b0-s1',
    'rsx-public-boundary-b0-s2',
    'rs-public-boundary-1',
    'rsx-public-boundary-b1-s0',
    'rsx-public-boundary-b1-s1',
    'rsx-public-boundary-b1-s2',
  ],
};
