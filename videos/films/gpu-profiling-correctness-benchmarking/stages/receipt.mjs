import { spoken } from '../arithmetic.mjs';
import { serialPayoff } from '../model.mjs';
import { requestTrace } from '../request-trace.mjs';

export function drawReceipt(ctx, scene, state, api) {
  const original = serialPayoff(95, 5, 2);
  const gpu = original.kernel / original.factor;
  const added = original.before - original.after;
  const p = spoken(state, 'measured-prep', 1);
  const measured = spoken(state, 'request-clock', 0) === 1;
  const totalLabel = p > 0 ? 'CPU prep took ' + added + ' ms longer. The kernel saved ' + added + ' ms.' :
    measured ? 'Projected   97.5 ms       Measured   100 ms       Which interval would you inspect?' :
      'Projected finish   97.5 ms';
  api.focus.target('receipt-request', () => requestTrace(ctx, api, {
    original, cpu: original.cpu + p * added, kernel: gpu,
    bottomLabel: p === 1 ? 'Measured' : 'Projection',
    totalLabel: p > 0 && p < 1 ? 'Reading the system trace…' : totalLabel,
  }));
}
export default { id: 'receipt', draw: drawReceipt, cues: ['request-clock', 'measured-prep', 'retain-runs'] };
