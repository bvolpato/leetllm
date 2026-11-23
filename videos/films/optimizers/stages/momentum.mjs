import { RUNS } from '../fixtures.mjs';
import { fmt, pair } from '../arithmetic.mjs';
import { cueProgress, traceState } from '../construction.mjs';
import {
  drawOptimizerArrow,
  drawOptimizerBowl,
  drawOptimizerFocus,
  drawOptimizerHeader,
  drawOptimizerLine,
  drawOptimizerText,
  drawOptimizerTrace,
} from '../defaults.mjs';
import { preserveLegacyPaletteReads } from '../compatibility.mjs';
export function drawMomentum(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const q = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  preserveLegacyPaletteReads(themeColors);
  {
    drawOptimizerHeader(
      ctx,
      api,
      themeColors,
      'EMA convention: mₜ = 0.9 mₜ₋₁ + 0.1 gₜ',
      'Parameter step = −0.018 mₜ',
    );
    const plot = drawOptimizerBowl(ctx, api, themeColors, teaching, {
      x: 215,
      width: 860,
      height: 510,
    });
    const qMove =
      currentBeat === 0
        ? q('momentum-first-four', 0, 0.55, 0.93)
        : currentBeat === 1
          ? q('momentum-fifth', 1, 0.77, 0.94)
          : q('momentum-return', 2, 0.03, 0.5);
    const f = traceState(
      RUNS.momentum,
      qMove,
      currentBeat === 0 ? 0 : currentBeat === 1 ? 4 : 5,
      currentBeat === 0 ? 4 : currentBeat === 1 ? 5 : 8,
    );
    drawOptimizerFocus(ctx, api, currentBeat === 1 ? 'momentum-fifth-step' : 'momentum-path', () =>
      drawOptimizerTrace(
        ctx,
        api,
        themeColors,
        teaching,
        plot,
        RUNS.momentum,
        f,
        themeColors.yellow,
      ),
    );
    drawOptimizerText(
      ctx,
      api,
      themeColors,
      'Completed updates ' + f.completed + '  ·  loss ≈ ' + fmt(f.currentLoss, 3),
      240,
      960,
      30,
      themeColors.yellow,
    );
    if (currentBeat === 0)
      drawOptimizerFocus(ctx, api, 'momentum-memory', () => {
        const v = q('first-memory', 0, 0.25, 0.52);
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'First steep-coordinate buffer',
          1190,
          350,
          31,
          themeColors.muted,
        );
        const end = 1270 + 420 * v;
        drawOptimizerLine(ctx, api, themeColors, 1270, 470, 1690, 470);
        if (v > 0)
          drawOptimizerArrow(
            ctx,
            api,
            {
              x: 1270,
              y: 470,
            },
            {
              x: end,
              y: 470,
            },
            themeColors.yellow,
            7,
          );
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          v === 1 ? 'm₁ = (10, 0.1)' : 'm₁ = (?, ?)',
          1190,
          565,
          38,
          themeColors.yellow,
        );
        drawOptimizerText(ctx, api, themeColors, 'First step = −0.018 m₁', 1190, 655, 32);
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          f.completed >= 1 ? 'First endpoint = (0.82, 0.9982)' : 'First endpoint = ?',
          1190,
          725,
          30,
          themeColors.yellow,
        );
      });
    if (currentBeat === 1) {
      const r = RUNS.momentum.records[4];
      const retained = q('retain-memory', 1, 0.2, 0.37);
      const incoming = retained === 1 ? q('incoming-memory', 1, 0.37, 0.53) : 0;
      const revealed = incoming === 1 && q('sum-memory', 1, 0.53, 0.66) === 1;
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'At completed update 4',
        1170,
        325,
        30,
        themeColors.muted,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Current g ≈ ' + pair(r.gradient),
        1170,
        380,
        30,
        themeColors.cyan,
      );
      const memoryPlot = teaching.axes({
        x: 1190,
        y: 435,
        width: 560,
        height: 90,
        xDomain: [-3, 21],
        yDomain: [-2, 2],
        equalUnits: true,
        xTicks: [0, 5, 10, 15, 20],
        yTicks: [],
        color: themeColors.muted,
        fontSize: 22,
      });
      teaching.vectorAccumulation({
        plot: memoryPlot,
        terms: [
          {
            id: 'memory-carry',
            label: 'Retained',
            weight: 0.9,
            values: r.oldMean,
            color: themeColors.yellow,
          },
          {
            id: 'memory-incoming',
            label: 'Incoming',
            weight: 0.1,
            values: r.gradient,
            color: themeColors.cyan,
          },
        ],
        progress: retained < 1 ? retained / 2 : 0.5 + incoming / 2,
        projection: {
          label: 'steep coordinate a; full buffers below',
          point: (values) => [values[0], 0],
        },
        ledger: {
          x: 1158,
          y: 585,
          width: 650,
          height: 265,
        },
        fontSize: 24,
        width: 6,
        completedOpacity: 0.62,
        color: themeColors.green,
        restColor: themeColors.muted,
        revealTotal: revealed,
        totalTarget: 'memory-result',
        totalLabel: 'New buffer',
        format: (value) => fmt(value),
      });
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Opposing input shortens the retained positive direction.',
        1170,
        900,
        25,
        themeColors.muted,
      );
      if (q('momentum-fifth', 1, 0.77, 0.94) === 1) {
        drawOptimizerText(
          ctx,
          api,
          themeColors,
          'Δa ≈ −0.283 · endpoint loss ≈ 13.085',
          1170,
          975,
          29,
          themeColors.yellow,
        );
      }
    }
    if (currentBeat === 2) {
      const r = RUNS.momentum.records[Math.max(4, f.completed - 1)];
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Last-used gradient: ' + pair(r.gradient),
        1190,
        360,
        31,
        themeColors.cyan,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'Stored m: ' + pair(r.mean),
        1190,
        435,
        34,
        themeColors.yellow,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        f.completed === 8 ? 'a memory has turned negative.' : 'a memory is still positive.',
        1190,
        550,
        29,
        themeColors.muted,
      );
      drawOptimizerText(
        ctx,
        api,
        themeColors,
        'b memory stays positive.',
        1190,
        615,
        29,
        themeColors.muted,
      );
      for (const [j, label] of ['mₐ · scale ±22', 'mᵦ · scale ±0.6'].entries()) {
        const y = 750 + j * 110,
          mid = 1470,
          unit = j ? 390 : 12;
        drawOptimizerText(ctx, api, themeColors, label, 1190, y - 40, 27, themeColors.muted);
        drawOptimizerLine(ctx, api, themeColors, 1190, y, 1750, y);
        if (r.mean[j])
          drawOptimizerArrow(
            ctx,
            api,
            {
              x: mid,
              y,
            },
            {
              x: mid + r.mean[j] * unit,
              y,
            },
            j ? themeColors.cyan : themeColors.yellow,
            6,
          );
      }
    }
  }
}
export default {
  id: 'momentum',
  draw: drawMomentum,
  cues: [
    'first-memory',
    'momentum-first-four',
    'retain-memory',
    'incoming-memory',
    'sum-memory',
    'momentum-fifth',
    'momentum-return',
  ],
};
