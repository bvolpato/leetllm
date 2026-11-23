import { detailProgress } from '../construction.mjs';
import {
  drawDetailArrow,
  drawDetailLine,
  drawDetailRectangle,
  drawDetailText,
  drawFooter,
} from '../defaults.mjs';
export function drawArtifactLineage(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'artifact-lineage', beat);
  const body = () => {
    const top = 380;
    drawDetailText(
      ctx,
      api,
      'Retain the high-precision source and identify every saved candidate',
      960,
      285,
      32,
      themeColors.ink,
      'center',
    );
    drawDetailRectangle(ctx, api, 230, top, 360, 130, themeColors.blue);
    drawDetailText(ctx, api, 'source revision', 410, top + 80, 35, themeColors.bg, 'center');
    const candidates = [
      {
        y: top - 10,
        label: 'high-precision GGUF',
        color: themeColors.cyan,
      },
      {
        y: top + 300,
        label: 'selected quantized GGUF',
        color: themeColors.pink,
      },
    ];
    candidates.forEach((o, i) => {
      const x = 950;
      drawDetailRectangle(ctx, api, x, o.y, 620, 130, o.color);
      drawDetailText(ctx, api, o.label, x + 310, o.y + 80, 34, themeColors.bg, 'center');
      drawDetailText(
        ctx,
        api,
        i ? 'candidate digest B' : 'source digest A',
        x + 310,
        o.y + 185,
        29,
        o.color,
        'center',
      );
    });
    drawDetailArrow(ctx, api, 620, top + 65, 900, top + 65, themeColors.cyan);
    drawDetailLine(ctx, api, 1570, top + 65, 1730, top + 65, themeColors.pink, 4);
    drawDetailLine(ctx, api, 1730, top + 65, 1730, top + 365, themeColors.pink, 4);
    drawDetailArrow(ctx, api, 1730, top + 365, 1570, top + 365, themeColors.pink);
    if (beat === 1) {
      drawDetailText(
        ctx,
        api,
        'reload saved bytes → tokenizer + template + backend',
        960,
        950,
        32,
        themeColors.green,
        'center',
      );
    } else if (beat === 2) {
      drawDetailText(
        ctx,
        api,
        'image / audio encoder + projector: separate artifacts and budget',
        960,
        950,
        31,
        themeColors.yellow,
        'center',
      );
    } else
      drawDetailText(
        ctx,
        api,
        'Every new preset starts from retained high precision',
        960,
        950,
        32,
        themeColors.ink,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Illustrated workflow only · no real checkpoint conversion, export or device execution claimed',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'artifact-lineage'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'artifact-lineage',
  draw: drawArtifactLineage,
  cues: ['artifact-lineage-build-0', 'artifact-lineage-build-1', 'artifact-lineage-build-2'],
};
