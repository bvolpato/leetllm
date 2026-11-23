import { pageCount } from '../model.mjs';
import {
  cueProgress,
  drawBatchingUpgradeArrow,
  drawBatchingUpgradeBox,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradePagePool,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawPhysicalPages(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    const { C: themeColors } = api;
    {
      if (currentBeat < 2) {
        const pair = currentBeat === 1 ? cueProgress(state, 'physical-pair', 0.01, 0.14) : 0;
        const third = currentBeat === 1 && cueProgress(state, 'physical-map', 0.20, 0.28) > 0;
        const mapped = third ? 3 : Math.ceil(2 * pair);
        const pages = [0, 1, 6];
        const owners = Array(8).fill(null);
        [2, 3, 4].forEach((i) => (owners[i] = 'C'));
        owners[5] = 'B';
        pages.slice(0, mapped).forEach(i => (owners[i] = 'D'));
        drawBatchingUpgradeText(
          ctx,
          api,
          'Three pages in D’s history',
          960,
          280,
          32,
          themeColors.muted,
          'center',
        );
        drawBatchingUpgradePagePool(ctx, api, owners, 180, 620, 198);
        [0, 1, 2].forEach((logical, i) => {
          drawBatchingUpgradeBox(
            ctx,
            api,
            'Logical page ' + logical,
            350 + i * 490,
            370,
            300,
            90,
            themeColors.yellow,
            29,
          );
          if (i < mapped)
            drawBatchingUpgradeArrow(
              ctx,
              api,
              500 + i * 490,
              475,
              180 + pages[i] * 198 + 90,
              600,
              themeColors.yellow,
            );
        });
        drawBatchingUpgradeText(
          ctx,
          api,
          third
            ? 'D maps to 0, 1, 6 · page 7 stays free'
            : mapped === 2 ? 'One more page for D' : 'Which free pages could D use?',
          960,
          920,
          35,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 2) {
        const pageSize = 16;
        const lengths = [17, 31, 48, 65];
        const reserved = lengths.map((n) => pageCount(n, pageSize) * pageSize);
        const capacity = reserved.reduce((sum, slots) => sum + slots, 0);
        const used = lengths.reduce((sum, slots) => sum + slots, 0);
        api.text(ctx, `Four histories  ·  ${capacity / pageSize} pages of ${pageSize} slots`,
          960, 232, 37, themeColors.ink, 'center');
        for (const [i, name] of ['History', 'Reserved', 'Last page of 16', 'Unused'].entries())
          api.text(ctx, name, [260, 505, 1070, 1595][i], 300, 35, themeColors.muted, 'center');
        lengths.forEach((length, i) => {
          const y = 418 + i * 118;
          const slack = reserved[i] - length;
          api.text(ctx, String(length), 260, y, 44, themeColors.ink, 'center');
          api.text(ctx, String(reserved[i]), 505, y, 44, themeColors.ink, 'center');
          for (let j = 0; j < pageSize; j++)
            api.rect(ctx, 685 + j * 49, y - 40, 43, 49,
              j < pageSize - slack ? themeColors.cyan : themeColors.panel,
              j < pageSize - slack ? themeColors.cyan : themeColors.yellow, 3);
          api.text(ctx, String(slack), 1595, y, 44, themeColors.yellow, 'center');
        });
        if (cueProgress(state, 'physical-slack', 0.53, 0.58) > 0) drawBatchingUpgradeText(
          ctx,
          api,
          `${capacity} allocated − ${used} used = ${capacity - used} unused slots`,
          960,
          930,
          39,
          themeColors.yellow,
          'center',
        );
      } else {
        drawBatchingUpgradeText(
          ctx,
          api,
          'Grouped-query attention  ·  24 query heads share 4 KV heads',
          960,
          285,
          32,
          themeColors.cyan,
          'center',
        );
        for (let k = 0; k < 4; k++) {
          drawBatchingUpgradeBox(
            ctx,
            api,
            'KV' + (k + 1),
            280 + k * 370,
            550,
            250,
            100,
            themeColors.blue,
            35,
          );
          for (let q = 0; q < 6; q++) {
            const x = 290 + k * 370 + q * 38;
            api.circle(ctx, x, 390, 9, themeColors.cyan);
            api.line(ctx, x, 410, 405 + k * 370, 535, themeColors.muted, 2);
          }
        }
        if (cueProgress(state, 'physical-bytes', 0.37, 0.44) > 0) drawBatchingUpgradeText(
          ctx,
          api,
          '2 × 16 × 4 × 256 × 2 = 65,536 bytes per position',
          960,
          800,
          36,
          themeColors.yellow,
          'center',
        );
        if (cueProgress(state, 'physical-total', 0.53, 0.60) > 0) drawBatchingUpgradeText(
          ctx,
          api,
          '4,096 positions  ·  256 full pages  ·  0.25 GiB attention KV',
          960,
          900,
          36,
          themeColors.green,
          'center',
        );
      }
      if (currentBeat === 3 && cueProgress(state, 'physical-total', 0.53, 0.60) >= 1)
        drawBatchingUpgradeFoot(ctx, api, 'Additional memory includes recurrent state, model weights and workspace');
    }
    return;
  });
}
export default {
  id: 'physical-pages',
  draw: drawPhysicalPages,
  cues: ['physical-pages-b1', 'physical-pair', 'physical-map', 'physical-pages-b2', 'physical-slack',
    'physical-pages-b3', 'physical-bytes', 'physical-total'],
};
