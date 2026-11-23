import { ATTENTION_CPU_FIXTURE } from '../fixtures.mjs';
import { dot, softmax } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { drawChapterCard, drawChapterText, drawFooter, drawTable } from '../defaults.mjs';
export function drawKernelDiagnostics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('kernel-diagnostics-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Actual CPU attention fixture · seed 3 · shape [1, 2, 4, 8]',
        960,
        280,
        33,
        themeColors.ink,
        'center',
      );
      const f = ATTENTION_CPU_FIXTURE,
        weights = f.q[0].map((q, i) =>
          softmax(f.k[0].map((k, j) => (j <= i ? dot(q, k) / Math.sqrt(8) : -Infinity))),
        );
      const labels = [
        ['Query', 'key 0', 'key 1', 'key 2', 'key 3'],
        ...weights.map((r, i) => [String(i), ...r.map((v) => v.toFixed(3))]),
      ];
      drawTable(ctx, api, labels, 180, 365, 1560, 360, 29);
      if (E('cpu-attention-check', 0)) {
        drawChapterCard(
          ctx,
          api,
          'Manual output ≈ SDPA API output',
          260,
          805,
          1400,
          themeColors.green,
          100,
          36,
        );
        drawChapterText(
          ctx,
          api,
          'Recorded max |Δ| = ' + f.maxAbsoluteDifference.toExponential(3),
          960,
          965,
          29,
          themeColors.cyan,
          'center',
        );
      }
      drawFooter(ctx, api, 'CPU equivalence supplies no CUDA kernel, memory or performance result');
    } else if (currentBeat === 1) {
      const invalid = cueProgress('invalid-mask', 1) > 0,
        repaired = cueProgress('first-finite', 1) === 1;
      drawChapterText(
        ctx,
        api,
        'Diagnostic mutation · one query row loses every valid key',
        960,
        280,
        34,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Allowed keys', 'Unnormalized weights', 'Row sum'],
          [
            invalid && !repaired ? '0 0 0 0' : '1 1 1 0',
            invalid && !repaired ? '0 0 0 0' : 'exp(scores)',
            '' + (invalid && !repaired ? '0' : 'positive'),
          ],
        ],
        180,
        370,
        1560,
        200,
        30,
      );
      drawChapterCard(
        ctx,
        api,
        invalid && !repaired
          ? 'softmax: 0 / 0 → NaN'
          : repaired
            ? 'Finite scores on keys 0, 1 and 2'
            : 'Query 2 can read keys 0, 1 and 2',
        250,
        670,
        1420,
        invalid && !repaired ? themeColors.pink : themeColors.green,
        120,
        36,
      );
      drawChapterText(
        ctx,
        api,
        invalid && !repaired
          ? 'Gradient clipping cannot repair an invalid forward result'
          : 'Inspect labels and causal visibility separately',
        960,
        900,
        32,
        invalid && !repaired ? themeColors.pink : themeColors.cyan,
        'center',
      );
    } else {
      const wrong = cueProgress('wrong-inverse', 2) > 0;
      drawChapterText(
        ctx,
        api,
        'Same local token · a changed inverse map can silently change text',
        960,
        280,
        33,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Local ID', 'Correct inverse', 'Scrambled inverse'],
          ['1', '461 → ak', wrong ? '11 → comma' : 'await map check'],
        ],
        180,
        390,
        1560,
        240,
        36,
      );
      drawChapterCard(
        ctx,
        api,
        'No decoder exception is required',
        310,
        735,
        1300,
        themeColors.pink,
        100,
        38,
      );
      drawChapterText(
        ctx,
        api,
        'Resume pre-loss: inspect weights + exact batch · moments affect the following update',
        960,
        915,
        28,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'kernel-diagnostics',
  draw: drawKernelDiagnostics,
  cues: [
    'kernel-diagnostics-1',
    'cpu-attention-check',
    'kernel-diagnostics-2',
    'invalid-mask',
    'first-finite',
    'kernel-diagnostics-3',
    'wrong-inverse',
  ],
};
