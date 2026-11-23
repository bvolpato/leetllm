import { batchComparison, calculation, drawBatch } from '../batch.mjs';
import { operationProgress } from '../../../lib/lesson-definition.mjs';

const full = batchComparison(4, 4);
const short = batchComparison(2, 4);
export function drawJit(ctx, scene, state, api) {
  const trimmed = operationProgress(state, 'jit-short') > 0;
  const pad = operationProgress(state, 'jit-pad');
  const padded = pad > 0;
  const data = trimmed ? short : full;
  const slots = trimmed && !padded ? 2 : 4;
  const contract = 'Input shape [' + slots + ', 2]';
  drawBatch(ctx, api, data, {
    slots,
    arriving: pad,
    caption: contract,
    bracketSlots: data.loss.count,
    mask: padded ? data.batch.map((row) => row.valid) : undefined,
  });
  if (padded) {
    calculation(
      ctx,
      api,
      'Four-row executable',
      '5 / 2 = ' + data.loss.masked,
      'Two padding slots restore the input shape.',
    );
  } else if (trimmed) {
    calculation(
      ctx,
      api,
      'Two-row executable',
      '5 / 2 = ' + data.loss.masked,
      'A new shape needs a compatible executable. Check the compile log.',
    );
  } else {
    calculation(
      ctx,
      api,
      'Four-row executable',
      '15 / 4 = ' + data.loss.masked,
      'The same compiled callable can accept new values with this input contract.',
    );
  }
}
export default { id: 'jit', draw: drawJit, cues: ['jit-full', 'jit-short', 'jit-pad'] };
