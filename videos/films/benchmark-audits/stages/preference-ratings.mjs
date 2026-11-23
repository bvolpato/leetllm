import { clip, preferenceProbability, smooth } from '../arithmetic.mjs';
import { auditCue, auditStarted } from '../construction.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionLine,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawPreferenceRatings(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors, teaching: teaching } = api;
        const cue = (name, fallback = q) =>
          auditCue(state, 'ba-preference-ratings-' + name, fallback);
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-preference-ratings-' + name, fallback);
        {
          const ax = teaching.axes({
            x: 200,
            y: 365,
            width: 1000,
            height: 470,
            xDomain: [-800, 800],
            yDomain: [0, 1],
            xTicks: [-800, -400, 0, 400, 800],
            yTicks: [0, 0.5, 1],
            xLabel: 'rating A − rating B',
            yLabel: 'Modeled preference score',
            fontSize: 26,
          });
          teaching.curve({
            plot: ax,
            points: Array.from(
              {
                length: 201,
              },
              (_, i) => ({
                x: -800 + (1600 * i) / 200,
                y: preferenceProbability(-800 + (1600 * i) / 200),
              }),
            ),
            color: themeColors.cyan,
            width: 5,
            progress: currentBeat ? 1 : cue('logistic'),
          });
          drawAuditExpansionText(
            ctx,
            api,
            'Blind human votes fit preference, not factual accuracy',
            960,
            275,
            32,
            themeColors.ink,
            'center',
          );
          const delta = currentBeat === 0 ? 0 : shown('advantage', progress > 0.3) ? 400 : 0,
            point = ax.point(delta, preferenceProbability(delta));
          api.circle(ctx, point.x, point.y, 12, themeColors.yellow);
          drawAuditExpansionLine(
            ctx,
            api,
            point.x,
            point.y,
            point.x,
            ax.point(delta, 0).y,
            themeColors.yellow,
            2,
          );
          drawAuditExpansionCell(
            ctx,
            api,
            'Modeled preference score',
            1330,
            400,
            440,
            90,
            themeColors.cyan,
            32,
          );
          if (currentBeat === 0) {
            if (shown('exponent', progress > 0.6)) {
              api.math(
                ctx,
                String.raw`\frac{1}{1+10^e}`,
                1550,
                605,
                40,
                themeColors.yellow,
                'center',
              );
              drawAuditExpansionText(
                ctx,
                api,
                'e = (rating B − A) / 400',
                1550,
                685,
                27,
                themeColors.yellow,
                'center',
              );
            }
          } else {
            drawAuditExpansionText(
              ctx,
              api,
              delta === 0 ? 'Δ = 0 → 1/2' : 'Δ = 400 → 10/11',
              1550,
              580,
              36,
              themeColors.yellow,
              'center',
            );
            if (shown('variants', progress > 0.7)) {
              for (let i = 0; i < 5; i++)
                api.circle(
                  ctx,
                  1360 + i * 85,
                  790 - i * 18,
                  13,
                  i === 4 ? themeColors.green : themeColors.muted,
                );
              drawAuditExpansionText(
                ctx,
                api,
                'private-variant selection',
                1550,
                910,
                27,
                themeColors.pink,
                'center',
              );
            }
          }
          drawAuditExpansionNote(
            ctx,
            api,
            'Ties and “both bad” votes score 0.5. Ratings use a 400-point base-10 scale.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'preference-ratings',
  draw: drawPreferenceRatings,
  cues: [
    'preference-ratings-phase-0',
    'ba-preference-ratings-logistic',
    'ba-preference-ratings-exponent',
    'preference-ratings-phase-1',
    'rating-equal',
    'rating-gap',
    'ba-preference-ratings-equal',
    'ba-preference-ratings-advantage',
    'ba-preference-ratings-variants',
  ],
};
