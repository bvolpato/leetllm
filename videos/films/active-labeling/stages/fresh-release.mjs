import {
  cueComplete,
  cueVisible,
  detailEquation,
  detailFooter,
  detailHeading,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawFreshRelease(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    const kappa = cueComplete(ctx, api, 'fresh-kappa'),
      overlap = cueComplete(ctx, api, 'fresh-overlap'),
      rebuilt = cueComplete(ctx, api, 'fresh-rebuild'),
      held = cueComplete(ctx, api, 'fresh-gate');
    detailHeading(ctx, api, 'New batch · same release contract');
    detailText(ctx, api, 'Rater 2: A / B', 560, 350, 28, themeColors.muted, 'center');
    [
      [32, 8],
      [8, 32],
    ].forEach((r, i) =>
      r.forEach((n, j) =>
        detailTarget(ctx, api, 'fresh-premises', () => {
          detailRectangle(
            ctx,
            api,
            300 + j * 270,
            405 + i * 175,
            220,
            125,
            i === j ? themeColors.green : themeColors.pink,
          );
          detailText(
            ctx,
            api,
            String(n),
            410 + j * 270,
            485 + i * 175,
            42,
            i === j ? themeColors.green : themeColors.pink,
            'center',
          );
        }),
      ),
    );
    detailText(
      ctx,
      api,
      '80 reviews · threshold κ ≥ 0.65',
      560,
      855,
      31,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      detailTarget(ctx, api, 'fresh-predict', () => {
        if (cueVisible(ctx, api, 'fresh-predict'))
          detailText(
            ctx,
            api,
            'Can this release proceed?',
            1320,
            505,
            37,
            themeColors.yellow,
            'center',
          );
      });
      detailRow(ctx, api, 'ticket-nine → frozen incident-seven', 1000, 650, 770, themeColors.pink);
      detailFooter(
        ctx,
        api,
        'All other supplied checks passed. Predict before revealing the coefficient.',
      );
    } else if (currentBeat === 1) {
      detailTarget(ctx, api, 'fresh-kappa', () => {
        if (kappa) {
          detailEquation(
            ctx,
            api,
            String.raw`p_o=\frac{64}{80}=.8,\quad p_e=.5`,
            1320,
            430,
            38,
            themeColors.blue,
          );
          detailEquation(
            ctx,
            api,
            String.raw`\kappa=\frac{.8-.5}{1-.5}=.6<.65`,
            1320,
            575,
            43,
            themeColors.pink,
          );
        } else
          detailText(
            ctx,
            api,
            'Agreement coefficient and comparison pending',
            1320,
            505,
            29,
            themeColors.muted,
            'center',
          );
      });
      detailTarget(ctx, api, 'fresh-overlap', () => {
        if (overlap) {
          detailRow(
            ctx,
            api,
            'ticket-nine → frozen incident-seven',
            1000,
            730,
            770,
            themeColors.pink,
          );
          detailText(
            ctx,
            api,
            'Independent family-overlap blocker',
            1385,
            865,
            29,
            themeColors.pink,
            'center',
          );
        } else
          detailText(
            ctx,
            api,
            'Source-family check pending',
            1385,
            810,
            29,
            themeColors.muted,
            'center',
          );
      });
      detailTarget(ctx, api, 'fresh-disagreements', () =>
        detailFooter(
          ctx,
          api,
          cueComplete(ctx, api, 'fresh-disagreements')
            ? 'Review 16 disagreements; forced agreement cannot repair the evidence.'
            : 'Inspect agreement and source-family evidence.',
        ),
      );
    } else {
      detailTarget(ctx, api, 'fresh-rebuild', () => {
        if (rebuilt) {
          detailRow(
            ctx,
            api,
            'Reserved family + derivatives removed',
            1000,
            420,
            770,
            themeColors.cyan,
          );
          detailRow(ctx, api, 'Rebuilt snapshot → new digest', 1000, 540, 770, themeColors.blue);
        } else {
          detailRow(ctx, api, 'Rebuilding row snapshot', 1000, 420, 770, themeColors.yellow);
          detailRow(ctx, api, 'New digest pending', 1000, 540, 770, themeColors.muted);
        }
      });
      detailTarget(ctx, api, 'fresh-gate', () => {
        if (held) {
          detailRow(ctx, api, 'Current audit pending → CLOSED', 1000, 700, 770, themeColors.yellow);
          detailRow(ctx, api, 'Agreement still κ = .60 → CLOSED', 1000, 820, 770, themeColors.pink);
        } else {
          detailRow(ctx, api, 'Checking current audit', 1000, 700, 770, themeColors.yellow);
          detailRow(ctx, api, 'Checking agreement requirement', 1000, 820, 770, themeColors.yellow);
        }
      });
      detailFooter(
        ctx,
        api,
        'A later passing dataset supplies a reproducible signal; the trained model still needs independent evaluation.',
      );
    }
  }
  return;
}
export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'fresh-premises',
    'fresh-predict',
    'fresh-kappa',
    'fresh-overlap',
    'fresh-disagreements',
    'fresh-rebuild',
    'fresh-gate',
  ],
};
