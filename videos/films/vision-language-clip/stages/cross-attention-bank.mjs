import { spokenProgress } from '../construction.mjs';
import { drawClipLine, drawClipRectangle, drawClipText, withClipFocus } from '../defaults.mjs';
export function drawCrossAttentionBank(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    drawClipText(ctx, api, 'A separate 64-token bank per visual item', 960, 285, 38);
    const q = clauseProgress('bank-build', 0),
      gate = currentBeat === 1 ? clauseProgress('bank-gate', 1) : 0;
    for (let image = 0; image < 2; image++) {
      const x = 250 + image * 650;
      drawClipText(
        ctx,
        api,
        'image ' + (image + 1),
        x + 180,
        380,
        31,
        image ? themeColors.cyan : themeColors.muted,
      );
      for (let i = 0; i < 64; i++) {
        const active = i < Math.floor(64 * q),
          color =
            currentBeat === 1 && image === 0
              ? themeColors.muted
              : image
                ? themeColors.cyan
                : themeColors.blue;
        drawClipRectangle(
          ctx,
          api,
          x + (i % 8) * 42,
          430 + Math.floor(i / 8) * 38,
          28,
          23,
          active ? color : themeColors.panel,
        );
      }
    }
    const languageX = 1540;
    for (let i = 0; i < 5; i++)
      drawClipRectangle(ctx, api, languageX, 480 + i * 70, 90, 40, themeColors.yellow);
    if (q > 0)
      for (let i = 0; i < 4; i++)
        drawClipLine(
          ctx,
          api,
          1200,
          500 + i * 70,
          languageX,
          500 + i * 70,
          currentBeat === 1 ? themeColors.cyan : themeColors.muted,
          2 + gate * 2,
        );
    withClipFocus(ctx, api, 'bank-contract', () => {
      drawClipText(
        ctx,
        api,
        currentBeat === 1
          ? 'Direct mask: most recent preceding image; older evidence can travel through text'
          : 'Language tokens revisit banks through gated cross-attention',
        960,
        935,
        30,
        themeColors.yellow,
      );
      drawClipText(
        ctx,
        api,
        currentBeat === 1
          ? 'tanh gate: zero initialization preserves frozen LM behavior'
          : 'Multiple images still own multiple banks; this is not a projected AR prefix',
        960,
        1030,
        28,
        themeColors.muted,
      );
    });
  }
}
export default {
  id: 'cross-attention-bank',
  draw: drawCrossAttentionBank,
  cues: ['bank-build', 'bank-gate'],
};
