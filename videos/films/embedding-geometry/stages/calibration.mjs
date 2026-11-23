import { calibrationRankingFrame, calibrationResult } from '../model.mjs';
import { geometryText, heading, line } from '../defaults.mjs';
export function drawCalibration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    const started = state.cues?.['calibration-direction-start'];
    if (currentBeat === 1 && started && started.phase !== 'before') {
      const f = calibrationRankingFrame(state);
      api.focus.target('calibration-rank', () => {
        heading(ctx, api, 'Separate direction test · original unit rows · query [1,0]');
        const plot = api.teaching.axes({
          x: 220,
          y: 370,
          width: 800,
          height: 470,
          xDomain: [0.97, 1.01],
          yDomain: [-0.01, 0.06],
          xTicks: [0.98, 1],
          yTicks: [0, 0.02, 0.04, 0.06],
          equalUnits: true,
          xLabel: 'reconstructed x',
          yLabel: '',
        });
        geometryText(
          ctx,
          api,
          'Endpoint zoom · cosine re-normalizes each reconstructed row',
          960,
          320,
          25,
          themeColors.muted,
          'center',
        );
        const qp = plot.point(1, 0);
        api.circle(ctx, qp.x, qp.y, 5, themeColors.cyan);
        geometryText(ctx, api, 'Q', qp.x - 50, qp.y + 55, 24, themeColors.cyan);
        f.rows.forEach((row, i) => {
          const color = i ? themeColors.pink : themeColors.blue,
            z = plot.point(...row);
          api.circle(ctx, z.x, z.y, i ? 8 : 14, color);
          geometryText(
            ctx,
            api,
            i ? 'B' : 'A',
            z.x + (i ? 30 : -30),
            z.y + (i ? 22 : -20),
            27,
            color,
            'center',
          );
          const y = 410 + i * 245;
          geometryText(
            ctx,
            api,
            (i ? 'B' : 'A') +
              ' original [' +
              f.original[i].map((v) => v.toFixed(6)).join(', ') +
              ']',
            1480,
            y,
            25,
            color,
            'center',
          );
          geometryText(
            ctx,
            api,
            'current [' + row.map((v) => v.toFixed(6)).join(', ') + ']',
            1480,
            y + 75,
            27,
            color,
            'center',
          );
          geometryText(
            ctx,
            api,
            'cosine ' + f.scores[i].toFixed(6),
            1480,
            y + 150,
            33,
            color,
            'center',
          );
        });
        geometryText(
          ctx,
          api,
          f.stage === 'original'
            ? 'Original unit directions'
            : (f.stage === 'coarse' ? 'Coarse bound 25' : 'Fine bound 1') +
                ' · reconstructed coordinates ' +
                f.count +
                '/4',
          960,
          950,
          31,
          themeColors.yellow,
          'center',
        );
        geometryText(
          ctx,
          api,
          f.winner === null
            ? 'Winner pending completed clause'
            : f.stage === 'coarse'
              ? 'Identical rows · first-row tie → A (wrong)'
              : 'B keeps the closer direction',
          960,
          1000,
          35,
          f.winner === 0
            ? themeColors.pink
            : f.winner === 1
              ? themeColors.green
              : themeColors.muted,
          'center',
        );
        geometryText(
          ctx,
          api,
          'Separate ordinary-value audit retains MAE 0.0483/0.0019 and outlier error 24',
          960,
          1060,
          24,
          themeColors.muted,
          'center',
        );
      });
      return;
    }
    heading(ctx, api, '101 ordinary coordinates −1..1 · separate outlier 25');
    const q = cueProgress(),
      models = [calibrationResult(25), calibrationResult(1)];
    models.forEach((m, j) => {
      const x = 230 + j * 820,
        a = api.teaching.axes({
          x,
          y: 370,
          width: 630,
          height: 380,
          xDomain: [-1.1, 1.1],
          yDomain: [-1.1, 1.1],
          xTicks: [-1, 0, 1],
          yTicks: [-1, 0, 1],
          equalUnits: true,
          xLabel: 'original',
          yLabel: '',
        });
      geometryText(
        ctx,
        api,
        'reconstructed · bound ' + [25, 1][j],
        x + 315,
        325,
        29,
        j ? themeColors.cyan : themeColors.pink,
        'center',
      );
      const n = currentBeat === 0 ? Math.floor(q * 101) : 101;
      for (let i = 0; i < n; i++) {
        const p = a.point(m.input[i], m.output[i]);
        api.circle(ctx, p.x, p.y, 3, j ? themeColors.cyan : themeColors.pink);
      }
      if (currentBeat > 0) {
        const yy = 885 + j * 85;
        geometryText(
          ctx,
          api,
          'bound ' + [25, 1][j] + ' MAE',
          230,
          yy + 25,
          28,
          j ? themeColors.cyan : themeColors.pink,
        );
        line(ctx, api, 650, yy + 15, 1550, yy + 15, themeColors.muted, 1);
        api.rect(ctx, 650, yy, (900 * m.mae) / 0.05, 30, j ? themeColors.cyan : themeColors.pink);
        geometryText(
          ctx,
          api,
          m.mae.toFixed(4),
          1650,
          yy + 27,
          31,
          j ? themeColors.cyan : themeColors.pink,
          'center',
        );
      }
    });
    if (currentBeat > 0)
      geometryText(
        ctx,
        api,
        'Outlier 25 clips to 1: absolute error 24 · held-out retrieval is a separate gate',
        960,
        1050,
        28,
        themeColors.yellow,
        'center',
      );
    return;
  }
  return;
}
export default {
  id: 'calibration',
  draw: drawCalibration,
  cues: [
    'calibration-direction-start',
    'calibration-direction-original',
    'calibration-direction-coarse',
    'calibration-direction-fine',
  ],
};
