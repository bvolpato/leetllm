import { RESIDUALS } from '../fixtures.mjs';
import { clamp, cueProgress, phase } from '../construction.mjs';
import { correctedThreshold } from '../model.mjs';
import { axis, caption, intervalRow, line, text } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const reveal = (id, beat, a = 0.08, z = 0.8) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : cueProgress(cues, id, phase(progress, a, z));
  const paint = () => {
    const pl = axis(
      ctx,
      api,
      [20, 70],
      825,
      'response latency · milliseconds',
      [20, 30, 40, 50, 60, 70],
    );
    text(ctx, api, 'deadline 50', pl.point(50, 0.5).x, 290, 29, themeColors.pink, 'center');
    if (currentBeat === 0) {
      line(ctx, api, pl.point(50, 0.5).x, 550, pl.point(50, 0.5).x, 580, themeColors.pink, 3);
      intervalRow(ctx, api, pl, 565, 40, 8, 48);
      text(
        ctx,
        api,
        '[32, 48] ms · upper endpoint below 50',
        960,
        760,
        33,
        themeColors.cyan,
        'center',
      );
      caption(
        ctx,
        api,
        'Selecting these intervals creates another subgroup; marginal validity alone does not certify it.',
      );
    } else {
      const center = 40 + 4 * reveal('transfer-center', 1, 0.03, 0.31),
        coverage = 0.8 + 0.1 * reveal('transfer-coverage', 1, 0.36, 0.65),
        radius = 8 + reveal('transfer-residual', 1, 0.7, 0.96),
        q = correctedThreshold(RESIDUALS, coverage);
      const rows = [
        {
          name: 'center',
          y: 415,
          center,
          radius: 8,
          detail: 'target 80% · rank 8 · q 8 ms',
        },
        {
          name: 'target',
          y: 585,
          center: 40,
          radius: q.threshold,
          detail:
            'target ' +
            (coverage * 100).toFixed(1) +
            '% · rank ' +
            q.rank +
            ' · q ' +
            q.threshold +
            ' ms',
        },
        {
          name: 'C8 value',
          y: 755,
          center: 40,
          radius,
          detail: 'target 80% · rank 8 · q ' + radius.toFixed(1) + ' ms',
        },
      ];
      for (const r of rows) {
        line(
          ctx,
          api,
          pl.point(50, 0.5).x,
          r.y - 15,
          pl.point(50, 0.5).x,
          r.y + 15,
          themeColors.pink,
          3,
        );
        text(ctx, api, r.name, 175, r.y + 8, 27, themeColors.muted);
        line(ctx, api, pl.point(32, 0.5).x, r.y, pl.point(48, 0.5).x, r.y, themeColors.border, 18);
        intervalRow(ctx, api, pl, r.y, r.center, r.radius, 0, {
          showOutcome: false,
          color: themeColors.cyan,
        });
        text(ctx, api, r.detail, 1710, r.y - 42, 25, themeColors.yellow, 'right');
      }
      caption(
        ctx,
        api,
        currentBeat === 1
          ? 'Three separate comparisons with the same baseline; one changed control per row.'
          : 'Bind procedure, score, calibration identities, coverage target and decision outcomes.',
      );
    }
  };
  if (api.focus) api.focus.target(`${'transfer'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-b1',
    'transfer-b2',
    'transfer-center',
    'transfer-coverage',
    'transfer-residual',
    'transfer-b3',
  ],
};
