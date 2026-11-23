import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, caption, extensionText } from '../defaults.mjs';
export function drawFixtureGates(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-fixture-gates-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'fixture-gates'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-fixture-gates-mechanism', () => {
    const checks = [
      'Time order',
      'Calibration before holdout',
      'Routine MAE ≤ 3',
      'Calibration coverage',
      'Later coverage',
      'Interval version',
      'Deduplication version',
      'Alert evidence fields',
      'Owner string',
    ];
    const n = Math.floor(cueProgress('checks') * 9);
    if (currentBeat === 0)
      checks.forEach((v, i) => {
        const x = 180 + (i % 3) * 550,
          y = 360 + Math.floor(i / 3) * 125;
        box(
          ctx,
          api,
          `${i < n ? '✓' : '·'} ${v}`,
          x,
          y,
          520,
          i < n ? themeColors.green : themeColors.muted,
          26,
          96,
        );
      });
    if (currentBeat === 0) {
      caption(ctx, api, 'Example week   ·   Friday went to capacity operations for review.');
      return;
    }
    const empty = currentBeat === 1 && done('empty');
    const count = empty ? 0 : 1;
    extensionText(ctx, api, 'Alerts to inspect', 540, 340, 43, themeColors.ink);
    extensionText(ctx, api, 'Required fields present?', 1380, 340, 43, themeColors.ink);
    box(
      ctx,
      api,
      empty ? '[   ]' : 'Friday   ·   capacity-ops',
      220,
      405,
      640,
      themeColors.blue,
      46,
      115,
    );
    extensionText(ctx, api, 'Alert count   ' + count, 540, 625, 49, themeColors.blue);
    const checking = empty && !done('vacuous');
    box(
      ctx,
      api,
      checking ? '?' : 'True',
      1060,
      405,
      640,
      checking ? themeColors.muted : themeColors.green,
      46,
      115,
    );
    if (empty && !checking) {
      extensionText(ctx, api, '0 rows with missing fields', 1380, 625, 39, themeColors.ink);
    }
    if (done('record')) {
      extensionText(
        ctx,
        api,
        'MAE 5.3 · routine 1.5 · lag-one 23.6 · one alert · coverage 6/7',
        960,
        745,
        27,
        themeColors.cyan,
      );
    }
    if (done('hash')) caption(ctx, api, 'Record fingerprint   ·   c4e1172858f1');
    if (done('effects'))
      extensionText(
        ctx,
        api,
        'To reproduce this week   ·   input snapshot + code',
        960,
        925,
        28,
        themeColors.muted,
      );
  });
  return;
}
export default {
  id: 'fixture-gates',
  draw: drawFixtureGates,
  cues: [
    'fc-fixture-gates-checks',
    'fc-fixture-gates-empty',
    'fc-fixture-gates-vacuous',
    'fc-fixture-gates-record',
    'fc-fixture-gates-hash',
    'fc-fixture-gates-effects',
  ],
};
