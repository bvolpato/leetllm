import { budgetSnapshot } from '../construction.mjs';
import { largeEquation, largeText } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0),
      F = components.fade;
    {
      const snapshot = budgetSnapshot(currentBeat, progress, state.cues),
        size = 320,
        top = 410;
      [145, 560].forEach((x, index) => {
        api.focus.target('patch-grid-' + index, () =>
          api.rect(ctx, x, top, size, size, themeColors.panel, themeColors.cyan, 0),
        );
        for (let i = 1; i < 14; i++) {
          api.line(
            ctx,
            x + (i * size) / 14,
            top,
            x + (i * size) / 14,
            top + size,
            themeColors.cyan,
            1,
          );
          api.line(
            ctx,
            x,
            top + (i * size) / 14,
            x + size,
            top + (i * size) / 14,
            themeColors.cyan,
            1,
          );
        }
        if (index === 1)
          for (let i = 1; i < 28; i += 2) {
            api.line(
              ctx,
              x + (i * size) / 28,
              top,
              x + (i * size) / 28,
              top + size * snapshot.refinement,
              themeColors.pink,
              1.5,
            );
            api.line(
              ctx,
              x,
              top + (i * size) / 28,
              x + size * snapshot.refinement,
              top + (i * size) / 28,
              themeColors.pink,
              1.5,
            );
          }
        largeText(
          ctx,
          api,
          index === 0
            ? '16-pixel patches'
            : snapshot.refinement === 0
              ? 'Try 8-pixel patches'
              : '8-pixel patches',
          x + size / 2,
          360,
          29,
          index ? themeColors.pink : themeColors.cyan,
          'center',
        );
        largeEquation(
          ctx,
          api,
          index === 0 ? '14^2=196' : snapshot.refinement < 1 ? '?' : '28^2=784',
          x + size / 2,
          800,
          35,
          index ? themeColors.pink : themeColors.cyan,
          'center',
        );
      });
      largeText(ctx, api, 'Same 224 × 224 image', 515, 890, 26, themeColors.muted, 'center');
      const block = 100,
        mx = 1285,
        my = 410,
        width = block * snapshot.keyGroups,
        height = block * snapshot.queryGroups;
      largeText(
        ctx,
        api,
        'Dense attention · queries × keys',
        1485,
        285,
        30,
        themeColors.ink,
        'center',
      );
      largeText(
        ctx,
        api,
        snapshot.keyGroups === 1
          ? '196 keys'
          : snapshot.keyGroups === 4
            ? '784 keys · 4 groups'
            : 'Expanding the key axis',
        1485,
        360,
        25,
        themeColors.pink,
        'center',
      );
      largeText(
        ctx,
        api,
        snapshot.queryGroups === 1
          ? '196 queries'
          : snapshot.queryGroups === 4
            ? '784 queries'
            : 'More queries',
        1150,
        650,
        24,
        themeColors.pink,
        'center',
      );
      for (let r = 0; r < 4; r++)
        for (let col = 0; col < 4; col++) {
          const w = Math.max(0, Math.min(block, width - col * block)),
            h = Math.max(0, Math.min(block, height - r * block));
          if (w > 0 && h > 0)
            api.focus.target('attention-pair-blocks', () =>
              api.rect(
                ctx,
                mx + col * block,
                my + r * block,
                w,
                h,
                (r === 0 && col === 0 ? themeColors.cyan : themeColors.pink) + '33',
                r === 0 && col === 0 ? themeColors.cyan : themeColors.pink,
                0,
              ),
            );
        }
      api.arrow(ctx, mx, my - 20, mx + width, my - 20, themeColors.pink, 3);
      api.arrow(ctx, mx - 20, my, mx - 20, my + height, themeColors.pink, 3);
      largeText(
        ctx,
        api,
        'Each block: 196 × 196 = 38,416 pairs',
        1485,
        890,
        25,
        themeColors.cyan,
        'center',
      );
      if (snapshot.keyGroups === 4 && snapshot.queryGroups === 4) {
        api.focus.target('attention-block-count', () =>
          largeEquation(
            ctx,
            api,
            String.raw`4\times4=16\;\text{blocks}`,
            1485,
            955,
            35,
            themeColors.pink,
            'center',
          ),
        );
        largeText(
          ctx,
          api,
          '784² = 614,656 patch-to-patch pairs',
          1485,
          1015,
          25,
          themeColors.pink,
          'center',
        );
      } else
        largeText(
          ctx,
          api,
          currentBeat === 0
            ? 'How many patches at 8 pixels per side?'
            : snapshot.keyGroups < 4
              ? 'Expand the key axis first'
              : 'Each query also attends to every key',
          1485,
          970,
          25,
          themeColors.yellow,
          'center',
        );
      if (currentBeat === 2)
        largeEquation(
          ctx,
          api,
          String.raw`\text{RGB patch input: }16^2\!\cdot3\;\to\;8^2\!\cdot3`,
          515,
          1000,
          29,
          themeColors.yellow,
          'center',
        );
      else
        largeText(
          ctx,
          api,
          'Auxiliary tokens excluded',
          515,
          1000,
          25,
          themeColors.muted,
          'center',
        );
    }
  }
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: [
    'budget-patch-grid-0-b1-1',
    'budget-refine',
    'budget-attention-block-count-b2-1',
    'budget-patch-grid-1-b3-1',
  ],
};
