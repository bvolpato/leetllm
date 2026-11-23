import { sha } from '../arithmetic.mjs';
import {
  drawConstructionArrow,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionSheet,
  drawConstructionText,
} from '../defaults.mjs';
export function drawUnicodeRecipe(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const v = drawConstructionP(ctx, api, `${'unicode-recipe'}-voice-${currentBeat + 1}`);
  api.focus.target('unicode-recipe-construction', () => {
    if (currentBeat === 0) {
      drawConstructionText(
        ctx,
        api,
        'Pinned raw text → NFKC → full casefold',
        160,
        300,
        34,
        themeColors.cyan,
      );
      const raw = ['ﬁ', '²', 'Ａ', 'ẞ'],
        out = ['fi', '2', 'A', 'ss'];
      raw.forEach((r, i) => {
        const x = 170 + i * 420;
        drawConstructionText(ctx, api, 'raw', x + 120, 410, 25, themeColors.muted, 'center');
        drawConstructionText(ctx, api, r, x + 120, 505, 64, themeColors.ink, 'center');
        const p =
          i < 3
            ? drawConstructionP(ctx, api, 'unicode-compat')
            : drawConstructionP(ctx, api, 'unicode-case');
        drawConstructionArrow(ctx, api, x + 120, 550, x + 120, 650, themeColors.blue);
        if (p > (i < 3 ? (i + 1) / 4 : 0.7))
          drawConstructionText(ctx, api, out[i], x + 120, 755, 64, themeColors.green, 'center');
        else drawConstructionText(ctx, api, '?', x + 120, 755, 64, themeColors.muted, 'center');
      });
      drawConstructionNote(
        ctx,
        api,
        'The illustrated outputs reproduce the Python fixture, not JavaScript lowercase alone.',
      );
    } else if (currentBeat === 1) {
      const p = drawConstructionP(ctx, api, 'unicode-collision');
      drawConstructionText(
        ctx,
        api,
        'Raw sources keep the distinction available',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionSheet(ctx, api, 'message A', 'Straße', 170, 390, 620);
      drawConstructionSheet(ctx, api, 'message B', 'STRASSE', 170, 550, 620);
      drawConstructionText(ctx, api, 'strasse', 1310, 540, 52, themeColors.green, 'center', true);
      drawConstructionArrow(ctx, api, 820, 450, 1100, 500);
      drawConstructionArrow(ctx, api, 820, 610, 1100, 560);
      if (p > 0) {
        drawConstructionSheet(ctx, api, 'resource A', 'Prod', 170, 760, 400);
        drawConstructionSheet(ctx, api, 'resource B', 'prod', 650, 760, 400);
        drawConstructionText(ctx, api, 'prod', 1470, 825, 50, themeColors.pink, 'center', true);
        drawConstructionArrow(ctx, api, 1080, 815, 1300, 815, themeColors.pink);
      }
      drawConstructionNote(
        ctx,
        api,
        'A shared key prompts a task-specific decision; it does not merge event identities.',
      );
    } else {
      const text = 'build is still failing',
        hash = sha('build is still failing'),
        p = drawConstructionP(ctx, api, 'unicode-hash');
      drawConstructionText(
        ctx,
        api,
        'Exact identity of normalized UTF-8 bytes',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionText(
        ctx,
        api,
        'build is still failing',
        220,
        440,
        40,
        themeColors.ink,
        'left',
        true,
      );
      const bytes = Buffer.from('build is still failing');
      for (let i = 0; i < bytes.length; i++)
        if (i < Math.ceil(p * bytes.length)) {
          const x = 200 + (i % 11) * 140,
            y = 535 + Math.floor(i / 11) * 90;
          drawConstructionText(
            ctx,
            api,
            bytes[i].toString(16).padStart(2, '0'),
            x,
            y,
            30,
            themeColors.blue,
            'left',
            true,
          );
        }
      if (p === 1) {
        drawConstructionText(ctx, api, 'SHA-256', 220, 780, 28, themeColors.muted);
        drawConstructionText(
          ctx,
          api,
          hash.slice(0, 32),
          220,
          840,
          30,
          themeColors.green,
          'left',
          true,
        );
        drawConstructionText(
          ctx,
          api,
          hash.slice(32),
          220,
          895,
          30,
          themeColors.green,
          'left',
          true,
        );
        drawConstructionText(
          ctx,
          api,
          '64 hex characters',
          1510,
          850,
          31,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionNote(
        ctx,
        api,
        'A prefix is a display label; full strings and digests remain the comparison inputs.',
      );
    }
  });
}
export default {
  id: 'unicode-recipe',
  draw: drawUnicodeRecipe,
  cues: [
    'unicode-recipe-b1',
    'unicode-recipe-voice-1',
    'unicode-compat',
    'unicode-case',
    'unicode-recipe-b2',
    'unicode-recipe-voice-2',
    'unicode-collision',
    'unicode-recipe-b3',
    'unicode-recipe-voice-3',
    'unicode-hash',
  ],
};
