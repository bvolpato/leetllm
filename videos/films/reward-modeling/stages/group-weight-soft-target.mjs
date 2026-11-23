import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBar,
  drawRewardExpansionBox,
  drawRewardExpansionDot,
  drawRewardExpansionFoot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawGroupWeightSoftTarget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('group-weight-soft-target-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Pair count changes loss weight before any optimizer step',
      );
      const built = Math.floor(q('group-pairs', 0.05, 0.28) * 36.999);
      for (let i = 0; i < 36; i++) {
        const x = 160 + (i % 6) * 105,
          y = 390 + Math.floor(i / 6) * 65;
        api.rect(
          ctx,
          x,
          y,
          88,
          48,
          i < built ? themeColors.cyan : themeColors.panel,
          i < built ? themeColors.cyan : themeColors.muted,
          5,
        );
      }
      drawRewardExpansionText(ctx, api, 'Prompt P · nine answers', 465, 345, 31, themeColors.cyan);
      drawRewardExpansionText(
        ctx,
        api,
        built + ' / 36 comparisons',
        465,
        865,
        32,
        themeColors.cyan,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'Q · two answers · one pair',
        1110,
        400,
        630,
        100,
        themeColors.blue,
        33,
      );
      const w = q('group-weights', 0.55, 0.8),
        weight = (36 / 37) * (1 - w) + 0.5 * w;
      drawRewardExpansionText(ctx, api, 'Loss weight for P', 1440, 600, 33, themeColors.yellow);
      drawRewardExpansionBar(ctx, api, 1120, 655, 620, 55, weight, themeColors.cyan);
      drawRewardExpansionText(
        ctx,
        api,
        built === 36
          ? 'Current P = ' + weight.toFixed(3) + ' · Q = ' + (1 - weight).toFixed(3)
          : 'Build the correlated rows first',
        1440,
        790,
        32,
        themeColors.yellow,
      );
      if (built === 36)
        drawRewardExpansionText(
          ctx,
          api,
          'Raw baseline: P = 36/37 · Q = 1/37',
          1440,
          860,
          29,
          themeColors.muted,
        );
      drawRewardExpansionText(
        ctx,
        api,
        w > 0
          ? 'Mean within each prompt, then mean across prompts'
          : 'Each small cell is one pair loss',
        960,
        950,
        32,
        themeColors.ink,
      );
      if (w === 1)
        drawRewardExpansionFoot(
          ctx,
          api,
          'Both prompts have equal loss weight. Gradient size depends on the pairs.',
        );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(ctx, api, 'A full order uses sequential conditional choices');
      const values = [3, 2, 1],
        xs = [400, 960, 1520];
      const removed = q('pl-remove', 0.4, 0.5);
      values.forEach((v, i) => {
        const h = v * 95 * (i === 0 ? 1 - removed : 1);
        if (h > 0)
          api.rect(
            ctx,
            xs[i] - 105,
            750 - h,
            210,
            h,
            [themeColors.green, themeColors.blue, themeColors.pink][i],
            undefined,
            7,
          );
        drawRewardExpansionText(
          ctx,
          api,
          i === 0 && removed >= 1
            ? 'A · already chosen'
            : String.fromCharCode(65 + i) + ' · strength ' + v,
          xs[i],
          805,
          31,
          [themeColors.green, themeColors.blue, themeColors.pink][i],
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        on('pl-first') ? 'A first: 3 / (3 + 2 + 1) = ½' : 'Select the first item from all three',
        960,
        360,
        33,
        themeColors.yellow,
      );
      if (on('pl-second')) {
        drawRewardExpansionArrow(ctx, api, 440, 850, 870, 850, themeColors.green);
        drawRewardExpansionText(
          ctx,
          api,
          'Then B: 2 / (2 + 1) = ⅔',
          960,
          910,
          33,
          themeColors.blue,
        );
      }
      drawRewardExpansionText(
        ctx,
        api,
        on('pl-product') ? 'P(A, B, C) = ½ × ⅔ = ⅓' : 'Full-order result pending',
        960,
        980,
        35,
        on('pl-product') ? themeColors.yellow : themeColors.muted,
      );
    } else {
      drawRewardExpansionTitle(
        ctx,
        api,
        'A repeated-vote fraction and an explicit tie are different annotations',
      );
      const votes = [1, 1, 1, 0, 0];
      votes.forEach((v, i) =>
        drawRewardExpansionBox(
          ctx,
          api,
          v ? 'A' : 'B',
          380 + i * 245,
          380,
          180,
          95,
          v ? themeColors.green : themeColors.pink,
          42,
        ),
      );
      drawRewardExpansionText(
        ctx,
        api,
        'Supplied fixed identities · three A votes / five judgments',
        960,
        550,
        31,
        themeColors.cyan,
      );
      const x = 300,
        y = 690,
        w = 1320;
      drawRewardExpansionL(ctx, api, x, y, x + w, y);
      [0, 0.6, 1].forEach((v) => {
        drawRewardExpansionL(ctx, api, x + v * w, y - 12, x + v * w, y + 12);
        drawRewardExpansionText(ctx, api, v.toFixed(1), x + v * w, y + 65, 28, themeColors.muted);
      });
      const forecast = 0.2 + 0.4 * q('soft-optimum', 0.4, 0.75);
      drawRewardExpansionDot(ctx, api, x + forecast * w, y, 17, themeColors.yellow);
      drawRewardExpansionText(
        ctx,
        api,
        on('soft-optimum')
          ? 'BCE optimum forecast = q = 0.6'
          : 'Move a forecast toward the supplied vote fraction',
        960,
        865,
        35,
        themeColors.yellow,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'Opposing preferences in a split vote ≠ an explicit equally-good tie',
        960,
        950,
        32,
        themeColors.ink,
      );
    }
  });
}
export default {
  id: 'group-weight-soft-target',
  draw: drawGroupWeightSoftTarget,
  cues: [
    'group-weight-soft-target-step-1',
    'group-pairs',
    'group-weights',
    'group-weight-soft-target-step-2',
    'pl-first',
    'pl-remove',
    'pl-second',
    'pl-product',
    'group-weight-soft-target-step-3',
    'soft-optimum',
  ],
};
