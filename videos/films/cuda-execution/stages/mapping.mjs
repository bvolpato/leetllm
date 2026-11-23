import { mix } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalFooter,
  drawOriginalMark,
  drawOriginalText,
} from '../defaults.mjs';
export function drawMapping(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = sampleModel('mapping', state);
  {
    drawOriginalText(
      ctx,
      api,
      currentBeat === 2 ? 'Launch: 3 blocks × 4 threads' : 'Teaching launch: 2 blocks × 4 threads',
      180,
      285,
      34,
      themeColors.cyan,
    );
    drawOriginalMark(ctx, api, 'owned-tokens', () => {
      const blocks = currentBeat === 2 ? 3 : 2;
      for (const block of modelState.map) {
        const bx = blocks === 2 ? 240 + block[0].block * 850 : 120 + block[0].block * 580;
        const bw = blocks === 2 ? 590 : 520,
          cell = bw / 4;
        const color = [themeColors.cyan, themeColors.pink, themeColors.blue][block[0].block];
        drawOriginalText(ctx, api, 'Block ' + block[0].block, bx, 385, 34, color);
        for (const thread of block) {
          const baseX = 180 + (thread.index + 0.5) * 195 - (cell - 8) / 2;
          const p =
            currentBeat === 2 ? (thread.block === 2 ? modelState.extend : 1) : modelState.split;
          const x =
            currentBeat === 2
              ? bx + thread.thread * cell
              : mix(baseX, bx + thread.thread * cell, p);
          const y =
            currentBeat === 2 ? (thread.block === 2 ? mix(660, 470, p) : 470) : mix(470, 560, p);
          const drawToken = () => {
            drawOriginalCard(
              ctx,
              api,
              thread.valid ? 'T' + thread.index : 'i=' + thread.index,
              x,
              y,
              cell - 8,
              100,
              thread.index === 6 && modelState.answer === 1
                ? themeColors.yellow
                : thread.valid
                  ? color
                  : themeColors.muted,
              35,
            );
            drawOriginalText(
              ctx,
              api,
              'local ' + (thread.index === 6 && modelState.answer < 1 ? '?' : thread.thread),
              x + (cell - 8) / 2,
              y + 143,
              25,
              themeColors.muted,
              'center',
            );
            if (!thread.valid && modelState.guarded)
              drawOriginalText(
                ctx,
                api,
                'guarded',
                x + (cell - 8) / 2,
                y + 194,
                24,
                themeColors.pink,
                'center',
              );
          };
          if (!thread.valid) drawOriginalMark(ctx, api, 'guarded-workers', drawToken);
          else drawToken();
        }
      }
    });
    drawOriginalMark(ctx, api, 'owner-calculation', () => {
      if (currentBeat === 2)
        drawOriginalEquation(ctx, api, '0\\leq i<10', 960, 855, 58, themeColors.green);
      else if (currentBeat === 0 || modelState.base < 1)
        drawOriginalEquation(
          ctx,
          api,
          'i=\\text{block}\\times4+\\text{local}',
          960,
          855,
          48,
          themeColors.muted,
        );
      else
        drawOriginalEquation(
          ctx,
          api,
          modelState.answer === 1 ? 'i=1\\times4+2=6' : 'i=1\\times4+?=?',
          960,
          855,
          58,
        );
    });
    drawOriginalFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Guard global array accesses with i < n.'
        : 'Grid → blocks → local threads → unique global positions',
    );
  }
}
export default {
  id: 'mapping',
  draw: drawMapping,
  cues: [
    'split-blocks',
    'predict-owner',
    'owner-base',
    'owner-answer',
    'extend-launch',
    'guard-tail',
  ],
};
