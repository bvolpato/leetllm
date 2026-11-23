import { spoken } from '../arithmetic.mjs';
import { serialPayoff } from '../model.mjs';
import { requestTrace } from '../request-trace.mjs';

export function drawSystemPayoff(ctx, scene, state, api) {
  const small = state.beat >= 2;
  const original = serialPayoff(small ? 95 : 60, small ? 5 : 40, 2);
  const p = spoken(state, small ? 'small-scope' : 'serial-kernel-half', small ? 3 : 1);
  const kernel = original.kernel * (1 - p / 2);
  const totalSpoken = spoken(state, small ? 'small-total' : 'large-total', small ? 3 : 1) === 1;
  const ratioSpoken = spoken(state, small ? 'small-ratio' : 'large-ratio', small ? 3 : 1) === 1;
  let totalLabel = original.cpu + ' ms + (' + original.kernel + ' ms / 2) = ? ms';
  if (p === 1) totalLabel = original.cpu + ' + ' + kernel + ' = ' + (totalSpoken ? original.after : '?') + ' ms';
  if (ratioSpoken) {
    totalLabel += '      ' + original.before + ' / ' + original.after +
      (small ? ' ≈ ' : ' = ') + Number(original.speedup.toFixed(3)) + '×';
  }
  api.focus.target('system-payoff-mechanism', () =>
    requestTrace(ctx, api, { original, cpu: original.cpu, kernel, bottomLabel: 'Projection', totalLabel, pending: p === 0 }),
  );
}
export default {
  id: 'system-payoff', draw: drawSystemPayoff,
  cues: ['request-setup', 'serial-kernel-half', 'large-total', 'large-ratio', 'small-setup', 'small-scope', 'small-total', 'small-ratio'],
};
