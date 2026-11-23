import { ACTUAL_LAB_RUN } from '../fixtures.mjs';
import { spoken } from '../arithmetic.mjs';
import {
  drawProfileChapterCard,
  drawProfileChapterTable,
  drawProfileChapterText,
} from '../defaults.mjs';
export function drawLabExecution(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    P = (cue, beat = currentBeat) => spoken(state, cue, beat);
  api.focus.target('lab-execution-mechanism', () => {
    if (currentBeat === 0) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Reference and memory checks   ·   shared RTX 5070 Ti   ·   2026-11-06',
        960,
        285,
        32,
        themeColors.ink,
        'center',
      );
      drawProfileChapterCard(
        ctx,
        api,
        themeColors,
        components,
        'nvcc -O3 -lineinfo -std=c++17',
        240,
        365,
        1440,
        themeColors.blue,
        95,
        35,
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Execution', 'Observed result'],
          ['Compile + fixed edge cases', 'PASS'],
          ['Buggy memcheck', P('buggy-checker', 0) > 0 ? '2 errors · exit 99' : 'await log'],
          ['Fixed memcheck', P('fixed-checker', 0) > 0 ? '0 errors · exit 0' : 'await log'],
        ],
        230,
        545,
        1460,
        300,
        31,
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Source SHA-256 ' + ACTUAL_LAB_RUN.sourceSha256.slice(0, 24) + '…',
        960,
        945,
        27,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'One kernel, two buffer policies   ·   event intervals in launch order',
        960,
        280,
        32,
        themeColors.ink,
        'center',
      );
      const plot = teaching.axes({
          x: 260,
          y: 380,
          width: 1350,
          height: 400,
          xDomain: [0, 199],
          yDomain: [0, 340],
          xTicks: [0, 50, 100, 150, 199],
          yTicks: [0, 100, 200, 300],
          xLabel: 'sample index',
          yLabel: 'microseconds',
          fontSize: 27,
        }),
        count = Math.max(1, Math.ceil(200 * P('actual-event-samples', 1)));
      for (const [rows, color] of [
        [ACTUAL_LAB_RUN.same, themeColors.blue],
        [ACTUAL_LAB_RUN.rotated, themeColors.cyan],
      ])
        teaching.curve({
          plot,
          points: rows.slice(0, count).map(([sample, , time]) => ({
            x: sample,
            y: time,
          })),
          color,
          width: 3,
        });
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Blue: same buffer · cyan: rotating · all 200 observations retained per regime',
        960,
        890,
        29,
        themeColors.muted,
        'center',
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Post-timing checks: 1 same-buffer slot · 10 rotating slots',
        960,
        955,
        30,
        themeColors.green,
        'center',
      );
    } else {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Results from the shared RTX 5070 Ti',
        960,
        285,
        36,
        themeColors.ink,
        'center',
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Lab record', 'Result'],
          ['Fixed kernel', 'Reference and memcheck cases passed'],
          ['Same buffers / rotating buffers', '200 event intervals per policy'],
          ['Device-memory traffic', 'Counter access denied'],
        ],
        170,
        385,
        1580,
        360,
        29,
      );
      if (P('bounded-run-limit', 2) > 0)
        drawProfileChapterCard(
          ctx,
          api,
          themeColors,
          components,
          'Next round: time the baseline and candidate with the same buffer policy.',
          230,
          850,
          1460,
          themeColors.yellow,
          100,
          33,
        );
    }
  });
}
export default {
  id: 'lab-execution',
  draw: drawLabExecution,
  cues: ['buggy-checker', 'fixed-checker', 'actual-event-samples', 'bounded-run-limit'],
};
