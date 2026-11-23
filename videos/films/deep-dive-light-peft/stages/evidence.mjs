import { TABLE1 } from '../fixtures.mjs';
import {
  chapterFooter,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawEvidence(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (beat === 0) {
      chapterSubtitle(ctx, api, themeColors, 'Table 1 · training tradeoff · estimation included');
      focusScope(ctx, api, 'evidence-training-results', () => {
        TABLE1.forEach((r, i) => {
          chapterText(
            ctx,
            api,
            themeColors,
            r.retained + '% retained',
            230,
            410 + i * 160,
            31,
            i ? themeColors.cyan : themeColors.blue,
          );
          api.rect(
            ctx,
            650,
            360 + i * 160,
            (r.average - 90) * 220,
            75,
            i ? themeColors.cyan : themeColors.blue,
            undefined,
            0,
          );
          chapterText(
            ctx,
            api,
            themeColors,
            r.average.toFixed(1) + ' avg',
            1450,
            410 + i * 160,
            31,
            themeColors.ink,
          );
          chapterText(
            ctx,
            api,
            themeColors,
            r.speed.toFixed(1) + '×',
            1680,
            410 + i * 160,
            31,
            themeColors.yellow,
          );
        });
      });
      focusScope(ctx, api, 'evidence-protocols', () =>
        chapterFooter(
          ctx,
          api,
          themeColors,
          'TITAN RTX 24 GB · batch 32 · length 128 · four-task accuracy average',
        ),
      );
    } else if (beat === 1) {
      focusScope(ctx, api, 'evidence-memory-protocol', () =>
        chapterSubtitle(ctx, api, themeColors, 'Figure 4 · RTX 3090 · 10 forward/backward batches'),
      );
      focusScope(ctx, api, 'evidence-memory-results', () => {
        [
          ['weight', 68],
          ['activation', 60],
          ['peak', 61],
        ].forEach(([name, retained], i) => {
          chapterText(ctx, api, themeColors, name, 220, 430 + i * 160, 32, themeColors.blue);
          api.rect(ctx, 600, 375 + i * 160, 1000, 85, themeColors.panel, themeColors.muted, 0);
          api.rect(ctx, 600, 375 + i * 160, retained * 10, 85, themeColors.cyan, undefined, 0);
          chapterText(
            ctx,
            api,
            themeColors,
            100 - retained + '% less',
            1820,
            430 + i * 160,
            25,
            themeColors.cyan,
            'right',
          );
        });
        chapterText(
          ctx,
          api,
          themeColors,
          '2.2× forward/backward speed · separate protocol',
          960,
          920,
          34,
          themeColors.yellow,
          'center',
        );
      });
      focusScope(ctx, api, 'evidence-protocols', () =>
        chapterFooter(
          ctx,
          api,
          themeColors,
          'RoBERTa-Large · retained foundation 67% · .3M trainable · batch 32 / length 128',
        ),
      );
    } else {
      focusScope(ctx, api, 'evidence-inference-protocol', () =>
        chapterSubtitle(ctx, api, themeColors, 'Table 5 · OPT-6.7B · batch 96 · max length 100'),
      );
      focusScope(ctx, api, 'evidence-inference-results', () => {
        chapterText(
          ctx,
          api,
          themeColors,
          '52% foundation retained',
          960,
          420,
          36,
          themeColors.blue,
          'center',
        );
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['192', '96', '48'],
          320,
          550,
          'adapter modules',
          undefined,
          themeColors.cyan,
          380,
          100,
        );
        ['1.2×', '1.4×', '1.6×'].forEach((r, i) =>
          chapterText(
            ctx,
            api,
            themeColors,
            r,
            510 + i * 392,
            770,
            38,
            themeColors.green,
            'center',
          ),
        );
      });
      focusScope(ctx, api, 'evidence-protocols', () =>
        chapterFooter(
          ctx,
          api,
          themeColors,
          'Fastest row also removes ¾ of modules · 6.4G load versus12.5G baseline',
        ),
      );
    }
  }
}
export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: [
    'evidence-beat-1-focus-1',
    'evidence-beat-1-focus-2',
    'evidence-beat-2-focus-1',
    'evidence-beat-2-focus-2',
    'evidence-beat-3-focus-1',
    'evidence-beat-3-focus-2',
  ],
};
