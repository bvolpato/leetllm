import { longContextModel } from '../construction.mjs';
import {
  contextText,
  equation,
  footer,
  modelTarget,
  radialArrow,
  ring,
  valueBar,
} from '../defaults.mjs';
export function drawPositionDials(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('position-dials', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    if (currentBeat === 0) {
      contextText(ctx, api, 'Query and key dimension pairs', 960, 270, 38, themeColors.cyan);
      [1, 0.2, 0.04].forEach((frequency, i) => {
        const x = 420 + i * 540;
        ring(ctx, api, x, 560, 160, themeColors.muted);
        modelTarget(ctx, api, 'position-dials', () => {
          radialArrow(ctx, api, x, 560, 146, progress * 6 * frequency, themeColors.blue);
          radialArrow(ctx, api, x, 560, 115, progress * 3 * frequency, themeColors.yellow);
        });
        contextText(ctx, api, `ω = ${frequency}`, x, 805, 38, themeColors.ink);
      });
      footer(
        ctx,
        api,
        'Position × frequency sets each rotation · relative angles enter query–key scores',
      );
    } else if (currentBeat === 1) {
      contextText(
        ctx,
        api,
        'Uniform interpolation keeps the coordinate inside the training range',
        960,
        275,
        34,
        themeColors.cyan,
      );
      api.line(ctx, 250, 450, 1690, 450, themeColors.blue, 4);
      api.line(ctx, 250, 730, 1690, 730, themeColors.green, 4);
      contextText(ctx, api, 'extended: 0 … 32,768', 960, 385, 36, themeColors.blue);
      contextText(ctx, api, 'trained: 0 … 4,096', 960, 845, 36, themeColors.green);
      const x = 250 + 1440 * 0.5;
      api.circle(ctx, x, 450, 12, themeColors.yellow, themeColors.yellow, 2);
      api.arrow(ctx, x, 475, x, 700, themeColors.yellow, 5);
      contextText(ctx, api, '16,384', x + 165, 510, 42, themeColors.yellow);
      contextText(ctx, api, String(m.mapped), x, 785, 42, themeColors.yellow);
      modelTarget(ctx, api, 'position-dials', () =>
        equation(
          ctx,
          api,
          String.raw`m'=m\,L_{train}/L_{target}=m/8`,
          960,
          940,
          45,
          themeColors.ink,
        ),
      );
    } else {
      contextText(ctx, api, 'Angular step after extension', 960, 280, 38, themeColors.cyan);
      ['fast', 'middle', 'slow'].forEach((name, i) => {
        const x = 400 + i * 560;
        valueBar(ctx, api, x - 100, 380, 200, 1, 1, themeColors.muted, 50);
        valueBar(ctx, api, x - 100, 550, 200, 0.125, 1, themeColors.blue, 50);
        modelTarget(ctx, api, 'position-dials', () =>
          valueBar(ctx, api, x - 100, 720, 200, m.step[i], 1, themeColors.green, 50),
        );
        contextText(ctx, api, name, x, 865, 35, themeColors.ink);
      });
      contextText(ctx, api, 'original', 160, 420, 28, themeColors.muted);
      contextText(ctx, api, 'uniform', 160, 590, 28, themeColors.blue);
      contextText(ctx, api, 'by parts', 160, 760, 28, themeColors.green);
      footer(
        ctx,
        api,
        'Middle ramp is schematic · YaRN also scales attention logits · evaluate the checkpoint',
      );
    }
  }
}
export default {
  id: 'position-dials',
  draw: drawPositionDials,
  cues: ['position-dials-0', 'position-dials-1', 'position-dials-2'],
};
