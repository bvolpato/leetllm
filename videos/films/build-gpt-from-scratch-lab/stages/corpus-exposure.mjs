import { corpusCounts } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import {
  drawBars,
  drawChapterCard,
  drawChapterEquation,
  drawChapterText,
  drawFooter,
  drawTable,
  formatCount,
} from '../defaults.mjs';
export function drawCorpusExposure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('corpus-exposure-mechanism', () => {
    const s = corpusCounts();
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'One bundled file · GPT-2 BPE · supplied order',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawChapterCard(
        ctx,
        api,
        formatCount(ctx, api, s.bytes) + ' UTF-8 bytes',
        160,
        380,
        590,
        themeColors.blue,
        120,
        37,
      );
      api.arrow(ctx, 790, 440, 1130, 440, themeColors.cyan, 5);
      if (cueProgress('corpus-tokenize', 0) > 0)
        drawChapterCard(
          ctx,
          api,
          formatCount(ctx, api, s.tokens) + ' token IDs',
          1170,
          380,
          590,
          themeColors.cyan,
          120,
          37,
        );
      const split = cueProgress('corpus-split', 0);
      api.rect(ctx, 170, 645, 1580, 130, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 170, 645, 1580 * (split ? 0.9 : 1), 130, themeColors.blue, undefined, 0);
      if (split) {
        api.rect(ctx, 1592, 645, 158, 130, themeColors.yellow, undefined, 0);
        drawChapterText(
          ctx,
          api,
          formatCount(ctx, api, s.train) + ' training IDs',
          750,
          720,
          34,
          themeColors.bg,
          'center',
        );
        drawChapterText(ctx, api, '125,526', 1671, 705, 25, themeColors.bg, 'center');
        drawChapterText(ctx, api, 'validation', 1671, 748, 22, themeColors.bg, 'center');
      } else
        drawChapterText(ctx, api, '1,255,253 ordered IDs', 960, 725, 36, themeColors.ink, 'center');
      drawChapterText(
        ctx,
        api,
        'Contiguous 90% / 10% split · repeated phrases may cross it',
        960,
        890,
        31,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const exposure = Math.round(321 * cueProgress('score-exposure', 1));
      drawTable(
        ctx,
        api,
        [
          ['Batch', 'Context', 'Targets / update'],
          ['12', '48', String(s.targetsPerUpdate)],
        ],
        190,
        340,
        1540,
        190,
        34,
      );
      drawChapterEquation(
        ctx,
        api,
        String.raw`${exposure}\times576=${formatCount(ctx, api, exposure * 576)}`,
        960,
        660,
        60,
      );
      drawChapterText(
        ctx,
        api,
        'Target positions sampled · not unique-token coverage',
        960,
        760,
        32,
        themeColors.yellow,
        'center',
      );
      if (E('sampled-fraction', 1))
        drawChapterText(
          ctx,
          api,
          (100 * s.fraction).toFixed(1) + '% of training-stream length',
          960,
          840,
          39,
          themeColors.cyan,
          'center',
        );
      if (cueProgress('validation-exposure', 1) > 0)
        drawChapterCard(
          ctx,
          api,
          'Validation: 8 × 576 = 4,608 positions · overlap is allowed',
          235,
          900,
          1450,
          themeColors.blue,
          75,
          28,
        );
    } else {
      const constant = cueProgress('constant-reference', 2) > 0;
      drawChapterText(
        ctx,
        api,
        constant
          ? 'Separate four-ID toy · target is always ID 0'
          : 'Analytic uniform reference · 17,485 active IDs',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      if (!constant) {
        api.rect(ctx, 260, 460, 1400, 155, themeColors.blue, undefined, 0);
        drawChapterText(
          ctx,
          api,
          'Every row receives probability 1 / 17,485',
          960,
          555,
          35,
          themeColors.bg,
          'center',
        );
        drawChapterEquation(ctx, api, String.raw`L=-\ln(1/17485)=\ln17485`, 960, 760, 51);
        if (E('uniform-reference', 2))
          drawChapterText(
            ctx,
            api,
            s.uniformLoss.toFixed(3) + ' nats / token',
            960,
            885,
            47,
            themeColors.yellow,
            'center',
          );
      } else {
        drawBars(
          ctx,
          api,
          [0.9, 0.1 / 3, 0.1 / 3, 0.1 / 3],
          ['0 · target', '1', '2', '3'],
          220,
          385,
          1480,
          370,
          0,
        );
        if (E('constant-reference', 2))
          drawChapterEquation(
            ctx,
            api,
            String.raw`L=-\ln0.9=${s.constantLoss.toFixed(3)}`,
            960,
            910,
            57,
          );
      }
    }
    drawFooter(
      ctx,
      api,
      'Bounded CPU training from random weights · no claim of a complete epoch or independent holdout',
    );
  });
}
export default {
  id: 'corpus-exposure',
  draw: drawCorpusExposure,
  cues: [
    'corpus-exposure-1',
    'corpus-tokenize',
    'corpus-split',
    'corpus-exposure-2',
    'score-exposure',
    'sampled-fraction',
    'validation-exposure',
    'corpus-exposure-3',
    'uniform-reference',
    'constant-reference',
  ],
};
