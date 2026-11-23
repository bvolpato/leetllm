import { spokenProgress } from '../construction.mjs';
import {
  drawClipLine,
  drawClipRectangle,
  drawClipText,
  rackPhoto,
  withClipFocus,
} from '../defaults.mjs';
export function drawVisualFeatures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    const q = clauseProgress(currentBeat === 0 ? 'patch-grid' : 'spatial-context', currentBeat);
    drawClipText(
      ctx,
      api,
      currentBeat === 0
        ? '224/16 =14 patches along each side'
        : 'Same spatial evidence · different mixing bias',
      960,
      290,
      38,
    );
    rackPhoto(ctx, api, 260, 380, 500, 500, {
      grid: 14,
    });
    if (currentBeat === 0) {
      const seen = Math.floor(196 * q);
      for (let i = 0; i < seen; i++)
        drawClipRectangle(
          ctx,
          api,
          1080 + (i % 14) * 42,
          410 + Math.floor(i / 14) * 28,
          34,
          20,
          themeColors.cyan,
        );
      withClipFocus(ctx, api, 'spatial-features', () =>
        drawClipText(
          ctx,
          api,
          seen === 196
            ? '196 contextual patch features + optional CLS'
            : 'patches ' + seen + '/196',
          1370,
          900,
          31,
          themeColors.cyan,
        ),
      );
    } else {
      const cx = 560,
        cy = 610;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        drawClipLine(
          ctx,
          api,
          cx,
          cy,
          cx + 260 * Math.cos(a) * q,
          cy + 180 * Math.sin(a) * q,
          themeColors.cyan,
          2,
        );
      }
      api.circle(ctx, 1330, 590, 50 + 130 * q, 'transparent', themeColors.blue, 4);
      withClipFocus(ctx, api, 'spatial-features', () => {
        drawClipText(
          ctx,
          api,
          'ViT: attention reaches across patches',
          550,
          950,
          29,
          themeColors.cyan,
        );
        drawClipText(ctx, api, 'CNN: local receptive field grows', 1370, 950, 29, themeColors.blue);
        drawClipText(
          ctx,
          api,
          'Small-tag OCR test: compare the copied characters with the printed tag',
          960,
          1030,
          28,
          themeColors.muted,
        );
      });
    }
  }
}
export default {
  id: 'visual-features',
  draw: drawVisualFeatures,
  cues: ['patch-grid', 'spatial-context'],
};
