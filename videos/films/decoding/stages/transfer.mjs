import { BASE, WORDS } from '../fixtures.mjs';
import { transferExperiment } from '../model.mjs';
import { coreText } from '../defaults.mjs';
import { probabilityStrip, stripMarker, stripX } from '../probability-strip.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const edge = movement(state, 'transfer-edge-change', 1, 0.08, 0.45);
  const threshold = movement(state, 'transfer-nucleus-experiment', 3, 0.08, 0.46);
  const f = transferExperiment(1, 0, {
    'transfer-edge-change': { progress: edge },
    'transfer-nucleus-experiment': { progress: threshold },
  });
  if (state.beat < 2) {
    api.focus.target('edge-comparison', () => {
      const proposed = state.beat === 0 && movement(state, 'transfer-proposal', 0, 0.3, 0.72) > 0;
      coreText(
        ctx,
        api,
        proposed
          ? 'After slept, try 0.50 for soundly and 0.50 for outside.'
          : 'First word     ran  0.60     /     slept  0.40',
        125,
        261,
        39,
        api.C.ink,
        'left',
      );
      coreText(ctx, api, 'Two-word probability', 1160, 335, 31, api.C.muted, 'left');
      f.paths.forEach((row, i) => {
        const y = 416 + i * 86;
        const color = row.prefix === 'ran' ? api.C.blue : api.C.cyan;
        coreText(ctx, api, row.text, 125, y, 38, color, 'left');
        api.math(
          ctx,
          row.first.toFixed(2) +
            '\\times' +
            row.conditional.toFixed(2) +
            '=' +
            row.score.toFixed(3),
          520,
          y,
          36,
          api.C.ink,
        );
        api.rect(ctx, 1160, y - 31, (row.score / 0.4) * 550, 36, color, undefined, 3);
      });
      const y = 900;
      if (state.beat === 0) {
        coreText(
          ctx,
          api,
          proposed
            ? 'Would keeping slept still improve the best score?'
            : 'Width 1 can expand ran. Width 2 can also expand slept.',
          960,
          y,
          40,
          api.C.ink,
        );
      } else {
        coreText(
          ctx,
          api,
          'Beam 1 keeps ran → ' + f.beam1.text + ' (' + f.beam1.score.toFixed(3) + ')',
          145,
          y - 15,
          36,
          api.C.blue,
          'left',
        );
        coreText(
          ctx,
          api,
          'Beam 2 keeps ran + slept → ' + f.best.text + ' (' + f.best.score.toFixed(3) + ')',
          145,
          y + 55,
          36,
          api.C.cyan,
          'left',
        );
      }
    });
    return;
  }
  api.focus.target('threshold-comparison', () => {
    const settled = heard(state, 'transfer-crossing', 3, 0.62);
    coreText(ctx, api, 'Next word after “The dog”', stripX, 316, 48, api.C.ink, 'left');
    probabilityStrip(ctx, api, {
      values: BASE,
      names: WORDS,
      y: 530,
      kept: state.beat === 2 || settled ? f.ids : undefined,
    });
    stripMarker(ctx, api, f.threshold, 530, 'Top-p  ' + f.threshold.toFixed(2));
    const question = movement(state, 'transfer-threshold-question', 2, 0.42, 0.95) > 0;
    const last = f.ids.at(-1);
    coreText(
      ctx,
      api,
      settled
        ? 'Keep through ' + WORDS[last] + '   ·   cumulative mass ' + f.cumulative[last].toFixed(2)
        : question
          ? 'At 0.90, which word crosses the mark?'
          : 'Stop at the first token that reaches the mark.',
      960,
      897,
      43,
      api.C.ink,
    );
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-proposal',
    'transfer-edge-change',
    'transfer-threshold-question',
    'transfer-nucleus-experiment',
    'transfer-crossing',
  ],
};
