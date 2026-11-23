import { experiment } from '../model.mjs';
import { settled } from '../timing.mjs';

const group = experiment.block[1].slice(0, 8);
const changed = group.flatMap((entry, index) =>
  entry.reconstructed === entry.original ? [] : [{ ...entry, index }],
);

export function drawCpuContract(ctx, scene, state, api) {
  const { C } = api;
  const divided = settled(state, 'cpu-divide', 0);
  const rounded = settled(state, 'cpu-round', 0);
  const rebuilt = settled(state, 'cpu-reconstruct', 0);
  const negative = settled(state, 'cpu-negative', 0);
  const compare = settled(state, 'cpu-matmul', 1);
  const columns = [440, 805, 1180, 1580];
  api.focus.target('cpu-row', () => {
    api.text(ctx, 'One group of 8 repeats four times in the 32-value row', 145, 270, 37, C.ink);
    const headers = ['Input', 'Divide by 2', 'Round to E4M3', 'Multiply by 2'];
    for (const [i, header] of headers.entries()) {
      api.text(ctx, header, columns[i], 415, 37, C.muted, 'center');
    }
    for (const [i, entry] of changed.entries()) {
      const y = 562 + i * 156;
      const values = [
        entry.original,
        (i === 0 ? divided : negative) ? entry.scaled : '·',
        (i === 0 ? rounded : negative) ? entry.value : '·',
        (i === 0 ? rebuilt : negative) ? entry.reconstructed : '·',
      ];
      api.text(ctx, 'Index ' + entry.index, 145, y, 34, C.muted);
      const colors = [C.blue, C.ink, C.yellow, C.cyan];
      for (const [j, value] of values.entries()) {
        api.text(ctx, value, columns[j], y, 68, value === '·' ? C.muted : colors[j], 'center');
      }
    }
  });
  api.focus.target('cpu-operation', () => {
    if (compare) {
      api.text(ctx, 'Two FP32 dot products on the CPU', 960, 857, 44, C.ink, 'center');
      api.text(ctx, 'Original activations and weights', 525, 952, 36, C.blue, 'center');
      api.text(ctx, 'Reconstructed activations and weights', 1380, 952, 36, C.cyan, 'center');
    } else if (negative) {
      api.text(
        ctx,
        'The other six values in this group survive exactly.',
        960,
        895,
        42,
        C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'cpu-contract',
  draw: drawCpuContract,
  cues: ['cpu-divide', 'cpu-round', 'cpu-reconstruct', 'cpu-negative', 'cpu-matmul'],
};
