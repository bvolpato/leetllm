import { languageStep } from '../construction.mjs';
import { generationWork } from '../model.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
} from '../defaults.mjs';
export function drawWorkAndBandwidth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('work-and-bandwidth', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('work-and-bandwidth-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Count positions and score cells before claiming speed'
        : currentBeat === 1
          ? 'Growing history still requires growing attention'
          : 'Reusing a weight changes operations per loaded byte',
    );
    if (currentBeat === 0) {
      const matrix = (n, x, y, size, visible, color) => {
        for (let r = 0; r < n; r++)
          for (let col = 0; col < n; col++)
            api.rect(
              ctx,
              x + col * size,
              y + r * size,
              size - 4,
              size - 4,
              visible ? color : themeColors.panel,
              themeColors.muted,
              1,
            );
      };
      drawExtendedText(
        ctx,
        api,
        'uncached · full prefix every call',
        960,
        330,
        31,
        themeColors.blue,
        'center',
      );
      [3, 4, 5].forEach((n, i) => {
        matrix(n, 260 + i * 550, 380, 40, S(0, 1) > i / 3, themeColors.blue);
        drawExtendedText(
          ctx,
          api,
          'length ' + n,
          340 + i * 550,
          625,
          27,
          themeColors.blue,
          'center',
        );
      });
      if (E(0, 2))
        drawExtendedText(
          ctx,
          api,
          'positions 3 + 4 + 5 = 12',
          580,
          705,
          31,
          themeColors.blue,
          'center',
        );
      if (E(0, 3))
        drawExtendedText(
          ctx,
          api,
          'dense scores 9 + 16 + 25 = 50',
          1390,
          705,
          31,
          themeColors.blue,
          'center',
        );
      if (S(0, 4) > 0) {
        matrix(3, 260, 770, 35, true, themeColors.green);
        for (const [i, n] of [4, 5].entries()) {
          for (let j = 0; j < n; j++)
            api.rect(
              ctx,
              810 + i * 550 + j * 35,
              805,
              31,
              31,
              themeColors.green,
              themeColors.muted,
              1,
            );
          drawExtendedText(
            ctx,
            api,
            'one query × ' + n + ' keys',
            890 + i * 550,
            880,
            25,
            themeColors.green,
            'center',
          );
        }
      }
      if (E(0, 4))
        drawExtendedText(
          ctx,
          api,
          'cached positions 3 + 1 + 1 = 5',
          580,
          970,
          29,
          themeColors.green,
          'center',
        );
      if (E(0, 5))
        drawExtendedText(
          ctx,
          api,
          'dense scores 9 + 4 + 5 = 18',
          1390,
          970,
          29,
          themeColors.green,
          'center',
        );
    } else if (currentBeat === 1) {
      const plots = [
        {
          x: 160,
          y: 390,
          width: 700,
          height: 440,
          field: 'Positions',
          max: 60,
          uncached: 'uncachedPositions',
          cached: 'cachedPositions',
        },
        {
          x: 1060,
          y: 390,
          width: 700,
          height: 440,
          field: 'Dense score cells',
          max: 400,
          uncached: 'uncachedCells',
          cached: 'cachedCells',
        },
      ];
      for (const item of plots) {
        drawExtendedText(ctx, api, item.field, item.x + 350, 335, 30, themeColors.ink, 'center');
        const plot = api.teaching.axes({
          ...item,
          xDomain: [1, 8],
          yDomain: [0, item.max],
          xTicks: [1, 4, 8],
          yTicks: [0, item.max / 2, item.max],
          fontSize: 22,
          color: themeColors.muted,
          xLabel: 'generated tokens',
        });
        for (const [field, color] of [
          [item.uncached, themeColors.blue],
          [item.cached, themeColors.green],
        ]) {
          const count = 1 + Math.floor((field === item.uncached ? S(1, 0) : S(1, 2)) * 7);
          api.teaching.curve({
            plot,
            points: Array.from(
              {
                length: count,
              },
              (_, i) => ({
                x: i + 1,
                y: generationWork(3, i + 1)[field],
              }),
            ),
            color,
            width: 5,
          });
        }
      }
      drawExtendedText(ctx, api, 'uncached', 680, 955, 30, themeColors.blue, 'center');
      drawExtendedText(ctx, api, 'cached', 1260, 955, 30, themeColors.green, 'center');
    } else {
      const prefill = S(2, 0),
        decode = S(2, 1);
      drawExtendedText(
        ctx,
        api,
        'one loaded dense weight: 2 bytes',
        960,
        340,
        31,
        themeColors.yellow,
        'center',
      );
      drawExtendedCell(ctx, api, 'w', 850, 425, 220, 95, themeColors.yellow, 44);
      for (let i = 0; i < 4; i++) {
        const x = 250 + i * 420;
        drawExtendedCell(ctx, api, 'prompt position ' + i, x, 680, 340, 75, themeColors.blue, 27);
        if (prefill > i / 4) api.arrow(ctx, 960, 535, x + 170, 660, themeColors.blue, 3);
      }
      if (decode > 0) {
        drawExtendedCell(ctx, api, 'one decode position', 660, 850, 600, 75, themeColors.green, 30);
        api.trace(
          ctx,
          [
            {
              x: 960,
              y: 535,
            },
            {
              x: 1050,
              y: 610,
            },
            {
              x: 1050,
              y: 795,
            },
            {
              x: 960,
              y: 795,
            },
          ],
          decode,
          themeColors.green,
          5,
        );
        if (decode === 1) api.arrow(ctx, 960, 795, 960, 830, themeColors.green, 5);
      }
      if (E(2, 1))
        drawExtendedText(
          ctx,
          api,
          '2 operations / 2 weight bytes = 1 operation/byte',
          960,
          970,
          31,
          themeColors.yellow,
          'center',
        );
    }
    drawExtendedFoot(
      ctx,
      api,
      currentBeat === 0
        ? 'Deliberately dense accounting includes masked prefill cells'
        : 'Actual kernels, batch size, KV reads and hardware determine time and throughput',
    );
  });
}
export default {
  id: 'work-and-bandwidth',
  draw: drawWorkAndBandwidth,
  cues: [
    'work-and-bandwidth-b1',
    'work-and-bandwidth-voice-1',
    'work-and-bandwidth-step-0-1',
    'work-and-bandwidth-step-0-2',
    'work-and-bandwidth-step-0-3',
    'work-and-bandwidth-step-0-4',
    'work-and-bandwidth-step-0-5',
    'work-and-bandwidth-b2',
    'work-and-bandwidth-voice-2',
    'work-and-bandwidth-step-1-1',
    'work-and-bandwidth-step-1-2',
    'work-and-bandwidth-step-1-3',
    'work-and-bandwidth-step-1-4',
    'work-and-bandwidth-b3',
    'work-and-bandwidth-voice-3',
    'work-and-bandwidth-step-2-1',
    'work-and-bandwidth-step-2-2',
    'work-and-bandwidth-step-2-3',
    'work-and-bandwidth-step-2-4',
    'work-and-bandwidth-step-2-5',
  ],
};
