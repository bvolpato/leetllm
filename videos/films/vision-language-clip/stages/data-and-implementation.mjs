import { IMAGE_FEATURES, TEXT_FEATURES } from '../fixtures.mjs';
import { FIXTURE } from '../observations.mjs';
import { spokenProgress } from '../construction.mjs';
import {
  drawClipLine,
  drawClipRectangle,
  drawClipText,
  rackPhoto,
  drawVent,
  withClipFocus,
} from '../defaults.mjs';
export function drawDataAndImplementation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    if (currentBeat === 0) {
      drawClipText(ctx, api, 'Two records from the same inspection', 960, 293, 38);
      rackPhoto(ctx, api, 210, 355, 620, 384, { selected: 'vent' });
      api.rect(ctx, 1090, 355, 620, 384, themeColors.panel, themeColors.muted, 2);
      drawVent(ctx, api, 1115, 478, 570, 140, true);
      drawClipText(ctx, api, '“Blocked vent on rack door”', 520, 815, 35);
      drawClipText(ctx, api, '“Cover across grille”', 1400, 815, 35);
      withClipFocus(ctx, api, 'data-contract', () => {
        if (clauseProgress('data-groups', 0) > 0) {
          drawClipLine(ctx, api, 210, 876, 1710, 876, themeColors.cyan, 5);
          drawClipText(
            ctx,
            api,
            'Keep both views in the same split',
            960,
            981,
            38,
            themeColors.cyan,
          );
        } else if (clauseProgress('data-cross-pair', 0) > 0) {
          drawClipText(
            ctx,
            api,
            'Full photo × “cover across grille”      Batch label: mismatch',
            960,
            981,
            35,
            themeColors.yellow,
          );
        }
      });
    } else if (currentBeat === 1) {
      const q = clauseProgress('data-normalize', 1);
      const vector = (v) => '[' + v.map((n) => n.toFixed(3)).join(',  ') + ']';
      drawClipText(ctx, api, 'Raw features', 760, 295, 38);
      drawClipText(ctx, api, 'Unit vectors', 1480, 295, 38);
      withClipFocus(ctx, api, 'data-contract', () => {
        for (const [i, [encoder, raw, unit, color]] of [
          ['encode_image', IMAGE_FEATURES[0], FIXTURE.images[0], themeColors.blue],
          ['encode_text', TEXT_FEATURES[0], FIXTURE.texts[0], themeColors.yellow],
        ].entries()) {
          const y = 433 + i * 141;
          api.text(ctx, encoder, 170, y, 38, color, 'left', 'mono');
          drawClipText(ctx, api, vector(raw), 760, y, 38, color);
          if (q > 0) {
            api.line(ctx, 1002, y - 12, 1002 + 207 * q, y - 12, color, 5);
            drawClipText(ctx, api, '÷ ' + Math.hypot(...raw).toFixed(3), 1106, y - 34, 28);
          }
          if (q === 1) drawClipText(ctx, api, vector(unit), 1480, y, 38, color);
        }
      });
      withClipFocus(ctx, api, 'data-product', () => {
        api.line(ctx, 170, 665, 1750, 665, themeColors.muted, 3);
        if (clauseProgress('data-cosine', 1) > 0)
          drawClipText(
            ctx,
            api,
            'Dot product of unit vectors   ≈   ' + FIXTURE.cosine[0][0].toFixed(3),
            960,
            755,
            43,
            themeColors.cyan,
          );
        if (clauseProgress('data-scale', 1) > 0)
          drawClipText(ctx, api, 'Full forward logit   =   cosine × learned scale', 960, 862, 42);
        if (clauseProgress('data-readme', 1) > 0)
          drawClipText(
            ctx,
            api,
            'README example logit   =   cosine × 100',
            960,
            964,
            33,
            themeColors.muted,
          );
      });
    } else {
      const q = clauseProgress('text-limit', 2),
        n = Math.floor(77 * q);
      drawClipText(ctx, api, '77 learned positions, including start and end', 960, 300, 37);
      for (let i = 0; i < 77; i++)
        drawClipRectangle(
          ctx,
          api,
          300 + (i % 26) * 50,
          430 + Math.floor(i / 26) * 80,
          36,
          50,
          i < n ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
      if (q > 0.9) {
        drawClipRectangle(ctx, api, 1600, 590, 45, 50, themeColors.red);
        drawClipText(ctx, api, '78 → reject or explicit truncation', 960, 800, 35, themeColors.red);
      }
      withClipFocus(ctx, api, 'data-contract', () =>
        drawClipText(
          ctx,
          api,
          'Paired towers + tokenizer + preprocessing + normalization + metric = one generation',
          960,
          1010,
          28,
          themeColors.yellow,
        ),
      );
    }
  }
}
export default {
  id: 'data-and-implementation',
  draw: drawDataAndImplementation,
  cues: [
    'data-cross-pair',
    'data-groups',
    'data-normalize',
    'data-cosine',
    'data-scale',
    'data-readme',
    'text-limit',
  ],
};
