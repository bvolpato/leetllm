import { mixture, unit } from '../arithmetic.mjs';
import { MAX_ADDED_VARIANCE, SCORE_PROBE } from '../fixtures.mjs';
import { opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionGrid,
  drawConstructionText,
  drawConstructionTitle,
  drawOriginalArrow,
  drawOriginalCircle,
  drawOriginalField,
  drawOriginalMath,
  drawOriginalRect,
  drawOriginalTarget,
  drawOriginalText,
} from '../defaults.mjs';
function drawOriginal(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const stage = (index, start = 0.05, end = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const fade = api.components.fade;
  ctx.save();
  {
    const varianceP = beat === 0 ? 1 - stage(0) : 0;
    const breakdownCue = state.cues?.['score-beat-2-focus-2'];
    const showBreakdown = breakdownCue?.active === true;
    const breakdownProgress = breakdownCue?.progress ?? 0;
    const probe = beat > 0 ? SCORE_PROBE : undefined;
    api.focus.target('score-score-field', () =>
      drawOriginalField(
        ctx,
        api,
        150,
        310,
        1050,
        varianceP,
        {
          particles: false,
          arrows: beat > 0 || progress > 0.72,
          selected: beat > 0,
          probe,
        },
        () => [-2.8 + stage(1) * 4.9, 0.75],
      ),
    );
    drawOriginalText(
      ctx,
      api,
      'exact Gaussian-mixture density',
      675,
      270,
      31,
      themeColors.cyan,
      'center',
    );
    drawOriginalMath(ctx, api, String.raw`s_u(x)=\nabla_x\log p_u(x)`, 1515, 405, 43);
    drawOriginalText(
      ctx,
      api,
      'local density direction',
      1515,
      490,
      31,
      themeColors.yellow,
      'center',
    );
    if (showBreakdown) {
      drawOriginalTarget(ctx, api, 'score-mixture-decomposition', () => {
        const x = 1225,
          y = 525,
          width = 640,
          height = 395;
        drawOriginalRect(ctx, api, x, y, width, height, themeColors.panel, '#566984', 18);
        drawOriginalText(
          ctx,
          api,
          'Three posterior-weighted component scores',
          1545,
          558,
          25,
          themeColors.ink,
          'center',
        );
        const addedVariance = MAX_ADDED_VARIANCE * (1 - varianceP);
        drawOriginalText(
          ctx,
          api,
          `probe (${SCORE_PROBE[0].toFixed(2)}, ${SCORE_PROBE[1].toFixed(2)}) · added variance u = ${addedVariance.toFixed(2)}`,
          1545,
          590,
          20,
          themeColors.muted,
          'center',
        );
        drawOriginalText(ctx, api, 'cluster · πᵢ', 1335, 622, 18, themeColors.muted, 'center');
        drawOriginalText(ctx, api, 'local gᵢ', 1515, 622, 18, themeColors.muted, 'center');
        drawOriginalText(ctx, api, 'weighted πᵢgᵢ', 1735, 622, 18, themeColors.muted, 'center');
        const decomposition = mixture(SCORE_PROBE, addedVariance, {
          includeComponents: true,
        });
        const colors = [themeColors.blue, themeColors.pink, themeColors.green];
        decomposition.components.forEach((component, index) => {
          const reveal = api.clamp(breakdownProgress * 3 - index);
          if (reveal <= 0) return;
          fade(reveal, () => {
            const rowY = 651 + index * 29;
            drawOriginalText(
              ctx,
              api,
              `C${index + 1} · π=${component.posteriorWeight.toFixed(3)}`,
              1335,
              rowY,
              18,
              colors[index],
              'center',
            );
            drawOriginalText(
              ctx,
              api,
              `(${component.localScore[0].toFixed(2)}, ${component.localScore[1].toFixed(2)})`,
              1515,
              rowY,
              18,
              themeColors.ink,
              'center',
            );
            drawOriginalText(
              ctx,
              api,
              `(${component.contribution[0].toFixed(2)}, ${component.contribution[1].toFixed(2)})`,
              1735,
              rowY,
              18,
              colors[index],
              'center',
            );
          });
        });
        drawOriginalText(
          ctx,
          api,
          'Head-to-tail sum · 240 px per score unit',
          1545,
          751,
          20,
          themeColors.cyan,
          'center',
        );
        const vectorScale = 240,
          origin = {
            x: 1550,
            y: 812,
          };
        let accumulated = [0, 0];
        decomposition.components.forEach((component, index) => {
          const reveal = api.clamp(breakdownProgress * 3 - index);
          if (reveal <= 0) return;
          const start = {
            x: origin.x + accumulated[0] * vectorScale,
            y: origin.y - accumulated[1] * vectorScale,
          };
          const end = {
            x: start.x + component.contribution[0] * vectorScale * reveal,
            y: start.y - component.contribution[1] * vectorScale * reveal,
          };
          fade(reveal, () =>
            drawOriginalArrow(ctx, api, start.x, start.y, end.x, end.y, colors[index], 5),
          );
          if (reveal === 1)
            accumulated = accumulated.map((value, axis) => value + component.contribution[axis]);
        });
        drawOriginalCircle(ctx, api, origin.x, origin.y, 5, themeColors.ink);
        const sumReveal = api.clamp((breakdownProgress - 0.72) / 0.28);
        if (sumReveal > 0) {
          const sumEnd = {
            x: 1765 + decomposition.score[0] * vectorScale * sumReveal,
            y: 875 - decomposition.score[1] * vectorScale * sumReveal,
          };
          fade(sumReveal, () =>
            drawOriginalArrow(ctx, api, 1765, 875, sumEnd.x, sumEnd.y, themeColors.yellow, 6),
          );
          fade(sumReveal, () =>
            drawOriginalText(
              ctx,
              api,
              'Σ πᵢgᵢ = sᵤ(x)',
              1765,
              904,
              18,
              themeColors.yellow,
              'center',
            ),
          );
        }
      });
    } else {
      drawOriginalText(ctx, api, '3 clean clusters', 1515, 600, 31, themeColors.ink, 'center');
      drawOriginalText(
        ctx,
        api,
        '+ Gaussian variance u',
        1515,
        665,
        30,
        themeColors.muted,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'arrows capped for readability',
        1515,
        810,
        25,
        themeColors.muted,
        'center',
      );
    }
    drawOriginalText(
      ctx,
      api,
      'toy distribution · analytic score',
      675,
      1020,
      29,
      themeColors.yellow,
      'center',
    );
    drawOriginalTarget(ctx, api, 'score-conversion', () =>
      drawOriginalMath(
        ctx,
        api,
        String.raw`s_\theta(x_t,t)=-\frac{\epsilon_\theta(x_t,t)}{\sqrt{1-\bar\alpha_t}}`,
        1515,
        965,
        36,
      ),
    );
  }
  ctx.restore();
}
export function drawScore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = opProgress(state, 'score');
  {
    if (currentBeat === 0) {
      drawOriginal(
        ctx,
        scene,
        {
          ...state,
          beatP: progress2,
        },
        api,
      );
      return;
    }
    const d = mixture(SCORE_PROBE, 3, {
        includeComponents: true,
      }),
      colors = [themeColors.blue, themeColors.pink, themeColors.green],
      q = state.cues?.['score-beat-2-focus-2'],
      progress =
        currentBeat > 1
          ? 1
          : q
            ? q.phase === 'before'
              ? 0
              : q.phase === 'after'
                ? 1
                : q.progress
            : progress2;
    drawConstructionTitle(
      ctx,
      api,
      'One probe · three weighted local scores · one resulting vector',
    );
    drawConstructionFocus(ctx, api, 'score-score-field', () =>
      drawConstructionBox(
        ctx,
        api,
        'Probe (0.20, −0.40) · added variance u = 3',
        170,
        360,
        1580,
        themeColors.blue,
        90,
        31,
      ),
    );
    drawConstructionFocus(ctx, api, 'score-mixture-decomposition', () => {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Component', 'Posterior share', 'Local score', 'Weighted contribution'],
          ...d.components.map((v, i) => [
            'C' + (i + 1),
            v.posteriorWeight.toFixed(3),
            v.localScore.map((x) => x.toFixed(3)).join(', '),
            v.contribution.map((x) => x.toFixed(3)).join(', '),
          ]),
        ],
        170,
        510,
        1580,
        260,
        themeColors.cyan,
        25,
      );
      const origin = {
          x: 850,
          y: 910,
        },
        scale = 650;
      let tip = {
        ...origin,
      };
      d.components.forEach((v, i) => {
        const a = unit(progress * 3 - i),
          end = {
            x: tip.x + scale * v.contribution[0] * a,
            y: tip.y - scale * v.contribution[1] * a,
          };
        if (a > 0) drawConstructionArrow(ctx, api, tip.x, tip.y, end.x, end.y, colors[i], 6);
        if (a === 1) tip = end;
      });
      drawConstructionText(ctx, api, 'Head-to-tail weighted sum', 280, 930, 28, themeColors.yellow);
      if (progress >= 1) {
        drawConstructionArrow(
          ctx,
          api,
          1500,
          865,
          1500 + 650 * d.score[0],
          865 - 650 * d.score[1],
          themeColors.yellow,
          7,
        );
        drawConstructionText(
          ctx,
          api,
          'Complete score',
          1490,
          1005,
          26,
          themeColors.yellow,
          'center',
        );
      }
    });
    drawConstructionFocus(ctx, api, 'score-conversion', () =>
      drawConstructionEquation(
        ctx,
        api,
        String.raw`s=-\hat\epsilon/\sqrt{1-\bar\alpha}`,
        1490,
        970,
        31,
      ),
    );
    return;
  }
}
export default {
  id: 'score',
  draw: drawScore,
  cues: [
    'score-beat-1-focus-1',
    'score-beat-1-focus-2',
    'df-score-0',
    'score-beat-2-focus-1',
    'score-beat-2-focus-2',
    'df-score-1',
    'score-conversion',
    'df-score-2',
  ],
};
