import { roundTrip } from '../encoding.mjs';
import { motion, settled } from '../timing.mjs';
import { peakRuler } from './intro.mjs';

const previous = roundTrip(500, 10 / 448);
const current = roundTrip(500, 500 / 448);

export function drawStaleScale(ctx, scene, state, api) {
  const { C } = api;
  const switched = motion(state, 'stale-measure', 1);
  const result = settled(state, 'stale-restored', 2);
  api.focus.target('scale-range', () =>
    peakRuler(
      ctx,
      api,
      previous.original,
      result ? current.reconstructed : switched === 0 ? previous.reconstructed : null,
      switched === 0 ? previous.reconstructed : current.reconstructed,
      previous.reconstructed + switched * (current.reconstructed - previous.reconstructed),
    ),
  );
  const columns = [165, 570, 1000, 1450];
  ['Peak used for scale', 'Input ÷ scale', 'Stored E4M3 value', 'Value × scale'].forEach(
    (label, i) => api.text(ctx, label, columns[i], 710, 30, C.muted),
  );
  for (const [i, run] of [previous, current].entries()) {
    if (i === 1 && switched < 1) continue;
    const y = 813 + i * 120;
    const values = [
      run.scale * 448,
      run.scaled.toLocaleString('en-US'),
      run.value,
      i === 0 || result ? run.reconstructed : '?',
    ];
    api.focus.target(i ? 'current-conversion' : 'previous-conversion', () => {
      values.forEach((value, j) =>
        api.text(ctx, value, columns[j], y, 53, j === 3 ? C.cyan : i === 0 ? C.muted : C.ink),
      );
    });
  }
}

export default {
  id: 'stale-scale',
  draw: drawStaleScale,
  cues: ['stale-divide', 'stale-measure', 'stale-restored'],
};
