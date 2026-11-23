import { PRESCRIBED } from '../fixtures.mjs';
import { fmt } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  drawHistoryMechanismsHistory,
  drawHistoryMechanismsMath,
  drawHistoryMechanismsTarget,
  drawHistoryMechanismsText,
} from '../defaults.mjs';
export function drawMomentumConventions(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    const first = phase('history-first', 0),
      second = phase('history-second', 0);
    const continued = phase('history-continue', 1),
      fourth = phase('history-fourth', 1);
    const count =
      currentBeat === 0
        ? second === 1
          ? 2
          : first === 1
            ? 1
            : 0
        : currentBeat === 1
          ? fourth === 1
            ? 4
            : continued > 0
              ? 3
              : 2
          : 4;
    drawHistoryMechanismsTarget(ctx, api, 'history-inputs', () =>
      drawHistoryMechanismsHistory(ctx, api, themeColors, count, Math.max(0, count - 1)),
    );
    if (currentBeat < 2) {
      const index = currentBeat === 0 ? (second > 0 ? 1 : 0) : fourth > 0 ? 3 : 2;
      const record = PRESCRIBED[index],
        progress =
          currentBeat === 0 ? (index === 0 ? first : second) : index === 2 ? continued : fourth;
      const memoryPlot = teaching.axes({
        x: 230,
        y: 480,
        width: 900,
        height: 180,
        xDomain: [-1, 12],
        yDomain: [-1.3, 1.3],
        equalUnits: true,
        xTicks: [0, 1, 5, 10],
        yTicks: [],
        fontSize: 24,
        color: themeColors.muted,
      });
      const sourceId =
        currentBeat === 0
          ? index === 0
            ? 'history-first'
            : 'history-second'
          : index === 2
            ? 'history-continue'
            : 'history-fourth';
      drawHistoryMechanismsTarget(ctx, api, sourceId, () =>
        teaching.vectorAccumulation({
          plot: memoryPlot,
          terms: [
            {
              id: sourceId + '-carry',
              label: 'Retain old mₐ',
              weight: 0.9,
              values: [record.oldMean[0]],
              color: themeColors.yellow,
            },
            {
              id: sourceId + '-new',
              label: 'New gradient gₐ',
              weight: 0.1,
              values: [record.gradient[0]],
              color: themeColors.cyan,
            },
          ],
          progress,
          projection: {
            label: 'steep a coordinate; inspect b separately',
            point: (values) => [values[0], 0],
          },
          ledger: {
            x: 1190,
            y: 450,
            width: 610,
            height: 280,
          },
          fontSize: 25,
          format: (value) => fmt(value),
          color: themeColors.green,
          restColor: themeColors.muted,
          revealTotal: progress === 1,
          totalLabel: 'Signed memory',
        }),
      );
      drawHistoryMechanismsText(
        ctx,
        api,
        themeColors,
        'm history',
        230,
        790,
        29,
        themeColors.muted,
      );
      const values = [0, ...PRESCRIBED.slice(0, count).map((r) => r.mean[0])];
      const plot = teaching.axes({
        x: 300,
        y: 820,
        width: 1050,
        height: 140,
        xDomain: [0, 4],
        yDomain: [0, 11],
        xTicks: [0, 1, 2, 3, 4],
        yTicks: [0, 10],
        fontSize: 22,
        color: themeColors.muted,
      });
      teaching.curve({
        plot,
        points: values.map((y, x) => ({
          x,
          y,
        })),
        color: themeColors.yellow,
        width: 4,
      });
      if (currentBeat === 1)
        drawHistoryMechanismsTarget(ctx, api, 'history-shallow', () => {
          drawHistoryMechanismsText(
            ctx,
            api,
            themeColors,
            phase('history-shallow', 1) === 1
              ? 'b memory ≈ +0.333 · every supplied gradient is positive'
              : 'b memory = ?',
            960,
            1040,
            30,
            themeColors.cyan,
            'center',
          );
        });
    } else {
      drawHistoryMechanismsTarget(ctx, api, 'library-buffer', () => {
        drawHistoryMechanismsMath(
          ctx,
          api,
          themeColors,
          'u_t=0.9u_{t-1}+g_t',
          240,
          505,
          42,
          themeColors.cyan,
        );
        drawHistoryMechanismsText(
          ctx,
          api,
          themeColors,
          'Library u₁ starts at g₁',
          240,
          580,
          31,
          themeColors.cyan,
        );
        if (phase('library-buffer', 2) === 1) {
          drawHistoryMechanismsText(
            ctx,
            api,
            themeColors,
            'u₁…u₄ = 100, 10, 79, 11.1',
            240,
            655,
            32,
            themeColors.cyan,
          );
          drawHistoryMechanismsText(
            ctx,
            api,
            themeColors,
            'm₁…m₄ = 10, 1, 7.9, 1.11',
            240,
            725,
            32,
            themeColors.yellow,
          );
        }
      });
      drawHistoryMechanismsTarget(ctx, api, 'library-scale', () => {
        if (phase('library-scale', 2) > 0) {
          api.arrow(ctx, 920, 610, 1120, 610, themeColors.yellow, 6);
          drawHistoryMechanismsMath(
            ctx,
            api,
            themeColors,
            'm_t=(1-\\beta)u_t',
            1170,
            580,
            41,
            themeColors.yellow,
          );
          drawHistoryMechanismsMath(
            ctx,
            api,
            themeColors,
            '\\eta_{library}=(1-\\beta)\\eta_{EMA}',
            1170,
            675,
            38,
            themeColors.green,
          );
        }
      });
      drawHistoryMechanismsTarget(ctx, api, 'library-rate', () => {
        if (phase('library-rate', 2) === 1) {
          drawHistoryMechanismsText(
            ctx,
            api,
            themeColors,
            '0.1 × 0.018 = 0.0018',
            1170,
            795,
            38,
            themeColors.green,
          );
          drawHistoryMechanismsText(
            ctx,
            api,
            themeColors,
            'Both prescribed paths finish at w = 0.63982.',
            240,
            935,
            34,
            themeColors.green,
          );
        }
        drawHistoryMechanismsText(
          ctx,
          api,
          themeColors,
          'Default dampening · same gradient inputs · initialization matched',
          240,
          1020,
          29,
          themeColors.muted,
        );
      });
    }
  }
}
export default {
  id: 'momentum-conventions',
  draw: drawMomentumConventions,
  cues: [
    'history-inputs',
    'history-first',
    'history-second',
    'history-continue',
    'history-fourth',
    'history-shallow',
    'library-buffer',
    'library-scale',
    'library-rate',
  ],
};
