import { compareReturnedRows } from '../arithmetic.mjs';
import { deepGemmSentenceProgress, expertPackState } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { finalRuns, freshReference, sentenceCues } from '../fixtures.mjs';
import { drawRowPack } from '../row-pack.mjs';

export function drawFreshContract(ctx, scene, state, api) {
  const b = state.beat;
  const g = (beat, i) => deepGemmSentenceProgress(scene.id, state, beat, i);
  if (b < 3) {
    const pack = expertPackState(scene.id, state);
    let result = 'How many rows must the three experts reserve?';
    let detail = 'What fraction of the reserved rows will be empty?';
    if (b === 1) {
      result = pack.allocationReady
        ? pack.capacity + ' reserved rows'
        : 'Round each segment separately';
      detail = '';
      if (pack.totalsReady) result += '   ·   ' + pack.useful + ' useful';
      if (g(1, 3) >= 1)
        result =
          pack.padding +
          ' empty / ' +
          pack.capacity +
          ' reserved = ' +
          (100 * pack.paddingShare).toFixed(1) +
          '% padding';
      if (g(1, 4) >= 1)
        detail =
          pack.padding +
          ' empty / ' +
          pack.useful +
          ' useful = ' +
          (100 * pack.overhead).toFixed(1) +
          '% overhead';
    }
    if (b === 2) {
      result = pack.totalsReady
        ? `${pack.capacity} reserved  =  ${pack.useful} useful  +  ${pack.padding} padding`
        : pack.allocationReady
          ? 'The empty expert still reserves zero rows'
          : 'How much space will the empty expert take?';
      detail = 'Same source tokens and expert assignments';
    }
    drawRowPack(ctx, api, pack, {
      limit: 768,
      title: pack.alignment + ' rows per block',
      result,
      detail,
      showCapacity: pack.allocationReady,
      edgeExpert: b < 2 && g(0, 1) > 0 ? 1 : undefined,
    });
    return;
  }
  const { C } = api;
  const timed = g(3, 1);
  const compared = g(3, 2) > 0;
  const sums = g(3, 2) >= 1;
  const verdict = b === 4 && g(4, 2) > 0;
  const checks = finalRuns.map((run) => compareReturnedRows(freshReference.values, run.returned));
  api.focus.target('close-comparison', () => {
    drawText(ctx, api, 'Complete layer on the same 353 assignments', 135, 244, 40);
    drawText(ctx, api, 'Illustrative times', 1760, 244, 28, C.muted, 'right');
    finalRuns.forEach((run, i) => {
      const y = 304 + 91 * i;
      const color = i === 0 ? C.blue : C.cyan;
      drawText(ctx, api, run.name, 138, y + 45, 31);
      api.rect(ctx, 480, y, 1070, 65, C.panel, undefined, 0);
      if (timed > 0) api.rect(ctx, 480, y, 8.6 * run.elapsed * timed, 65, color, undefined, 0);
      if (timed >= 1) drawText(ctx, api, run.elapsed + ' µs', 1730, y + 48, 39, color, 'right');
    });
    const columns = [255, 660, 1100, 1560];
    ['Source token', 'Reference', ...finalRuns.map((run) => run.name)].forEach((name, i) =>
      drawText(ctx, api, name, columns[i], 572, 33, C.muted, 'center'),
    );
    api.line(ctx, 130, 598, 1780, 598, C.muted, 2);
    freshReference.tokens.forEach((token, i) => {
      const y = 676 + 101 * i;
      const expected = freshReference.values[i];
      drawText(ctx, api, token, columns[0], y, 46, C.ink, 'center');
      if (!compared) return;
      drawText(ctx, api, expected, columns[1], y, 50, C.ink, 'center');
      const judged = b === 4 && g(4, i) >= 1;
      finalRuns.forEach((run, j) => {
        const matches = checks[j].matches[i];
        const value = judged && !matches ? run.returned[i] + ' ≠ ' + expected : run.returned[i];
        drawText(
          ctx,
          api,
          value,
          columns[j + 2],
          y,
          50,
          judged ? (matches ? C.green : C.pink) : C.ink,
          'center',
        );
      });
    });
    if (sums) {
      api.line(ctx, 130, 812, 1780, 812, C.muted, 2);
      drawText(ctx, api, 'Pair sum', columns[0], 866, 32, C.muted, 'center');
      [checks[0].total, checks[1].total].forEach((total, i) =>
        drawText(ctx, api, total, columns[i + 2], 867, 38, C.muted, 'center'),
      );
    }
    drawText(
      ctx,
      api,
      verdict
        ? 'Reject the wider pack. Restore source order and retime the corrected run.'
        : sums
          ? 'Would you keep the 105 µs run?'
          : 'Compare each token with the reference',
      960,
      981,
      39,
      verdict ? C.pink : C.yellow,
      'center',
    );
  });
}
export default {
  id: 'fresh-contract',
  draw: drawFreshContract,
  cues: sentenceCues('fresh-contract'),
};
