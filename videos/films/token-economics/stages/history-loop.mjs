import { historyUsage } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { priceMicroDollars } from '../fixtures.mjs';

const cents = (micro) => Number((micro / 10000).toFixed(3)) + '¢';

export function drawHistoryLoop(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const model = historyUsage(beat === 3);
  const rowCount =
    beat === 0 ? Math.min(5, 1 + Math.floor(5 * cueProgress(state, 'te-history-loop-0', p))) : 5;
  const added =
    beat === 2 ? Math.floor(5 * cueProgress(state, 'te-history-loop-1', api.phase(p, 0, 0.18))) : 0;
  const showSum =
    beat === 2 && cueProgress(state, 'five-turn-total', api.phase(p, 0.18, 0.48)) === 1;
  const reuse = beat === 3 ? cueProgress(state, 'te-history-loop-2', api.phase(p, 0.12, 0.35)) : 0;
  const outputPerTurn = model.output / model.inputs.length;
  const x = 375;
  const scale = 785 / Math.max(...model.inputs);
  let sum = 0;

  api.focus.target('te-history-loop-mechanism', () => {
    text(ctx, api, 'Input sent this turn', x, 254, 36, C.ink, 'left');
    text(ctx, api, 'Output tokens', 1350, 254, 33, C.ink);
    if (beat > 0) text(ctx, api, 'Receipt', 1700, 254, 36, C.ink, 'right');
    for (let i = 0; i < rowCount; i++) {
      const y = 310 + i * 102;
      const input = model.inputs[i];
      const rowReuse = api.clamp(reuse * (model.inputs.length - 1) - (i - 1));
      const read = Math.round(model.reads[i] * rowReuse);
      const cost = priceMicroDollars(input, read, outputPerTurn);
      sum += cost;
      text(ctx, api, 'Turn ' + (i + 1), 307, y + 44, 36, C.ink, 'right');
      api.rect(ctx, x, y, input * scale, 60, C.cyan, undefined, 0);
      if (read) api.rect(ctx, x, y, read * scale, 60, C.yellow, undefined, 0);
      text(
        ctx,
        api,
        input.toLocaleString('en-US'),
        x + input * scale + 15,
        y + 42,
        33,
        C.ink,
        'left',
      );
      text(ctx, api, String(outputPerTurn), 1350, y + 44, 38, C.pink);
      if (beat > 0) {
        const highlight = beat === 1 ? i === 4 : i < added;
        const repricing = model.reads[i] > 0 && rowReuse > 0 && rowReuse < 1;
        text(
          ctx,
          api,
          repricing ? '…' : cents(cost),
          1700,
          y + 44,
          42,
          highlight ? C.yellow : C.ink,
          'right',
        );
      }
    }
    if (beat === 0 && rowCount === 5) {
      text(
        ctx,
        api,
        '20,000 input tokens across five calls  +  1,000 output tokens',
        960,
        913,
        38,
        C.ink,
      );
    } else if (beat === 1) {
      text(
        ctx,
        api,
        'Last receipt  ' +
          cents(priceMicroDollars(model.inputs[4], 0, outputPerTurn)) +
          '     ·     Whole task  ?',
        960,
        913,
        48,
        C.ink,
      );
    } else if (beat === 2 && showSum) {
      text(ctx, api, 'Five receipts  ' + cents(sum), 960, 892, 61, C.yellow);
      text(ctx, api, '5¢ for input  +  1.5¢ for output', 960, 970, 36, C.ink);
    } else if (beat === 3) {
      text(ctx, api, 'Input billed as a cache read', x, 851, 32, C.yellow, 'left');
      text(ctx, api, 'Ordinary input', 1158, 851, 32, C.cyan, 'right');
      if (reuse === 1)
        text(
          ctx,
          api,
          '14,000 reads  ·  6,000 ordinary  ·  1,000 output      Total  ' + cents(sum),
          960,
          962,
          40,
          C.ink,
        );
    }
  });
}

export default {
  id: 'history-loop',
  draw: drawHistoryLoop,
  cues: ['te-history-loop-0', 'te-history-loop-1', 'five-turn-total', 'te-history-loop-2'],
};
