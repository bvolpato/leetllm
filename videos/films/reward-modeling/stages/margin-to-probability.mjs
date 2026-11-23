import { sigmoid } from '../arithmetic.mjs';
import { motion } from '../construction.mjs';
import { preferenceMargin } from '../model.mjs';
import { badge, formula, graphAxes, label, line } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = motion(state, 0.08, 0.72);
  const margin = preferenceMargin(state);
  const chosen = 0.7 + margin,
    rejected = 0.7;
  badge(api, ctx, 'SAME SCORER · TWO ANSWERS', 485, 280, api.C.yellow, 28);
  badge(api, ctx, 'A · chosen', 300, 350, api.C.green, 29);
  badge(api, ctx, 'B · rejected', 690, 350, api.C.red, 29);
  api.focus.target('chosen-score', () =>
    badge(api, ctx, `+${chosen.toFixed(2)}`, 300, 422, api.C.green, 49),
  );
  api.focus.target('rejected-score', () => badge(api, ctx, '+0.70', 690, 422, api.C.red, 49));
  const scoreX = (v) => 190 + (v / 2.2) * 590;
  line(api, ctx, 190, 520, 780, 520, api.C.muted, 3);
  const subtraction =
    beat === 0 ? api.focus.progress('subtract-rejected-score', motion(state, 0.23, 0.49)) : 1;
  const shift = rejected * subtraction;
  const chosenX = scoreX(chosen - shift),
    rejectedX = scoreX(rejected - shift);
  const markerGap = Math.abs(chosenX - rejectedX),
    tieOffset = Math.sqrt(Math.max(0, 40 ** 2 - markerGap ** 2)) / 2;
  line(api, ctx, rejectedX, 520, rejectedX, 520 + tieOffset, api.C.red, 2);
  line(api, ctx, chosenX, 520, chosenX, 520 - tieOffset, api.C.green, 2);
  api.circle(ctx, rejectedX, 520 + tieOffset, 18, api.C.red);
  api.circle(ctx, chosenX, 520 - tieOffset, 18, api.C.green);
  line(api, ctx, scoreX(rejected - shift), 580, scoreX(chosen - shift), 580, api.C.yellow, 4);
  line(api, ctx, scoreX(rejected - shift), 565, scoreX(rejected - shift), 580, api.C.yellow, 3);
  line(api, ctx, scoreX(chosen - shift), 565, scoreX(chosen - shift), 580, api.C.yellow, 3);
  api.focus.reveal('score-margin-result', () =>
    api.focus.target('score-margin', () =>
      formula(api, ctx, `\\Delta=r_w-r_l=${margin.toFixed(2)}`, 485, 661, 44, api.C.ink, 'center'),
    ),
  );
  if (beat > 0) {
    const share = sigmoid(margin),
      reveal =
        beat === 1 ? api.focus.progress('chosen-strength-share', motion(state, 0.02, 0.29)) : 1;
    api.focus.reveal('exponential-strengths', () =>
      api.focus.target('exponential-strength', () => {
        formula(
          api,
          ctx,
          `e^{${chosen.toFixed(2)}}=${Math.exp(chosen).toFixed(2)}`,
          335,
          743,
          31,
          api.C.green,
          'center',
        );
        formula(
          api,
          ctx,
          `e^{${rejected.toFixed(2)}}=${Math.exp(rejected).toFixed(2)}`,
          705,
          743,
          31,
          api.C.red,
          'center',
        );
      }),
    );
    const left = 200,
      full = 590,
      top = 782;
    api.focus.target('strength-share', () => {
      api.rect(ctx, left, top, full, 38, api.C.panel, api.C.muted, 9);
      api.rect(
        ctx,
        left + 3,
        top + 3,
        Math.max(1, (full - 6) * share * reveal),
        32,
        api.C.green,
        undefined,
        6,
      );
      if (reveal > 0.1)
        api.rect(
          ctx,
          left + 3 + (full - 6) * share * reveal,
          top + 3,
          Math.max(1, (full - 6) * (1 - share) * reveal),
          32,
          api.C.red,
          undefined,
          6,
        );
    });
  }
  const gx = 1060,
    gy = 330,
    gw = 650,
    gh = 400;
  const mx = (z) => gx + ((z + 3) / 6) * gw,
    my = (q) => gy + gh - q * gh;
  api.focus.reveal('sigmoid-mapping', () =>
    api.focus.target('sigmoid-curve', () => {
      graphAxes(api, ctx, gx, gy, gw, gh, 'score margin Δ', 'preference probability');
      for (const tick of [-2, 0, 2]) {
        line(api, ctx, mx(tick), gy + gh, mx(tick), gy + gh + 12);
        badge(api, ctx, String(tick), mx(tick), gy + gh + 46, api.C.muted, 26);
      }
      label(api, ctx, '1', gx - 24, gy + 10, 26, api.C.muted, 'right');
      label(api, ctx, '0', gx - 24, gy + gh, 26, api.C.muted, 'right');
      api.trace(
        ctx,
        Array.from(
          {
            length: 81,
          },
          (_, i) => {
            const z = -3 + (i / 80) * 6;
            return {
              x: mx(z),
              y: my(sigmoid(z)),
            };
          },
        ),
        1,
        api.C.cyan,
        5,
      );
      if (beat === 2 && margin > 0.4) {
        api.circle(ctx, mx(0), my(0.5), 16, api.C.blue, api.C.ink);
        badge(api, ctx, '50%', mx(0) - 50, my(0.5) - 28, api.C.blue, 30);
      }
      api.circle(ctx, mx(margin), my(sigmoid(margin)), 17, api.C.yellow, api.C.ink);
      line(api, ctx, mx(margin), my(sigmoid(margin)) + 18, mx(margin), gy + gh, api.C.yellow, 2);
      badge(api, ctx, `${(sigmoid(margin) * 100).toFixed(0)}%`, 1595, 280, api.C.yellow, 45);
    }),
  );
  api.focus.reveal('sigmoid-mapping', () =>
    api.trace(
      ctx,
      [
        {
          x: chosenX,
          y: 580,
        },
        {
          x: 940,
          y: 580,
        },
        {
          x: 940,
          y: my(sigmoid(margin)) - 60,
        },
        {
          x: mx(margin),
          y: my(sigmoid(margin)) - 60,
        },
        {
          x: mx(margin),
          y: my(sigmoid(margin)) - 18,
        },
      ],
      beat === 0 ? progress : 1,
      api.C.yellow,
      4,
    ),
  );
  if (beat === 2) {
    const voteCount = Math.floor(
      api.focus.progress('check-human-judgments', motion(state, 0.58, 0.9)) * 4.99,
    );
    api.focus.target('human-votes', () =>
      badge(api, ctx, 'Four fresh votes on A versus B', 1415, 854, api.C.muted, 24),
    );
    for (let i = 0; i < 4; i++) {
      const filled = i < voteCount;
      api.focus.target('human-votes', () => {
        api.circle(
          ctx,
          1220 + i * 120,
          890,
          21,
          filled ? (i < 3 ? api.C.green : api.C.red) : api.C.panel,
          filled ? undefined : api.C.muted,
        );
        if (filled) badge(api, ctx, i < 3 ? 'A' : 'B', 1220 + i * 120, 900, api.C.bg, 28);
      });
    }
  }
  api.focus.reveal('sigmoid-mapping', () =>
    api.focus.target('preference-probability', () =>
      formula(
        api,
        ctx,
        beat === 1
          ? '\\frac{e^{r_w}}{e^{r_w}+e^{r_l}}=\\sigma(r_w-r_l)'
          : 'P(y_w\\succ y_l\\mid x)=\\sigma(\\Delta)',
        beat === 2 ? 480 : 960,
        beat === 2 ? 960 : 970,
        beat === 2 ? 37 : 45,
        api.C.ink,
        'center',
      ),
    ),
  );
}

export function drawMarginToProbability(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'margin-to-probability',
  draw: drawMarginToProbability,
  cues: [
    'margin-to-probability-b1-1',
    'subtract-rejected-score',
    'score-margin-result',
    'exponential-strengths',
    'chosen-strength-share',
    'sigmoid-mapping',
    'equal-score-chance',
    'restore-score',
    'check-human-judgments',
  ],
};
