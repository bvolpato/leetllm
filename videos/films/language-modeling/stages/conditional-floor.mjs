import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedEquation,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedRail,
  drawExtendedText,
  formatLanguage,
} from '../defaults.mjs';
export function drawConditionalFloor(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('conditional-floor', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('conditional-floor-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Conflicting observations share one prediction'
        : 'One additional observation changes the optimum',
    );
    const counts = currentBeat === 0 ? [1, 1] : [2, 1],
      optimal = counts[0] / (counts[0] + counts[1]);
    drawExtendedCell(
      ctx,
      api,
      currentBeat === 0 ? 'test returns' : 'function returns',
      140,
      370,
      560,
      80,
      themeColors.cyan,
      32,
    );
    const reveal = currentBeat === 0 ? S(0, 3) : S(1, 1),
      prob = 0.95 + (0.5 - 0.95) * reveal;
    const p = currentBeat === 0 ? prob : 0.95 + (optimal - 0.95) * reveal;
    drawExtendedRail(
      ctx,
      api,
      140,
      540,
      560,
      [p, 1 - p],
      currentBeat === 0 ? ['result', 'error'] : ['value', 'exception'],
      [themeColors.green, themeColors.pink],
    );
    drawExtendedText(
      ctx,
      api,
      'observed counts ' + counts.join(' / '),
      420,
      720,
      31,
      themeColors.ink,
      'center',
    );
    const plot = api.teaching.axes({
      x: 920,
      y: 355,
      width: 800,
      height: 480,
      xDomain: [0, 1],
      yDomain: [0, 4],
      xTicks: [0, 0.5, 1],
      yTicks: [0, 1, 2, 3, 4],
      xLabel: 'probability of first outcome',
      yLabel: 'mean NLL (nats)',
      fontSize: 23,
      color: themeColors.muted,
    });
    const f = (x) =>
      -(counts[0] * Math.log(x) + counts[1] * Math.log(1 - x)) / (counts[0] + counts[1]);
    api.teaching.curve({
      plot,
      points: Array.from(
        {
          length: 99,
        },
        (_, i) => ({
          x: (i + 1) / 100,
          y: Math.min(4, f((i + 1) / 100)),
        }),
      ),
      color: themeColors.blue,
      width: 3,
    });
    const at = plot.point(p, Math.min(4, f(p)));
    api.circle(ctx, at.x, at.y, 9, themeColors.yellow, themeColors.yellow, 1);
    if (reveal === 1) {
      drawExtendedText(
        ctx,
        api,
        'best split ' +
          formatLanguage(ctx, api, optimal) +
          ' / ' +
          formatLanguage(ctx, api, 1 - optimal),
        420,
        815,
        31,
        themeColors.green,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'prefix NLL ' + formatLanguage(ctx, api, f(optimal), 3),
        1320,
        960,
        31,
        themeColors.green,
        'center',
      );
    }
    if (currentBeat === 0 && E(0, 4))
      drawExtendedEquation(
        ctx,
        api,
        String.raw`\inf L={2\ln2\over6}\approx0.231`,
        420,
        940,
        37,
        themeColors.yellow,
      );
    if (currentBeat === 1 && E(1, 3))
      drawExtendedText(
        ctx,
        api,
        'classification error 1/3',
        420,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    drawExtendedFoot(
      ctx,
      api,
      currentBeat === 0
        ? 'The four unambiguous observations can approach zero loss'
        : 'Loss and classification error measure different properties',
    );
  });
}
export default {
  id: 'conditional-floor',
  draw: drawConditionalFloor,
  cues: [
    'conditional-floor-b1',
    'conditional-floor-voice-1',
    'conditional-floor-step-0-1',
    'conditional-floor-step-0-2',
    'conditional-floor-step-0-3',
    'conditional-floor-step-0-4',
    'conditional-floor-step-0-5',
    'conditional-floor-b2',
    'conditional-floor-voice-2',
    'conditional-floor-step-1-1',
    'conditional-floor-step-1-2',
    'conditional-floor-step-1-3',
    'conditional-floor-step-1-4',
  ],
};
