import { complete, memoryRecipe, sentence } from '../construction.mjs';
import {
  drawChapterBar,
  drawChapterCard,
  drawChapterFooter,
  drawChapterText,
} from '../defaults.mjs';
export function drawDtypeLedger(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'dtype-ledger', beat, index),
    resultComplete = (beat, index) => complete(state, 'dtype-ledger', beat, index);
  api.focus.target('dtype-ledger-construction', () => {
    const base = [3, 3, 6, 6, 6],
      names = ['Compute W', 'Gradient', 'Master W', 'First moment', 'Second moment'],
      colors = [
        themeColors.blue,
        themeColors.cyan,
        themeColors.pink,
        themeColors.pink,
        themeColors.pink,
      ];
    const visible = currentBeat
      ? 5
      : resultComplete(0, 2)
        ? 5
        : resultComplete(0, 1)
          ? 2
          : resultComplete(0, 0)
            ? 1
            : 0;
    const changed = currentBeat > 1 || sentenceProgress(1, 0) > 0,
      parts = [3, changed ? 6 : 3, 6, 6, 6];
    drawChapterText(ctx, api, 'P = 1.5B parameters · decimal GB', 150, 285, 34, themeColors.yellow);
    drawChapterText(
      ctx,
      api,
      'Each array has its own dtype',
      1750,
      285,
      30,
      themeColors.muted,
      'right',
    );
    names.forEach((name, i) => {
      const x = 150 + i * 335,
        show = i < visible;
      drawChapterCard(ctx, api, name, x, 360, 300, colors[i], 85, 28);
      drawChapterText(
        ctx,
        api,
        show ? (i === 1 && changed ? '4 bytes' : ' ' + (i < 2 ? 2 : 4) + ' bytes') : 'pending',
        x + 150,
        520,
        30,
        show ? colors[i] : themeColors.muted,
        'center',
      );
      if (show) {
        drawChapterBar(ctx, api, '', parts[i], 6, x, 570, 300, colors[i]);
        drawChapterText(ctx, api, parts[i] + ' GB', x + 150, 695, 39, colors[i], 'center');
      }
    });
    if (currentBeat === 0 && resultComplete(0, 3))
      drawChapterText(
        ctx,
        api,
        '3 + 3 + 6 + 6 + 6 = 24 GB',
        960,
        835,
        43,
        themeColors.green,
        'center',
      );
    if (currentBeat === 1 && resultComplete(1, 1))
      drawChapterText(
        ctx,
        api,
        '3 + 6 + 6 + 6 + 6 = 27 GB',
        960,
        835,
        43,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2) {
      const s2 = memoryRecipe(1.5, 4, 2, 4, 12, 2),
        s3 = memoryRecipe(1.5, 4, 2, 4, 12, 3);
      drawChapterText(
        ctx,
        api,
        'Supplied N = 4 · current 4-byte gradient recipe',
        960,
        790,
        29,
        themeColors.muted,
        'center',
      );
      if (resultComplete(2, 1))
        drawChapterText(
          ctx,
          api,
          'Stage 2: 3 + (6 + 18)/4 = ' + s2.total + ' GB',
          960,
          865,
          36,
          themeColors.cyan,
          'center',
        );
      if (resultComplete(2, 2))
        drawChapterText(
          ctx,
          api,
          'Stage 3: (3 + 6 + 18)/4 = ' + s3.total + ' GB',
          960,
          940,
          36,
          themeColors.green,
          'center',
        );
    }
    drawChapterFooter(
      ctx,
      api,
      'Persistent arrays only · activations, padded gathers and workspace remain additional',
    );
  });
}
export default {
  id: 'dtype-ledger',
  draw: drawDtypeLedger,
  cues: [
    'ds-dtype-ledger-b0-s0',
    'ds-dtype-ledger-b0-s1',
    'ds-dtype-ledger-b0-s2',
    'ds-dtype-ledger-b0-s3',
    'ds-dtype-ledger-b0-s4',
    'ds-dtype-ledger-b1-s0',
    'ds-dtype-ledger-b1-s1',
    'ds-dtype-ledger-b1-s2',
    'ds-dtype-ledger-b1-s3',
    'ds-dtype-ledger-b1-s4',
    'ds-dtype-ledger-b2-s0',
    'ds-dtype-ledger-b2-s1',
    'ds-dtype-ledger-b2-s2',
    'ds-dtype-ledger-b2-s3',
  ],
};
