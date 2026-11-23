import { abClamp } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { abExtendedScenes, planningPower } from '../model.mjs';
import {
  drawExpansionLine,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawPowerAndDecision(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('power-and-decision')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'power-and-decision-mechanism', () => {
    const model = planningPower(9246),
      pdf = (x, mean, sd) =>
        Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    const chart = drawExpansionPlot(
      ctx,
      api,
      230,
      390,
      1440,
      390,
      [-0.025, 0.065],
      [0, 65],
      [-0.02, 0, 0.02, 0.04, 0.06],
      [0, 20, 40, 60],
      'estimated absolute lift',
      'normal density',
    );
    const curve = (mean, color) => {
      const points = Array.from(
        {
          length: 181,
        },
        (_, i) => {
          const x = -0.025 + (i * 0.09) / 180;
          return chart.point(x, pdf(x, mean, model.alternativeSe));
        },
      );
      drawExpansionPath(ctx, api, points, color, 4, chart.bounds);
    };
    curve(0, themeColors.blue);
    curve(0.02, themeColors.cyan);
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Null: effect 0 · planning alternative: effect +2 pp',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      for (const sign of [-1, 1]) {
        const x = chart.point(sign * model.critical, 0).x;
        drawExpansionLine(
          ctx,
          api,
          {
            x,
            y: chart.bounds.y,
          },
          {
            x,
            y: chart.bounds.y + chart.bounds.height,
          },
          themeColors.pink,
          3,
        );
      }
      writeExpansionText(
        ctx,
        api,
        'Reject in either tail · Type I budget 5%',
        960,
        920,
        35,
        themeColors.pink,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Normal planning approximation · an MDE is an alternative, not a hard lower detection boundary.',
      );
    } else if (beat === 1) {
      writeExpansionText(
        ctx,
        api,
        'The shortcut is approximate, even under this planning model',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const boundary = chart.point(model.critical, 0).x;
      drawExpansionLine(
        ctx,
        api,
        {
          x: boundary,
          y: chart.bounds.y,
        },
        {
          x: boundary,
          y: chart.bounds.y + chart.bounds.height,
        },
        themeColors.yellow,
        4,
      );
      const bars = 100;
      for (let i = 0; i < bars; i++) {
        const x = -0.025 + ((i + 0.5) * 0.09) / bars;
        if (Math.abs(x) > model.critical) {
          const a = chart.point(x, 0),
            b = chart.point(x, pdf(x, 0.02, model.alternativeSe));
          drawExpansionLine(ctx, api, a, b, themeColors.cyan, 9);
        }
      }
      if (abStarted(state, 'power-shortcut', progress > 0.3))
        writeExpansionText(
          ctx,
          api,
          'Shortcut n / arm: 9,246',
          610,
          920,
          33,
          themeColors.yellow,
          'center',
        );
      if (abStarted(state, 'power-fuller', progress > 0.55))
        writeExpansionText(
          ctx,
          api,
          'Fuller power: ' + (model.power * 100).toFixed(1) + '% · need 9,336 for 80%',
          1350,
          920,
          31,
          themeColors.cyan,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Shaded alternative-distribution mass is rejection probability, including both tails.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'A separate observed-lift floor changes launch probability',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const threshold = chart.point(0.02, 0).x;
      drawExpansionLine(
        ctx,
        api,
        {
          x: threshold,
          y: chart.bounds.y,
        },
        {
          x: threshold,
          y: chart.bounds.y + chart.bounds.height,
        },
        themeColors.yellow,
        5,
      );
      writeExpansionText(
        ctx,
        api,
        'Declared observed floor +2 pp = true mean in this example',
        960,
        900,
        33,
        themeColors.yellow,
        'center',
      );
      if (abStarted(state, 'power-launch', progress > 0.4))
        writeExpansionText(
          ctx,
          api,
          'About half the symmetric estimates exceed that floor',
          960,
          965,
          34,
          themeColors.pink,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Every guardrail is an additional launch condition. Detection power does not equal launch probability.',
      );
    }
  });
  return;
}
export default {
  id: 'power-and-decision',
  draw: drawPowerAndDecision,
  cues: [
    'power-and-decision-step-1',
    'power-and-decision-step-2',
    'power-shortcut',
    'power-fuller',
    'power-and-decision-step-3',
    'power-launch',
  ],
};
