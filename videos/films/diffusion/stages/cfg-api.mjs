import { opProgress } from '../construction.mjs';
import {
  drawConstructionEquation,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawCfgApi(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'cfg-api');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Translate scale conventions before copying a number'
        : 'Branch execution and mathematical scale have different contracts',
    );
    if (currentBeat === 0) {
      drawConstructionEquation(
        ctx,
        api,
        String.raw`\epsilon_c+w_{paper}(\epsilon_c-\epsilon_u)`,
        960,
        450,
        54,
      );
      drawConstructionEquation(
        ctx,
        api,
        String.raw`\epsilon_u+(1+w_{paper})(\epsilon_c-\epsilon_u)`,
        960,
        700,
        49,
      );
      drawConstructionText(
        ctx,
        api,
        progress > 0.72
          ? 'Paper scale 0 = common scale 1: both return the conditional prediction'
          : 'Compare the coefficient of the conditional difference',
        960,
        925,
        36,
        themeColors.cyan,
        'center',
      );
    } else {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Guide behavior', 'Meaning'],
          ['Scale > 1', 'Ordinary extra CFG branch enabled'],
          ['Scale ≤ 1', 'Extra branch can be disabled'],
          ['Negative prompt branch', 'Negatively conditioned, not unconditional'],
          ['One batched call', 'Can calculate two predictions / image'],
        ],
        190,
        380,
        1540,
        440,
        themeColors.cyan,
        28,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Moving Stable Diffusion pipeline guide inspected November 7, 2026',
      );
    }
    return;
  }
}
export default {
  id: 'cfg-api',
  draw: drawCfgApi,
  cues: ['df-cfg-api-0', 'df-cfg-api-1'],
};
