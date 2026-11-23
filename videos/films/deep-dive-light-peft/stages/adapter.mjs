import { MODULE_SCORES, RANK_SCORES } from '../fixtures.mjs';
import { clamp01 } from '../arithmetic.mjs';
import { RANK_SELECTION } from '../construction.mjs';
import { adapterConstruction, beatCue, rankFixture } from '../model.mjs';
import { originalCard, originalMath, originalText, pairedCoordinates } from '../defaults.mjs';
const inputWidth = rankFixture().input.length;
export function drawAdapter(ctx, scene, state, api) {
  const themeColors = {
    ...api.C,
    purple: '#b7a2f7',
  };
  {
    const beat = state.beat ?? 0,
      z = adapterConstruction(beat, state.beatP ?? 0),
      rankIds = ['r1', 'r2', 'r3', 'r4'];
    if (state.cues) {
      z.moduleVisible = api.focus.visible('adapter-module-scores');
      z.rankVisible = api.focus.visible('adapter-rank-scores');
      if (beat === 1) {
        const dropping = beatCue(state, 1, 'lp-module-cut');
        const ranking = beatCue(state, 1, 'lp-rank-cut');
        z.moduleCutoff = beatCue(state, 1, 'lp-module-threshold') > 0;
        z.moduleDropped = dropping === 1;
        z.rankCutoff = ranking === 1;
        z.slice = beatCue(state, 1, 'adapter-beat-2-focus-1');
      }
      if (beat === 2) {
        z.cancellation = beatCue(state, 2, 'adapter-signed-products');
        z.signed = z.cancellation > 0;
        z.magnitude = beatCue(state, 2, 'adapter-magnitude-rule') === 1;
      }
    }
    const rankSort = state.cues
      ? beatCue(state, 1, 'lp-rank-sort')
      : clamp01((z.seconds - 5.38) / 1.3);
    const showRanks = state.cues ? rankSort > 0 : z.seconds >= 4.83;
    originalText(
      ctx,
      api,
      themeColors,
      'Whole insertion first · then paired rank coordinates',
      960,
      280,
      32,
      themeColors.ink,
      'center',
    );
    if (beat === 0) {
      originalText(
        ctx,
        api,
        themeColors,
        'Module output-change scores',
        960,
        350,
        28,
        themeColors.blue,
        'center',
      );
      if (z.moduleVisible)
        MODULE_SCORES.forEach((score, index) => {
          api.focus.target('adapter-m-index-score-tofixed-2', () =>
            originalCard(
              ctx,
              api,
              themeColors,
              'M' + index + ' · ' + score.toFixed(2),
              300 + index * 465,
              415,
              390,
              90,
              themeColors.blue,
              31,
            ),
          );
          api.focus.target('adapter-m-index-score-tofixed-2', () =>
            api.rect(ctx, 335 + index * 465, 550, score * 800, 35, themeColors.blue, undefined, 0),
          );
        });
      originalText(
        ctx,
        api,
        themeColors,
        'Rank loss-sensitivity scores · inside one module',
        960,
        700,
        28,
        themeColors.purple,
        'center',
      );
      if (z.rankVisible)
        api.focus.target('adapter-rank-score-objects', () =>
          RANK_SCORES.forEach((score, index) => {
            originalCard(
              ctx,
              api,
              themeColors,
              rankIds[index] + ' · ' + score.toFixed(2),
              220 + index * 390,
              770,
              330,
              90,
              themeColors.purple,
              29,
            );
            api.rect(
              ctx,
              245 + index * 390,
              905,
              score * 850,
              30,
              themeColors.purple,
              undefined,
              0,
            );
          }),
        );
      originalText(
        ctx,
        api,
        themeColors,
        'Supplied scores compare different decisions; each selected rank links both factors.',
        960,
        1010,
        26,
        themeColors.muted,
        'center',
      );
    } else {
      const top = beat === 2 ? -200 * z.reflow : 0;
      if (beat === 1) {
        const moduleOrder = [0, 2, 1],
          moduleSort = clamp01(z.seconds - 0.2);
        MODULE_SCORES.forEach((score, index) =>
          api.focus.target('adapter-m-index-score-tofixed-2-index-0-z-moduledropped-dropped', () =>
            originalCard(
              ctx,
              api,
              themeColors,
              'M' +
                index +
                ' · ' +
                score.toFixed(2) +
                (index === 0 && z.moduleDropped ? ' · dropped' : ''),
              api.lerp(230 + index * 510, 230 + moduleOrder.indexOf(index) * 510, moduleSort),
              360 + (index === 1 ? -1 : index === 2 ? 1 : 0) * 60 * Math.sin(Math.PI * moduleSort),
              450,
              75,
              z.moduleDropped ? (index ? themeColors.green : themeColors.pink) : themeColors.blue,
              28,
            ),
          ),
        );
        if (z.moduleCutoff && !showRanks)
          originalMath(
            ctx,
            api,
            themeColors,
            'Q_{0.33}=0.04+0.66(0.11-0.04)=0.0862',
            960,
            475,
            33,
            themeColors.yellow,
          );
        if (showRanks) {
          const rankOrder = [0, 2, 1, 3];
          RANK_SCORES.forEach((score, index) =>
            api.focus.target('adapter-ranks', () =>
              originalCard(
                ctx,
                api,
                themeColors,
                rankIds[index] + ' · ' + score.toFixed(2),
                api.lerp(220 + index * 390, 220 + rankOrder.indexOf(index) * 390, rankSort),
                510 + (index === 1 ? -1 : index === 2 ? 1 : 0) * 50 * Math.sin(Math.PI * rankSort),
                330,
                65,
                z.rankCutoff
                  ? RANK_SELECTION.kept.includes(index)
                    ? themeColors.green
                    : themeColors.pink
                  : themeColors.purple,
                26,
              ),
            ),
          );
          if (z.rankCutoff)
            originalMath(
              ctx,
              api,
              themeColors,
              'Q_{0.50}=0.03+0.5(0.17-0.03)=0.10',
              960,
              620,
              31,
              themeColors.yellow,
            );
        }
      }
      if (beat === 2 || showRanks) {
        api.focus.target('adapter-paired-factors', () =>
          pairedCoordinates(
            ctx,
            api,
            themeColors,
            630 + 80 * clamp01(z.slice * 2 - 1),
            710 + top,
            rankIds,
            ['r2', 'r4'],
            z.slice,
            z.focus,
            'Stored A · rank rows',
            'Stored B · rank columns',
            50,
            beat === 2 ? 150 : 250,
            inputWidth,
            beat === 2 || z.rankCutoff,
          ),
        );
        if (z.slice === 1 && beat === 1)
          originalText(
            ctx,
            api,
            themeColors,
            'A rows r2,r4 stay paired with B columns r2,r4',
            960,
            1020,
            27,
            themeColors.green,
            'center',
          );
      }
      if (beat === 2) {
        originalText(
          ctx,
          api,
          themeColors,
          'Unscaled product of the retained factors  ·  B A',
          960,
          365,
          30,
          themeColors.green,
          'center',
        );
        if (z.signed) {
          originalText(
            ctx,
            api,
            themeColors,
            'Signed weight-gradient products: +2 and −2',
            960,
            750,
            27,
            themeColors.muted,
            'center',
          );
          const start = 740,
            scale = 150;
          api.line(ctx, start, 810, start + 600, 810, themeColors.muted, 2);
          api.focus.target('adapter-signed-positive', () =>
            api.rect(ctx, start, 785, 2 * scale, 45, themeColors.blue, undefined, 0),
          );
          if (z.cancellation > 0)
            api.focus.target('adapter-signed-negative', () =>
              api.rect(
                ctx,
                start + 2 * scale * (1 - z.cancellation),
                845,
                2 * scale * z.cancellation,
                45,
                themeColors.pink,
                undefined,
                0,
              ),
            );
          originalText(
            ctx,
            api,
            themeColors,
            z.cancellation === 1
              ? 'Trainer: |mean(+2, −2)| = 0'
              : 'Signed terms cancel before the absolute value',
            960,
            945,
            29,
            themeColors.cyan,
            'center',
          );
        }
        if (z.magnitude)
          originalText(
            ctx,
            api,
            themeColors,
            'Paper: |+2| + |−2| = 4 · record the aggregation rule',
            960,
            1015,
            27,
            themeColors.yellow,
            'center',
          );
      }
    }
  }
}
export default {
  id: 'adapter',
  draw: drawAdapter,
  cues: [
    'adapter-module-scores',
    'adapter-rank-scores',
    'adapter-beat-2-focus-1',
    'lp-module-cut',
    'lp-module-threshold',
    'lp-rank-sort',
    'lp-rank-cut',
    'adapter-paired-rank-coordinates',
    'adapter-signed-products',
    'adapter-magnitude-rule',
  ],
};
