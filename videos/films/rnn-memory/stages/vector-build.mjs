import { bound, mv } from '../arithmetic.mjs';
import { eventNames, inputs, states, wh, wx } from '../fixtures.mjs';
import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatVector,
  incidentMath,
  incidentMatrix,
  incidentNote,
  incidentRoute,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawVectorBuild(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('vector-build', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  const events = (y = 282, active = -1, scalarValues = false) => {
    eventNames.forEach((name, i) => {
      const x = 440 + i * 510;
      api.circle(ctx, x, y, 28, active === i ? colors[i] : themeColors.panel, colors[i], 3);
      incidentText(
        ctx,
        api,
        i + 1,
        x,
        y + 10,
        26,
        active === i ? themeColors.panel : colors[i],
        'center',
      );
      incidentText(ctx, api, name, x, y + 60, 27, colors[i], 'center');
      incidentText(
        ctx,
        api,
        scalarValues ? 'signal ' + inputs[i] : ['[1, 0, 0]', '[0, 1, 0]', '[0, 0, 1]'][i],
        x,
        y + 101,
        26,
        themeColors.muted,
        'center',
      );
      if (i < 2) strokeArrow(ctx, api, x + 85, y, x + 420, y, themeColors.muted, 2);
    });
  };
  api.focus.target('vector-build-operation', () => {
    const step = f.vectorStep;
    events(267, step);
    incidentText(ctx, api, 'Input map  Wₓ', 320, 440, 28, themeColors.blue, 'center');
    incidentMatrix(ctx, api, wx, 205, 466, themeColors.blue, 62);
    incidentText(ctx, api, 'Recurrent map  Wₕ', 810, 440, 28, themeColors.pink, 'center');
    incidentMatrix(ctx, api, wh, 735, 466, themeColors.pink, 62);
    if (currentBeat === 0) {
      incidentText(
        ctx,
        api,
        'Current one-hot selects one column',
        1380,
        470,
        29,
        themeColors.cyan,
        'center',
      );
      const stage = Math.min(2, Math.floor(3 * cue('vector-columns', progress)));
      const from = {
          x: 236 + stage * 69,
          y: 610,
        },
        to = {
          x: 1260,
          y: 600,
        };
      incidentRoute(
        ctx,
        api,
        from,
        to,
        bound((cue('vector-columns', progress) * 3) % 1),
        themeColors.blue,
      );
      incidentMatrix(
        ctx,
        api,
        wx.map((row) => [row[stage]]),
        1240,
        535,
        themeColors.blue,
        72,
      );
      incidentText(ctx, api, eventNames[stage], 1440, 620, 29, colors[stage]);
      incidentMath(
        ctx,
        api,
        String.raw`\mathbb R^3\ \longrightarrow\ \mathbb R^2`,
        960,
        845,
        44,
        themeColors.ink,
      );
      incidentNote(
        ctx,
        api,
        'The same two rows build two coordinates at every event. Biases = [0, 0].',
      );
    } else {
      const input = wx.map((row) => row[step]),
        old = states[step],
        memory = mv(wh, old),
        output = states[step + 1];
      const resultId =
        step === 0
          ? 'vector-first-reveal'
          : step === 1
            ? 'vector-second-reveal'
            : 'vector-third-reveal';
      const memoryReady = started(
        step === 0
          ? 'vector-first-memory'
          : step === 1
            ? 'vector-second-memory'
            : 'vector-third-memory',
        progress > 0.25,
      );
      incidentText(ctx, api, 'selected input column', 1260, 455, 26, themeColors.blue, 'center');
      incidentMatrix(
        ctx,
        api,
        input.map((value) => [value]),
        1220,
        485,
        themeColors.blue,
        62,
      );
      incidentText(
        ctx,
        api,
        'old h = ' + formatVector(ctx, api, old),
        805,
        660,
        26,
        themeColors.pink,
        'center',
      );
      strokeArrow(ctx, api, 870, 590, 1040, 690, themeColors.pink);
      incidentText(ctx, api, 'Wₕh', 1055, 725, 30, themeColors.pink, 'center');
      if (memoryReady)
        incidentText(
          ctx,
          api,
          formatVector(ctx, api, memory),
          1320,
          725,
          36,
          themeColors.pink,
          'center',
        );
      strokeLine(ctx, api, 1190, 756, 1505, 756, themeColors.border, 2);
      incidentText(ctx, api, '+ then tanh', 1000, 825, 27, themeColors.muted, 'center');
      if (started(resultId, progress > 0.7)) {
        strokeArrow(ctx, api, 1350, 788, 1350, 851, themeColors.green);
        incidentText(
          ctx,
          api,
          'h' + (step + 1) + ' = ' + formatVector(ctx, api, output),
          1340,
          919,
          42,
          themeColors.green,
          'center',
        );
      } else
        incidentText(
          ctx,
          api,
          'h' + (step + 1) + ' = ?',
          1340,
          919,
          42,
          themeColors.muted,
          'center',
        );
      incidentNote(
        ctx,
        api,
        'Full precision passes to the next step. Displayed decimals are rounded.',
      );
    }
  });
}
export default {
  id: 'vector-build',
  draw: drawVectorBuild,
  cues: [
    'vector-build-0',
    'vector-columns',
    'vector-build-1',
    'vector-second-reveal',
    'vector-first-memory',
    'vector-first-reveal',
    'vector-second-start',
    'vector-second-memory',
    'vector-build-2',
    'vector-third-reveal',
    'vector-third-memory',
  ],
};
