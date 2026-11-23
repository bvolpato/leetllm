import { clamp } from '../construction.mjs';
import { exchangeabilityState } from '../model.mjs';
import { caption, dot, text } from '../defaults.mjs';
export function drawExchangeability(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const paint = () => {
    const s = exchangeabilityState(currentBeat, progress, cues);
    text(ctx, api, 'future', 200, 320, 25, themeColors.yellow);
    text(
      ctx,
      api,
      'score identity in this separate rank-only fixture',
      950,
      270,
      29,
      themeColors.muted,
      'center',
    );
    for (let j = 0; j < 10; j++)
      text(ctx, api, j + 1, 460 + j * 87, 320, 25, themeColors.muted, 'center');
    for (let i = 0; i < 10; i++) {
      const row = s.cases[i],
        yy = 370 + i * 48;
      text(ctx, api, row.future, 225, yy + 8, 24, themeColors.yellow, 'center');
      for (let j = 1; j <= 10; j++) {
        const xx = 460 + (j - 1) * 87;
        if (!row.visible) {
          dot(ctx, api, xx, yy, themeColors.border, 4);
          continue;
        }
        const future = j === row.future,
          selected = j === row.threshold;
        api.circle(
          ctx,
          xx,
          yy,
          17,
          future ? themeColors.yellow : themeColors.panel,
          selected ? themeColors.cyan : themeColors.border,
          selected ? 3 : 1,
        );
        text(ctx, api, j, xx, yy + 7, 20, future ? themeColors.panel : themeColors.muted, 'center');
      }
      if (row.visible)
        text(
          ctx,
          api,
          `q ${row.threshold} · ${row.covered ? 'covered' : 'miss'}`,
          1515,
          yy + 8,
          24,
          row.covered ? themeColors.green : themeColors.pink,
          'center',
        );
    }
    caption(
      ctx,
      api,
      s.answerVisible
        ? '8 of 10 equally likely distinct future ranks are covered.'
        : currentBeat === 0
          ? 'Permuting one observed list does not establish exchangeability.'
          : 'Each row removes one future score, then recalibrates on the other nine.',
      s.answerVisible ? themeColors.green : themeColors.muted,
    );
  };
  if (api.focus) api.focus.target(`${'exchangeability'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'exchangeability',
  draw: drawExchangeability,
  cues: [
    'exchangeability-b1',
    'exchangeability-b2',
    'rank-enumerate',
    'cf-enumerate-eight',
    'exchangeability-b3',
    'rank-last-two',
    'rank-count-answer',
    'cf-future-nine',
    'cf-future-ten',
    'cf-enumerated-coverage',
  ],
};
