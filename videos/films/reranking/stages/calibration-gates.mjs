import { marginSelection } from '../model.mjs';
import {
  caption,
  coreText,
  cueProgress,
  cueVisible,
  dot,
  focusTargets,
  line,
} from '../defaults.mjs';
export function drawCalibrationGates(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  {
    focusTargets(
      ctx,
      api,
      [
        'two-query-scores',
        'absolute-gate',
        'rank-forced',
        'margin-premises',
        'margin-cut',
        'shift-ten',
        'scale-two',
        'calibration-bin',
        'observed-eight',
        'calibration-splits',
      ],
      () => {
        if (currentBeat === 0) {
          const plot = teaching.axes({
            x: 720,
            y: 400,
            width: 900,
            height: 430,
            xDomain: [0, 1],
            yDomain: [0, 2],
            xTicks: [0, 0.6, 0.7, 0.9, 1],
            yTicks: [],
            xLabel: 'supplied score',
            fontSize: 26,
            color: themeColors.muted,
          });
          coreText(ctx, api, 'No-answer query · distractor', 150, 520, 29, themeColors.pink);
          coreText(ctx, api, 'Answerable query · useful evidence', 150, 700, 29, themeColors.green);
          if (cueVisible(ctx, api, 'two-query-scores')) {
            const a = plot.point(0.9, 1.5),
              d = plot.point(0.6, 0.65);
            dot(ctx, api, a.x, a.y, 12, themeColors.pink);
            dot(ctx, api, d.x, d.y, 12, themeColors.green);
          }
          if (cueVisible(ctx, api, 'absolute-gate')) {
            const g = plot.point(0.7, 0);
            line(ctx, api, g.x, 370, g.x, 850, themeColors.yellow, 3);
            coreText(ctx, api, 'admit →', g.x + 50, 350, 29, themeColors.yellow);
            coreText(ctx, api, 'reject useful 0.6', 620, 915, 32, themeColors.pink);
            coreText(ctx, api, 'admit distractor 0.9', 1290, 915, 32, themeColors.pink);
          }
          if (cueVisible(ctx, api, 'rank-forced'))
            coreText(
              ctx,
              api,
              'Rank-first still returns a distractor when every candidate is irrelevant.',
              960,
              990,
              29,
              themeColors.ink,
              'center',
            );
        } else if (currentBeat === 1) {
          const shift = 10 * cueProgress(ctx, api, 'shift-ten'),
            scale = 1 + cueProgress(ctx, api, 'scale-two'),
            values = [4, 3.5, 1].map((v) => (v + shift) * scale),
            cut = values[0] - 0.75;
          coreText(ctx, api, 'Same additive margin: 0.75', 150, 300, 34, themeColors.yellow);
          coreText(
            ctx,
            api,
            'transform: ' + (scale > 1 ? '× ' + scale.toFixed(2) : '+ ' + shift.toFixed(2)),
            1350,
            300,
            31,
            themeColors.ink,
          );
          const plot = teaching.axes({
            x: 520,
            y: 430,
            width: 1000,
            height: 350,
            xDomain: [values[0] - 6, values[0] + 1],
            yDomain: [0, 3],
            xTicks: [values[0] - 3, values[0]],
            formatX: (v) => v.toFixed(0),
            yTicks: [],
            xLabel: 'score after stated transform',
            fontSize: 25,
            color: themeColors.muted,
          });
          values.forEach((v, i) => {
            const pt = plot.point(v, 2.5 - i);
            coreText(ctx, api, ['A', 'B', 'C'][i], 160, pt.y + 12, 34, themeColors.ink);
            dot(ctx, api, pt.x, pt.y, 12, v >= cut ? themeColors.green : themeColors.muted);
            if (cueVisible(ctx, api, 'margin-premises'))
              coreText(
                ctx,
                api,
                v.toFixed(2),
                1630,
                pt.y + 10,
                29,
                v >= cut ? themeColors.green : themeColors.muted,
              );
          });
          if (cueVisible(ctx, api, 'margin-cut')) {
            const pt = plot.point(cut, 0);
            line(ctx, api, pt.x, 370, pt.x, 820, themeColors.yellow, 3);
            coreText(ctx, api, 'top − 0.75', pt.x, 920, 29, themeColors.yellow, 'center');
            coreText(
              ctx,
              api,
              marginSelection(values, 0.75)
                .map((i) => ['A', 'B', 'C'][i])
                .join(' + ') + ' kept',
              960,
              980,
              35,
              themeColors.green,
              'center',
            );
          }
        } else {
          coreText(ctx, api, 'Held-out event: passage relevance', 150, 300, 35, themeColors.ink);
          coreText(
            ctx,
            api,
            'Assigned probability 0.8 · 10 cases',
            150,
            410,
            33,
            themeColors.yellow,
          );
          if (cueVisible(ctx, api, 'calibration-bin'))
            for (let i = 0; i < 10; i++) {
              const relevant = cueVisible(ctx, api, 'observed-eight') && i < 8;
              dot(
                ctx,
                api,
                270 + (i % 5) * 310,
                580 + Math.floor(i / 5) * 150,
                35,
                relevant ? themeColors.green : themeColors.muted,
              );
              coreText(
                ctx,
                api,
                String(i + 1),
                270 + (i % 5) * 310,
                590 + Math.floor(i / 5) * 150,
                25,
                themeColors.ink,
                'center',
              );
            }
          if (cueVisible(ctx, api, 'observed-eight'))
            coreText(
              ctx,
              api,
              'Observed frequency = 8 / 10 = 0.8',
              960,
              880,
              36,
              themeColors.green,
              'center',
            );
          if (cueVisible(ctx, api, 'calibration-splits'))
            coreText(
              ctx,
              api,
              'Scorer training → independent development → untouched test',
              960,
              980,
              30,
              themeColors.cyan,
              'center',
            );
        }
      },
    );
    caption(
      ctx,
      api,
      'Ordering, admission and a calibrated probability measure different outcomes.',
    );
  }
}
export default {
  id: 'calibration-gates',
  draw: drawCalibrationGates,
  cues: [
    'two-query-scores',
    'absolute-gate',
    'rank-forced',
    'margin-premises',
    'margin-cut',
    'shift-ten',
    'scale-two',
    'calibration-bin',
    'observed-eight',
    'calibration-splits',
  ],
};
