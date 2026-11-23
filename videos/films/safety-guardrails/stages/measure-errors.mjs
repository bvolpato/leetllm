import { confusionMetrics, cueConfusionTrace, guardCue, guardDone } from '../model.mjs';
import { drawSafetyText } from '../defaults.mjs';
export function paintMeasureErrors(ctx, scene, state, api, themeColors, t, currentBeat) {
  const m = confusionMetrics(),
    trace = cueConfusionTrace(state);
  if (currentBeat < 2) {
    drawSafetyText(
      ctx,
      api,
      themeColors,
      '10,000 labeled safe requests',
      550,
      300,
      34,
      themeColors.green,
      'center',
    );
    drawSafetyText(
      ctx,
      api,
      themeColors,
      '100 labeled harmful requests',
      1390,
      300,
      34,
      themeColors.blue,
      'center',
    );
    [0, 1].forEach((group) => {
      const x = group ? 1115 : 275;
      for (let i = 0; i < 100; i++) {
        const known = i < (group ? trace.harmfulCount : trace.safeCount);
        const tone = !known
          ? themeColors.muted
          : group
            ? i < 90
              ? themeColors.blue
              : themeColors.pink
            : i < 99
              ? themeColors.green
              : themeColors.yellow;
        api.focus.target('labeled-populations', () =>
          api.rect(
            ctx,
            x + (i % 10) * 55,
            365 + Math.floor(i / 10) * 36,
            43,
            25,
            known ? tone : themeColors.panel,
            tone,
            3,
          ),
        );
      }
      drawSafetyText(
        ctx,
        api,
        themeColors,
        group ? 'Each cell = 1 request' : 'Each cell = 100 requests',
        x + 260,
        775,
        27,
        themeColors.muted,
        'center',
      );
    });
    if (currentBeat === 0)
      drawSafetyText(
        ctx,
        api,
        themeColors,
        'The labels establish two different denominators before the detector runs',
        960,
        865,
        31,
        themeColors.yellow,
        'center',
      );
    else {
      drawSafetyText(
        ctx,
        api,
        themeColors,
        'Safe blocked ' + trace.safeBlocked + ' / 10,000',
        550,
        835,
        31,
        themeColors.yellow,
        'center',
      );
      drawSafetyText(
        ctx,
        api,
        themeColors,
        'Harmful: blocked ' + trace.harmfulBlocked + ' · allowed ' + trace.harmfulAllowed,
        1390,
        835,
        28,
        themeColors.pink,
        'center',
      );
      api.focus.target('false-positive-rate', () =>
        trace.showFpr
          ? api.math(
              ctx,
              String.raw`\mathrm{FPR}=\frac{100}{10{,}000}=1\%`,
              550,
              925,
              40,
              themeColors.cyan,
              'center',
            )
          : drawSafetyText(
              ctx,
              api,
              themeColors,
              'FPR = safe blocks / safe requests',
              550,
              925,
              28,
              themeColors.muted,
              'center',
            ),
      );
      api.focus.target('false-negative-rate', () =>
        trace.showFnr
          ? api.math(
              ctx,
              String.raw`\mathrm{FNR}=\frac{10}{100}=10\%`,
              1390,
              925,
              40,
              themeColors.cyan,
              'center',
            )
          : drawSafetyText(
              ctx,
              api,
              themeColors,
              'FNR = harmful escapes / harmful requests',
              1390,
              925,
              26,
              themeColors.muted,
              'center',
            ),
      );
    }
  } else {
    const safe = m.falsePositive,
      harmful = m.truePositive,
      total = safe + harmful;
    const join = guardCue(state, 'measure-errors-b3-1', 2);
    const revealed = guardDone(state, 'measure-errors-b3-2', 3);
    const scale = 7.8,
      x = 190,
      y = 464,
      h = 125;
    const sx = x + safe * scale + 125 * (1 - join);
    const sy = y + 120 * (1 - join);
    const bar = (id, atX, atY, count, label, color) =>
      api.focus.target(id, () => {
        api.rect(ctx, atX, atY, count * scale, h, color, undefined, 3);
        api.text(
          ctx,
          count + ' ' + label,
          atX + (count * scale) / 2,
          atY + 77,
          37,
          themeColors.bg,
          'center',
        );
      });
    api.text(ctx, 'Requests sent to review', 190, 325, 48, themeColors.ink);
    bar('blocked-safe', x, y, safe, 'safe requests', themeColors.yellow);
    bar('blocked-harmful', sx, sy, harmful, 'harmful requests', themeColors.blue);
    if (join === 1) {
      const end = x + total * scale;
      api.line(ctx, x, y + h + 38, end, y + h + 38, themeColors.muted, 3);
      for (const edge of [x, end])
        api.line(ctx, edge, y + h + 24, edge, y + h + 38, themeColors.muted, 3);
      api.text(
        ctx,
        total + ' blocked requests',
        (x + end) / 2,
        y + h + 103,
        39,
        themeColors.ink,
        'center',
      );
    }
    api.focus.target('blocked-precision', () => {
      const prompt = 'Pick one blocked request at random. What is the chance it is harmful?';
      const ratio =
        harmful +
        ' / ' +
        total +
        ' = ' +
        (100 * m.blockedPrecision).toFixed(1) +
        '% harmful among blocked requests';
      api.text(
        ctx,
        revealed ? ratio : prompt,
        960,
        884,
        41,
        revealed ? themeColors.cyan : themeColors.ink,
        'center',
      );
    });
  }
}
export function drawMeasureErrors(ctx, scene, state, api) {
  const { C: themeColors, components: c, phase, teaching: t } = api;
  const currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    routeProgress = phase(beatProgress, 0.05, 0.9);
  return paintMeasureErrors(ctx, scene, state, api, themeColors, t, currentBeat);
}
export default {
  id: 'measure-errors',
  draw: drawMeasureErrors,
  cues: [
    'measure-errors-b1-1',
    'measure-errors-b2-1',
    'measure-errors-b2-2',
    'sg-metrics-safe',
    'sg-metrics-harmful',
    'sg-metrics-escape',
    'sg-metrics-fpr',
    'sg-metrics-fnr',
    'measure-errors-b3-1',
    'measure-errors-b3-2',
    'measure-predict',
  ],
};
