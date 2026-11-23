import { betaDensity } from '../arithmetic.mjs';
import { clauseEnded, event } from '../construction.mjs';
import { predictiveFrame } from '../model.mjs';
import {
  areaFill,
  caption,
  chart,
  curve,
  equation,
  ring,
  target,
  text,
  tile,
} from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawPredictive(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const f = (v, n = 3) => v.toFixed(n);
  {
    const v = predictiveFrame(state);
    if (currentBeat === 0) {
      const q = chart(ctx, api, {
          x: 150,
          y: 385,
          width: 700,
          height: 410,
          max: 4,
          xLabel: 'candidate rate p',
        }),
        r = chart(ctx, api, {
          x: 1070,
          y: 385,
          width: 700,
          height: 410,
          max: 4,
          label: 'contribution p × density',
          xLabel: 'same candidate rate p',
        });
      text(ctx, api, 'Posterior weight', 500, 300, 31, themeColors.blue, 'center');
      text(
        ctx,
        api,
        'Contribution to the next-task forecast',
        1420,
        300,
        30,
        themeColors.yellow,
        'center',
      );
      curve(ctx, api, q, 10, 4, themeColors.blue);
      target(ctx, api, 'weighted-contribution', () => {
        api.teaching.curve({
          plot: r,
          points: sampleFunction((x) => x * betaDensity(10, 4, x), 0, 1, 240),
          color: themeColors.yellow,
          width: 5,
        });
        areaFill(ctx, api, r, (x) => x * betaDensity(10, 4, x), 0, v.sweep, themeColors.yellow);
      });
      for (const plot of [q, r]) {
        const y = plot === q ? betaDensity(10, 4, v.sweep) : v.sweep * betaDensity(10, 4, v.sweep),
          p = plot.point(v.sweep, y);
        api.line(ctx, p.x, plot.point(v.sweep, 0).y, p.x, p.y, themeColors.green, 2);
        ring(ctx, api, p, themeColors.green, 7);
      }
      target(ctx, api, 'next-forecast', () =>
        equation(
          ctx,
          api,
          `\\int_0^{${f(v.sweep, 2)}}p\\,f(p\\mid D)\\,dp\\approx${f(v.integral)}`,
          960,
          955,
          41,
          themeColors.yellow,
        ),
      );
      caption(
        ctx,
        api,
        'The right-hand area is the rate-weighted average · each possible rate contributes its own forecast',
      );
    } else if (currentBeat === 1) {
      const q = chart(ctx, api, {
        max: 4,
      });
      curve(ctx, api, q, 10, 4, themeColors.blue);
      if (v.recorded)
        target(ctx, api, 'following-density', () => curve(ctx, api, q, 11, 4, themeColors.yellow));
      target(ctx, api, 'new-pass', () =>
        tile(
          ctx,
          api,
          {
            id: 11,
            pass: true,
          },
          1350 + 115 * v.arrival,
          300 + 120 * v.arrival,
          190,
          84,
        ),
      );
      text(ctx, api, 'Hypothetical next-task result', 1540, 260, 27, themeColors.muted, 'center');
      equation(
        ctx,
        api,
        `\\operatorname{Beta}(${v.a},4)`,
        1560,
        610,
        52,
        v.recorded ? themeColors.yellow : themeColors.blue,
      );
      target(ctx, api, 'following-forecast', () => {
        text(ctx, api, 'following-task forecast', 1560, 740, 30, themeColors.muted, 'center');
        text(
          ctx,
          api,
          (v.forecast * 100).toFixed(1) + '%',
          1560,
          835,
          66,
          themeColors.green,
          'center',
        );
      });
      caption(
        ctx,
        api,
        v.recorded
          ? 'One new pass is recorded once · the following forecast uses the updated distribution'
          : 'Keep Beta(10,4) fixed until the new result arrives',
      );
    } else {
      const answered = clauseEnded(state, 2, 'joint-answer', 0.55);
      const compare = event(state, 2, 'joint-variance-comparison', 0.66, 0.9) > 0;
      const first = [
          {
            x: 800,
            y: 390,
          },
          {
            x: 800,
            y: 770,
          },
        ],
        leaf = [
          {
            x: 1310,
            y: 285,
          },
          {
            x: 1310,
            y: 495,
          },
          {
            x: 1310,
            y: 685,
          },
          {
            x: 1310,
            y: 895,
          },
        ],
        names = ['pass, pass', 'pass, fail', 'fail, pass', 'fail, fail'];
      text(ctx, api, 'Before either future task runs', 300, 300, 29, themeColors.muted, 'center');
      api.rect(ctx, 150, 500, 300, 150, themeColors.panel, themeColors.blue, 2, 10);
      text(ctx, api, 'original posterior', 300, 545, 25, themeColors.blue, 'center');
      equation(ctx, api, String.raw`\operatorname{Beta}(10,4)`, 300, 610, 36, themeColors.blue);
      for (let i = 0; i < 2; i++) {
        target(ctx, api, i === 0 ? 'two-pass-path' : 'other-future-paths', () => {
          api.rect(
            ctx,
            680,
            first[i].y - 45,
            240,
            90,
            themeColors.panel,
            i ? themeColors.red : themeColors.green,
            2,
            10,
          );
          api.arrow(ctx, 450, 575, 680, first[i].y, i ? themeColors.red : themeColors.green, 5);
          text(
            ctx,
            api,
            i ? 'first fails' : 'first passes',
            800,
            first[i].y - 10,
            27,
            i ? themeColors.red : themeColors.green,
            'center',
          );
          equation(
            ctx,
            api,
            i ? '4/14' : '10/14',
            800,
            first[i].y + 27,
            26,
            i ? themeColors.red : themeColors.green,
          );
        });
        for (let j = 0; j < 2; j++) {
          const k = 2 * i + j;
          if (v.jointReveal <= (k === 0 ? 0.18 : 0.7)) continue;
          target(ctx, api, k === 0 ? 'two-pass-path' : 'other-future-paths', () => {
            api.rect(
              ctx,
              1250,
              leaf[k].y - 45,
              550,
              90,
              themeColors.panel,
              k === 0 ? themeColors.green : themeColors.muted,
              2,
              10,
            );
            api.arrow(
              ctx,
              920,
              first[i].y,
              1250,
              leaf[k].y,
              j ? themeColors.red : themeColors.green,
              4,
            );
            equation(
              ctx,
              api,
              ['11/15', '4/15', '10/15', '5/15'][k],
              1080,
              (first[i].y + leaf[k].y) / 2 - 38,
              25,
              j ? themeColors.red : themeColors.green,
            );
            text(
              ctx,
              api,
              names[k],
              1330,
              leaf[k].y + 10,
              29,
              k === 0 ? themeColors.green : themeColors.ink,
            );
            text(
              ctx,
              api,
              !answered ? '?' : (100 * v.joint[k]).toFixed(1) + '%',
              1700,
              leaf[k].y + 10,
              35,
              k === 0 ? themeColors.green : themeColors.muted,
              'right',
            );
          });
        }
      }
      target(ctx, api, 'joint-comparison', () =>
        equation(
          ctx,
          api,
          answered
            ? 'E[p^2]=(10/14)(11/15)\\approx' +
                f(v.joint[0]) +
                (compare ? '\\quad(E[p])^2\\approx' + f(v.frozen) : '')
            : 'P(PP\\mid D)=?',
          960,
          1010,
          35,
          themeColors.yellow,
        ),
      );
    }
  }
}
export default {
  id: 'predictive',
  draw: drawPredictive,
  cues: [
    'weighted-contribution',
    'new-pass-arrival',
    'two-pass-path',
    'joint-answer',
    'joint-variance-comparison',
  ],
};
