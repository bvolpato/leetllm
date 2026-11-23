import { exclusive } from '../arithmetic.mjs';
import { ARTICLE_INPUT } from '../fixtures.mjs';
import {
  drawExtendedArrow,
  drawExtendedBox,
  drawExtendedLine,
  drawExtendedRow,
  drawExtendedTarget,
  drawExtendedText,
  drawExtendedTitle,
} from '../defaults.mjs';
export function drawHazardProof(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const q = (id, a = 0.12, z = 0.8) => {
    const v = state.cues?.[id];
    return v
      ? v.phase === 'before'
        ? 0
        : v.phase === 'after'
          ? 1
          : api.clamp(v.progress)
      : api.phase(progress, a, z);
  };
  {
    if (currentBeat === 0) {
      drawExtendedTitle(ctx, api, 'Shared slot s · ordering determines the hazard');
      drawExtendedTarget(ctx, api, 'hazard-orders', () => {
        const pairs = [
          ['Producer write', 'Consumer read', 'RAW', themeColors.pink],
          ['Consumer read', 'Next write', 'WAR', themeColors.yellow],
          ['Writer A', 'Writer B', 'WAW', themeColors.pink],
          ['Reader A', 'Reader B', 'two reads', themeColors.green],
        ];
        pairs.forEach(([a, z, name, col], i) => {
          const y = 365 + i * 145;
          drawExtendedBox(ctx, api, a, 230, y, 360, 75, col, 29);
          drawExtendedBox(ctx, api, 's', 850, y, 120, 75, themeColors.muted, 29);
          drawExtendedBox(ctx, api, z, 1200, y, 360, 75, col, 29);
          drawExtendedLine(ctx, api, 620, y + 37, 820, y + 37, col);
          drawExtendedLine(ctx, api, 1000, y + 37, 1170, y + 37, col);
          drawExtendedText(ctx, api, name, 1720, y + 50, 31, col);
        });
      });
    } else if (currentBeat === 1) {
      drawExtendedTitle(ctx, api, 'Choose the tool for the failure you suspect');
      drawExtendedTarget(ctx, api, 'hazard-tools', () => {
        [
          ['memcheck', 'Out-of-bounds or misaligned load'],
          ['racecheck', 'Two warps reuse a shared slot too soon'],
          ['synccheck', 'Some threads skip a block barrier'],
        ].forEach(([name, scope], i) => {
          const y = 405 + i * 180;
          drawExtendedBox(ctx, api, name, 220, y, 380, 90, themeColors.blue, 34);
          drawExtendedBox(ctx, api, scope, 910, y, 790, 90, themeColors.cyan, 34);
          drawExtendedArrow(ctx, api, 630, y + 45, 880, y + 45, themeColors.yellow);
        });
      });
    } else {
      drawExtendedTitle(ctx, api, 'Block B starts seven points too low');
      drawExtendedTarget(ctx, api, 'hazard-evidence', () => {
        const local = exclusive(ARTICLE_INPUT.slice(4));
        const expected = exclusive(ARTICLE_INPUT).slice(4);
        drawExtendedRow(ctx, api, local, 410, {
          x: 460,
          step: 285,
          w: 200,
          col: themeColors.pink,
        });
        drawExtendedText(ctx, api, 'Second block local prefixes', 960, 365, 32, themeColors.pink);
        const ready = q('hazard-offset', 0.23, 0.4) >= 1;
        drawExtendedRow(ctx, api, ready ? expected : local.map(() => '?'), 690, {
          x: 460,
          step: 285,
          w: 200,
          col: themeColors.green,
        });
        for (let i = 0; i < 4; i++)
          if (ready) {
            drawExtendedArrow(ctx, api, 560 + i * 285, 505, 560 + i * 285, 665, themeColors.yellow);
            drawExtendedText(
              ctx,
              api,
              '+' + (expected[i] - local[i]),
              625 + i * 285,
              595,
              30,
              themeColors.yellow,
            );
          }
        drawExtendedText(
          ctx,
          api,
          'Serial scan across both blocks',
          960,
          935,
          30,
          themeColors.cyan,
        );
      });
    }
    return;
  }
  return;
}
export default {
  id: 'hazard-proof',
  draw: drawHazardProof,
  cues: [
    'hazard-proof-step-1',
    'hazard-writes',
    'hazard-proof-step-2',
    'hazard-proof-step-3',
    'hazard-offset',
    'hazard-cpu',
  ],
};
