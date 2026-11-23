import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  drawExtendedTokenRow,
} from '../defaults.mjs';
export function drawObjectiveBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('objective-boundary', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('objective-boundary-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'The objective determines permitted evidence'
        : 'Original BERT recipe · a quota illustration',
    );
    if (currentBeat === 0) {
      drawExtendedText(
        ctx,
        api,
        'Causal input · earlier tokens only',
        150,
        350,
        30,
        themeColors.blue,
      );
      drawExtendedCell(ctx, api, 'The', 150, 405, 320, 80, themeColors.blue, 34);
      drawExtendedCell(ctx, api, 'target: cat', 1390, 485, 360, 95, themeColors.yellow, 34);
      api.path(
        ctx,
        [
          {
            x: 490,
            y: 445,
          },
          {
            x: 950,
            y: 445,
          },
          {
            x: 950,
            y: 530,
          },
          {
            x: 1365,
            y: 530,
          },
        ],
        {
          color: themeColors.blue,
          width: 4,
        },
      );
      api.arrow(ctx, 1325, 530, 1365, 530, themeColors.blue, 4);
      if (S(0, 2) > 0) {
        drawExtendedText(
          ctx,
          api,
          'Masked input · the selected original is covered',
          150,
          610,
          30,
          themeColors.green,
        );
        drawExtendedTokenRow(
          ctx,
          api,
          ['The', '[MASK]', 'sat'],
          150,
          665,
          280,
          40,
          themeColors.green,
        );
        api.path(
          ctx,
          [
            {
              x: 1090,
              y: 705,
            },
            {
              x: 1250,
              y: 705,
            },
            {
              x: 1250,
              y: 565,
            },
            {
              x: 1365,
              y: 565,
            },
          ],
          {
            color: themeColors.green,
            width: 4,
          },
        );
        api.arrow(ctx, 1325, 565, 1365, 565, themeColors.green, 4);
        drawExtendedText(
          ctx,
          api,
          'sat supplies permitted right context',
          960,
          845,
          30,
          themeColors.green,
          'center',
        );
      }
      if (S(0, 3) > 0)
        drawExtendedText(
          ctx,
          api,
          'Causal input excludes both the current target and sat',
          960,
          925,
          29,
          themeColors.pink,
          'center',
        );
      drawExtendedFoot(
        ctx,
        api,
        'The original cat is a separate target; it is absent from both conditioning inputs',
      );
    } else {
      const selected = E(1, 0) ? 150 : Math.floor(150 * S(1, 0)),
        construct = S(1, 2);
      for (let i = 0; i < 1000; i++) {
        const x = 130 + (i % 50) * 22,
          y = 355 + Math.floor(i / 50) * 22;
        const used = i < selected,
          typed = i < 120 ? themeColors.blue : i < 135 ? themeColors.yellow : themeColors.green;
        api.rect(ctx, x, y, 16, 16, used ? (construct > 0 ? typed : themeColors.cyan) : '#303746');
      }
      drawExtendedText(ctx, api, 'quota: 150 of 1,000', 1395, 390, 30, themeColors.ink, 'center');
      drawExtendedText(
        ctx,
        api,
        'selected so far: ' + selected,
        1395,
        440,
        27,
        themeColors.cyan,
        'center',
      );
      if (E(1, 2)) {
        for (const [i, v] of ['120 mask', '15 random', '15 unchanged'].entries())
          drawExtendedCell(
            ctx,
            api,
            v,
            1190,
            505 + i * 125,
            520,
            80,
            [themeColors.blue, themeColors.yellow, themeColors.green][i],
            31,
          );
      }
      if (E(1, 1))
        drawExtendedText(
          ctx,
          api,
          'Every selected target is the original token',
          960,
          925,
          31,
          themeColors.cyan,
          'center',
        );
      drawExtendedFoot(
        ctx,
        api,
        'Counts illustrate fixed quotas; actual random selection can vary',
      );
    }
  });
}
export default {
  id: 'objective-boundary',
  draw: drawObjectiveBoundary,
  cues: [
    'objective-boundary-b1',
    'objective-boundary-voice-1',
    'objective-boundary-step-0-1',
    'objective-boundary-step-0-2',
    'objective-boundary-step-0-3',
    'objective-boundary-b2',
    'objective-boundary-voice-2',
    'objective-boundary-step-1-1',
    'objective-boundary-step-1-2',
    'objective-boundary-step-1-3',
    'objective-boundary-step-1-4',
  ],
};
