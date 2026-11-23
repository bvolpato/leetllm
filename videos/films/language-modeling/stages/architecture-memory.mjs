import { languageStep } from '../construction.mjs';
import { architectureMemoryState } from '../model.mjs';
import {
  drawExtendedBar,
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  formatLanguage,
} from '../defaults.mjs';
export function drawArchitectureMemory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('architecture-memory', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('architecture-memory-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? '32 query heads share eight stored K/V pairs'
        : currentBeat === 1
          ? 'Logical positions map to fixed physical pages'
          : 'Raw cache for four requests of the same length',
    );
    if (currentBeat === 0) {
      const grouping = S(0, 0);
      for (let q = 0; q < 32; q++) {
        const x = 170 + (q % 8) * 205,
          y = 340 + Math.floor(q / 8) * 105;
        drawExtendedCell(ctx, api, 'Q' + q, x, y, 150, 65, themeColors.blue, 25);
        const destX = 245 + (q % 8) * 205;
        if (grouping > 0) api.line(ctx, x + 75, y + 70, destX, 795, themeColors.muted, 1);
      }
      for (let h = 0; h < 8; h++)
        drawExtendedCell(
          ctx,
          api,
          'K' + h + ' / V' + h,
          170 + h * 205,
          815,
          150,
          70,
          themeColors.cyan,
          25,
        );
      if (E(0, 1))
        drawExtendedText(
          ctx,
          api,
          '32 → 8 stored heads · raw payload ÷4',
          960,
          960,
          34,
          themeColors.green,
          'center',
        );
    } else if (currentBeat === 1) {
      const allocated = E(1, 3),
        blocks = [
          {
            logical: 'R1 block 0',
            used: 3,
            physical: 1,
          },
          {
            logical: 'R2 block 0',
            used: 4,
            physical: 7,
          },
          {
            logical: 'R2 block 1',
            used: 3,
            physical: 3,
          },
        ],
        colors = [themeColors.blue, themeColors.green, themeColors.yellow];
      blocks.forEach((block, i) => {
        const y = 380 + i * 175;
        drawExtendedText(ctx, api, block.logical, 160, y + 40, 28, colors[i]);
        for (let p = 0; p < 4; p++)
          drawExtendedCell(
            ctx,
            api,
            p < block.used ? 'pos ' + (i === 2 ? 4 + p : p) : 'unused',
            430 + p * 170,
            y,
            150,
            65,
            p < block.used ? colors[i] : themeColors.muted,
            25,
          );
        if (S(1, 0) > 0) {
          api.arrow(ctx, 1130, y + 32, 1320, y + 32, colors[i], 4);
          drawExtendedCell(ctx, api, 'physical ' + block.physical, 1350, y, 420, 65, colors[i], 29);
        }
      });
      if (allocated)
        drawExtendedText(
          ctx,
          api,
          '3 positions → 4 slots · 7 positions → 8 slots · 2 tail slots unused',
          960,
          955,
          31,
          themeColors.cyan,
          'center',
        );
    } else {
      const { heads, gib: size } = architectureMemoryState(S(2, 0));
      drawExtendedText(
        ctx,
        api,
        heads + ' stored K/V heads',
        960,
        365,
        33,
        themeColors.cyan,
        'center',
      );
      drawExtendedBar(ctx, api, size / 16, 260, 510, 1400, 180, themeColors.green);
      drawExtendedText(
        ctx,
        api,
        formatLanguage(ctx, api, size, 2) + ' GiB raw KV',
        960,
        775,
        39,
        themeColors.green,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'weights + runtime + latency target',
        960,
        920,
        30,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1 && S(1, 4) > 0) {
      const caption =
        S(1, 5) > 0
          ? 'These two requests use 10 of 12 allocated slots'
          : 'Compared systems in the paper     20.4% to 38.2% of allocated KV memory held useful token states';
      drawExtendedFoot(ctx, api, caption);
    }
  });
}
export default {
  id: 'architecture-memory',
  draw: drawArchitectureMemory,
  cues: [
    'architecture-memory-b1',
    'architecture-memory-voice-1',
    'architecture-memory-step-0-1',
    'architecture-memory-step-0-2',
    'architecture-memory-step-0-3',
    'architecture-memory-b2',
    'architecture-memory-voice-2',
    'architecture-memory-step-1-1',
    'architecture-memory-step-1-2',
    'architecture-memory-step-1-3',
    'architecture-memory-step-1-4',
    'architecture-memory-step-1-5',
    'architecture-memory-b3',
    'architecture-memory-voice-3',
    'architecture-memory-step-2-1',
    'architecture-memory-step-2-2',
    'architecture-memory-step-2-3',
  ],
};
