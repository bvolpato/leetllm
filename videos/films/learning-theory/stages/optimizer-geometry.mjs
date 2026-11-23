import { cueEnded, equation, line, text } from '../defaults.mjs';
export function drawOptimizerGeometry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cue = (id) => state.cues?.[id],
    progress = (id) =>
      cue(id)?.phase === 'after' ? 1 : cue(id)?.phase === 'before' ? 0 : (cue(id)?.progress ?? 0);
  const main = () => {
    const solutions = [
      [0.2, 0.4],
      [-1.8, 1.4],
      [1 / 17, 8 / 17],
    ];
    if (currentBeat >= 2) {
      const { C } = api;
      const names = ['Zero start', 'Null-space start', 'Preconditioned'];
      const headings = ['Update rule', 'Weights', 'Train (1, 2)', 'New (1, 0)'];
      const columns = [325, 765, 1210, 1590];
      headings.forEach((s, i) => text(ctx, api, s, columns[i], 328, 39, C.muted, 'center'));
      solutions.forEach(([a, b], i) => {
        const y = 454 + i * 148;
        const color = [C.blue, C.pink, C.green][i];
        const weight = (value) => (i === 2 ? Math.round(17 * value) + '/17' : String(value));
        text(ctx, api, names[i], columns[0], y, 39, color, 'center');
        text(
          ctx,
          api,
          '(' + weight(a) + ', ' + weight(b) + ')',
          columns[1],
          y,
          39,
          color,
          'center',
        );
        text(ctx, api, (a + 2 * b).toFixed(0), columns[2], y, 43, C.ink, 'center');
        text(
          ctx,
          api,
          cueEnded(state, 'new-predictions') ? weight(a) : '?',
          columns[3],
          y,
          43,
          C.yellow,
          'center',
        );
      });
      text(
        ctx,
        api,
        'Prediction = input₁ × weight₁ + input₂ × weight₂',
        960,
        954,
        39,
        C.muted,
        'center',
      );
      return;
    }
    const plot = api.teaching.axes({
      x: 300,
      y: 335,
      width: 1100,
      height: 540,
      xDomain: [-2.3, 1.1],
      yDomain: [-0.2, 1.8],
      xLabel: 'weight w1',
      yLabel: 'weight w2',
      xTicks: [-2, -1, 0, 1],
      yTicks: [0, 0.5, 1, 1.5],
      fontSize: 29,
    });
    const pts = [
      {
        x: -2.3,
        y: 1.65,
      },
      {
        x: 1.1,
        y: -0.05,
      },
    ];
    api.teaching.curve({
      plot,
      points: pts,
      color: themeColors.muted,
      width: 3,
      progress: 1,
    });
    const fixtures = [
      {
        start: [0, 0],
        end: solutions[0],
        color: themeColors.blue,
        name: 'zero-init GD',
      },
      {
        start: [-2, 1],
        end: solutions[1],
        color: themeColors.pink,
        name: 'null-space start',
      },
      {
        start: [0, 0],
        end: solutions[2],
        color: themeColors.green,
        name: 'preconditioned',
      },
    ];
    fixtures.forEach((f, i) => {
      const q = progress(
        ['optimizer-zero-update', 'optimizer-null-update', 'optimizer-preconditioned-update'][i],
      );
      if (q === 0) return;
      const a = plot.point(...f.start),
        e = plot.point(
          f.start[0] + (f.end[0] - f.start[0]) * q,
          f.start[1] + (f.end[1] - f.start[1]) * q,
        );
      line(ctx, api, a.x, a.y, e.x, e.y, f.color, 7);
      api.circle(ctx, e.x, e.y, 13, f.color);
      text(ctx, api, f.name, 1490, 400 + i * 145, 29, f.color);
      text(
        ctx,
        api,
        `(${[f.start[0] + (f.end[0] - f.start[0]) * q, f.start[1] + (f.end[1] - f.start[1]) * q].map((v) => v.toFixed(3)).join(', ')})`,
        1490,
        450 + i * 145,
        29,
        themeColors.ink,
      );
    });
    equation(ctx, api, String.raw`w_1+2w_2=1`, 960, 1035, 55, themeColors.yellow);
  };
  // The cue target is the actual spatial construction for this scene.
  if (api.focus) api.focus.target(`${'optimizer-geometry'}-construction`, main);
  else main();
}
export default {
  id: 'optimizer-geometry',
  draw: drawOptimizerGeometry,
  cues: [
    'optimizer-geometry-voice-1',
    'optimizer-zero-update',
    'optimizer-geometry-voice-2',
    'optimizer-null-update',
    'optimizer-preconditioned-update',
    'optimizer-geometry-voice-3',
    'new-predictions',
  ],
};
