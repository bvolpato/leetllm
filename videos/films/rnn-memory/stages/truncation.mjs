import { norm } from '../arithmetic.mjs';
import { eventNames, inputs, scalar } from '../fixtures.mjs';
import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  formatVector,
  incidentNote,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawTruncation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('truncation', state),
    { b: currentBeat, p: progress2, cue, started } = f;
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
  api.focus.target('truncation-operation', () => {
    if (currentBeat < 2) {
      events(270, -1, true);
      const xs = [280, 800, 1320];
      scalar.slice(1).forEach((value, i) => {
        incidentText(
          ctx,
          api,
          'h' + (i + 1) + ' = ' + formatNumber(ctx, api, value, 6),
          xs[i],
          490,
          35,
          colors[i],
          'center',
        );
        if (i < 2)
          strokeArrow(ctx, api, xs[i] + 150, 475, xs[i + 1] - 150, 475, themeColors.muted, 3);
      });
      const cut = started('detach-cut', progress2 > 0.35) || currentBeat > 0;
      if (cut) {
        strokeLine(ctx, api, 1060, 440, 1060, currentBeat === 0 ? 650 : 850, themeColors.pink, 4);
        incidentText(ctx, api, 'detach h₂', 1060, 420, 30, themeColors.pink, 'center');
      }
      if (currentBeat === 0) {
        if (started('detach-forward', progress2 > 0.6))
          incidentText(
            ctx,
            api,
            'Same final numerical value: ' + formatNumber(ctx, api, scalar[3], 6),
            960,
            715,
            43,
            themeColors.green,
            'center',
          );
        incidentNote(
          ctx,
          api,
          'Weights held fixed · no optimizer step between chunks · detaching preserves the forward state.',
        );
      } else {
        incidentText(ctx, api, 'No cut: ∂h₃/∂x', 150, 590, 27, themeColors.ink);
        incidentText(ctx, api, 'After detach:', 150, 850, 27, themeColors.pink);
        m.inputGradient.forEach((value, i) => {
          incidentText(
            ctx,
            api,
            formatNumber(ctx, api, value, 6),
            xs[i],
            665,
            33,
            themeColors.ink,
            'center',
          );
          incidentText(
            ctx,
            api,
            i < 2 ? '0' : formatNumber(ctx, api, value, 6),
            xs[i],
            790,
            36,
            i < 2 ? themeColors.pink : themeColors.green,
            'center',
          );
          if (i < 2) strokeLine(ctx, api, xs[i] - 75, 695, xs[i] + 75, 755, themeColors.pink, 3);
        });
        if (started('detach-weight', progress2 > 0.5))
          incidentText(
            ctx,
            api,
            'Shared weight gradient  ' +
              formatNumber(ctx, api, m.weightGradient, 6) +
              ' → ' +
              formatNumber(ctx, api, m.weightTerms[2], 6),
            960,
            923,
            35,
            themeColors.yellow,
            'center',
          );
        incidentNote(
          ctx,
          api,
          'The last local weight use still learns. Resetting is a different forward operation.',
        );
      }
    } else {
      const origin = {
          x: 820,
          y: 610,
        },
        scale = 6,
        raw = m.rawGradient,
        clipped = m.clippedGradient;
      strokeArrow(ctx, api, 300, 610, 1530, 610, themeColors.muted, 2);
      strokeArrow(ctx, api, 820, 905, 820, 465, themeColors.muted, 2);
      api.circle(ctx, origin.x, origin.y, 5 * scale, themeColors.panel, themeColors.green, 3);
      const progress = cue('clip-rescale', progress2),
        value = raw.map((v, i) => api.lerp(v, clipped[i], progress));
      strokeArrow(
        ctx,
        api,
        origin.x,
        origin.y,
        origin.x + raw[0] * scale,
        origin.y - raw[1] * scale,
        themeColors.border,
        3,
      );
      strokeArrow(
        ctx,
        api,
        origin.x,
        origin.y,
        origin.x + value[0] * scale,
        origin.y - value[1] * scale,
        themeColors.yellow,
        5,
      );
      incidentText(
        ctx,
        api,
        'raw ' + formatVector(ctx, api, raw) + '  norm ' + formatNumber(ctx, api, norm(raw)),
        960,
        340,
        33,
        themeColors.pink,
        'center',
      );
      incidentText(
        ctx,
        api,
        'common scale = 5 / ' + formatNumber(ctx, api, norm(raw)),
        960,
        417,
        30,
        themeColors.cyan,
        'center',
      );
      if (started('clip-result', progress2 > 0.5))
        incidentText(
          ctx,
          api,
          'clipped ' + formatVector(ctx, api, clipped) + '  norm 5',
          960,
          944,
          37,
          themeColors.green,
          'center',
        );
      incidentText(ctx, api, 'radius 5', origin.x - 170, origin.y + 68, 26, themeColors.green);
      incidentNote(
        ctx,
        api,
        'Same direction, bounded norm. Nonfinite gradients require diagnosis before rescaling.',
      );
    }
  });
}
export default {
  id: 'truncation',
  draw: drawTruncation,
  cues: [
    'truncation-0',
    'detach-cut',
    'detach-forward',
    'truncation-1',
    'detach-weight',
    'truncation-2',
    'clip-rescale',
    'clip-result',
  ],
};
