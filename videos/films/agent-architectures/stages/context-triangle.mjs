import { contextLedger } from '../arithmetic.mjs';
import {
  drawCenteredText,
  drawEquation,
  drawFocusTarget,
  drawFooter,
  drawLeftText,
  drawLine,
} from '../defaults.mjs';
export function drawContextTriangle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    operationProgress = cueProgress('aa-context-triangle-' + currentBeat),
    count = (u, n) => Math.min(n, Math.floor(u * n + 1e-8));
  const paintMechanism = () => {
    const caching = false,
      ledger = contextLedger(),
      cap = contextLedger(2000, 1500, 10, 2),
      n = currentBeat === 0 ? 1 + count(operationProgress, 9) : 10,
      x0 = 210,
      gap = 150,
      baseY = 820,
      scale = 0.027;
    drawCenteredText(ctx, api, 'P = 2,000 · δ = 1,500 · K = 10', 960, 270, 33, themeColors.yellow);
    for (let i = 0; i < 10; i++) {
      const x = x0 + i * gap;
      if (i < n) {
        const cells = i;
        const reused = false;
        api.rect(ctx, x, baseY - 2000 * scale, 95, 2000 * scale, themeColors.blue);
        for (let j = 0; j < cells; j++) {
          const color = j === 0 ? themeColors.yellow : themeColors.cyan;
          const cy = baseY - (2000 + (j + 1) * 1500) * scale;
          api.rect(ctx, x, cy, 95, 1500 * scale - 2, color);
          drawCenteredText(ctx, api, j + 1, x + 47, cy + 28, 24, themeColors.bg);
        }
        drawCenteredText(ctx, api, i + 1, x + 47, baseY + 45, 26, themeColors.muted);
      } else {
        drawLine(ctx, api, x, baseY, x + 95, baseY, themeColors.muted, 2);
      }
    }
    drawLeftText(ctx, api, 'Call', 150, baseY + 45, 26, themeColors.muted);
    {
      if (currentBeat === 0 && resultComplete('context-final'))
        drawCenteredText(
          ctx,
          api,
          'Last request = 15,500 input tokens',
          960,
          935,
          34,
          themeColors.green,
        );
      if ((currentBeat >= 1 && resultComplete('context-total')) || currentBeat > 1)
        drawEquation(ctx, api, '10(2000)+1500\\frac{10(9)}{2}=87500', 960, 345, 43);
      if (currentBeat === 1 && resultComplete('context-nine'))
        drawCenteredText(
          ctx,
          api,
          'First observation: calls 2–10 = 9 copies',
          960,
          935,
          32,
          themeColors.yellow,
        );
      if (currentBeat === 2)
        drawCenteredText(
          ctx,
          api,
          'A new synthesis request would add another column',
          960,
          935,
          32,
          themeColors.yellow,
        );
    }
    drawFooter(ctx, api, 'Each numbered block is one cycle of actions and observations.');
  };
  drawFocusTarget(ctx, api, 'aa-context-triangle-mechanism', paintMechanism);
}
export default {
  id: 'context-triangle',
  draw: drawContextTriangle,
  cues: [
    'aa-context-triangle-0',
    'context-final',
    'aa-context-triangle-1',
    'context-total',
    'context-nine',
    'aa-context-triangle-2',
  ],
};
