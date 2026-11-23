import { EXAMPLE } from '../fixtures.mjs';
import { forward } from '../model.mjs';
import { text, math, line, arrow, fade, matrix } from '../defaults.mjs';
export function drawDenseUpdate(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress2, start, end);
  ctx.save();
  {
    const f = forward(2);
    const baseP = api.focus.progress('dense-base-output', stage(0, 0.08, 0.44));
    const correctionP = api.focus.progress('dense-correction-output', stage(0, 0.44, 0.83));
    const sumP = api.focus.progress('dense-output-sum', stage(0, 0.83, 0.96));
    const progress = beat > 0 || sumP >= 0.4 ? 1 : 0.5 * baseP;
    text(ctx, api, 'SAME INPUT  x = [2, 1]', 235, 285, 34, themeColors.cyan, 'left', 'mono');
    text(ctx, api, 'SUPPLIED CORRECTION · exact arithmetic', 1020, 285, 27, themeColors.muted);
    const plot = api.teaching.axes({
      x: 200,
      y: 350,
      width: 650,
      height: 565,
      xDomain: [-1, 8],
      yDomain: [-1, 14],
      equalUnits: true,
      xTicks: [0, 2, 4, 6, 8],
      yTicks: [0, 4, 8, 12],
      fontSize: 25,
    });
    api.focus.target('frozen-base', () => {
      text(ctx, api, 'frozen base', 1120, 350, 28, themeColors.blue, 'center');
      matrix(ctx, api, EXAMPLE.W, 1050, 395, 70, themeColors.blue);
    });
    api.focus.target('trainable-correction', () => {
      text(ctx, api, 'trainable correction', 1510, 350, 28, themeColors.yellow, 'center');
      matrix(ctx, api, f.update, 1440, 395, 70, themeColors.yellow);
    });
    api.teaching.vectorAccumulation({
      terms: [
        {
          id: 'dense-base-vector',
          label: 'W₀x',
          weight: 1,
          values: f.base,
          color: themeColors.blue,
        },
        {
          id: 'dense-correction-vector',
          label: 'ΔWx',
          weight: 1,
          values: f.correction,
          color: themeColors.yellow,
        },
      ],
      progress,
      plot,
      ledger: {
        x: 1010,
        y: 605,
        width: 750,
        height: 275,
      },
      fontSize: 30,
      color: themeColors.green,
      completedOpacity: 0.65,
      totalLabel: 'Same-input output',
      totalTarget: 'dense-output',
      revealTotal: beat > 0 || sumP >= 0.999,
    });
    if (beat === 0 && correctionP > 0 && sumP < 0.4) {
      const move = api.phase(sumP, 0, 0.4);
      const start = f.base.map((value) => value * move);
      const end = start.map((value, i) => value + f.correction[i] * correctionP);
      api.focus.target('dense-correction-vector', () =>
        arrow(ctx, api, plot.point(...start), plot.point(...end), themeColors.yellow, 5),
      );
    }
    api.focus.target('sum-identity', () =>
      math(ctx, api, 'h=W_0x+\\Delta Wx', 960, 982, 46, themeColors.ink, 'center'),
    );
    if (beat >= 1) {
      text(ctx, api, 'base stays fixed', 715, 505, 26, themeColors.blue);
    }
    if (beat >= 2) {
      const rankP = api.focus.progress('dense-update-b3-1', stage(2));
      fade(ctx, api, rankP, () => {
        math(ctx, api, '\\Delta W=2BA', 1510, 590, 32, themeColors.yellow, 'center');
        const o = plot.point(0, 0),
          v = plot.point(1, 2),
          opposite = plot.point(-0.5, -1);
        line(ctx, api, opposite, plot.point(6, 12), '#ffd75e66', 2);
        arrow(ctx, api, o, v, themeColors.yellow, 5);
        text(ctx, api, 'columns: [1, 2] and −[1, 2]', 1018, 920, 28, themeColors.yellow);
      });
    }
  }
  ctx.restore();
}
export default {
  id: 'dense-update',
  draw: drawDenseUpdate,
  cues: [
    'dense-update-b1-1',
    'dense-update-b1-2',
    'dense-base-output',
    'dense-correction-output',
    'dense-output-sum',
    'dense-update-b2-1',
    'dense-update-b2-2',
    'dense-update-b3-1',
  ],
};
