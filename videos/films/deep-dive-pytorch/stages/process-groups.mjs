import { cueFraction } from '../cues.mjs';

const inputs = [
  [1, 2],
  [10, 20],
];
const sums = inputs[0].map((value, i) => value + inputs[1][i]);
const operations = [
  { id: 'reduce-both', name: 'all-reduce (sum)', outputs: [sums, sums] },
  { id: 'scatter-sum', name: 'reduce-scatter (sum)', outputs: sums.map((value) => [value]) },
  { id: 'gather-slices', name: 'all-gather', outputs: inputs.map(() => inputs.flat()) },
  {
    id: 'exchange-slices',
    name: 'all-to-all',
    outputs: inputs[0].map((_, i) => inputs.map((row) => row[i])),
  },
  { id: 'broadcast-zero', name: 'broadcast from rank 0', outputs: inputs.map(() => inputs[0]) },
];
const vector = (row) => '[' + row.join(', ') + ']';

export function drawProcessGroups(ctx, scene, state, api) {
  const { C } = api;
  const fraction = (id, beat, start, end) => cueFraction(state, id, beat, start, end);
  let names = ['all-reduce (sum)', '…'];
  let outputs;
  let note = 'Call 7';
  let statusColor = C.muted;
  if (state.beat === 1) {
    const starts = [0, 0.18, 0.36, 0.54, 0.74];
    const current = operations.findLastIndex(
      ({ id }, i) => fraction(id, 1, starts[i], starts[i] + 0.08) > 0,
    );
    const example = operations[Math.max(0, current)];
    names = [example.name, example.name];
    if (current >= 0 && fraction(example.id, 1, starts[current], starts[current] + 0.08) >= 1) {
      outputs = example.outputs;
    }
    note = 'Both ranks enter the same operation';
    statusColor = C.blue;
  } else if (state.beat === 0) {
    if (fraction('other-call', 0, 0.15, 0.3) > 0) names[1] = 'all-gather';
    if (fraction('stalled', 0, 0.32, 0.43) > 0) {
      note = 'Call 7   ·   waiting for a matching call';
      statusColor = C.pink;
    }
  } else {
    const fixed = fraction('same-branch', 2, 0.14, 0.31);
    const added = fraction('returned-sum', 2, 0.41, 0.6);
    names[1] = fixed >= 1 ? names[0] : 'all-gather';
    note =
      fixed >= 1 ? 'Call 7   ·   same group, same operation' : 'Call 7   ·   different branches';
    statusColor = fixed >= 1 ? C.green : C.pink;
    if (added >= 1) outputs = operations[0].outputs;
  }

  api.focus.target('rank-calls', () => {
    api.text(ctx, note, 150, 310, 47, statusColor);
    api.text(ctx, 'Input  ·  float32', 480, 452, 37, C.muted, 'center');
    api.text(ctx, 'Collective', 1020, 452, 37, C.muted, 'center');
    api.text(ctx, 'Receives', 1580, 452, 37, C.muted, 'center');
    for (const [rank, input] of inputs.entries()) {
      const y = 540 + rank * 210;
      const color = rank === 0 ? C.blue : C.yellow;
      api.text(ctx, 'Rank ' + rank, 150, y + 63, 44, color);
      api.text(ctx, vector(input), 480, y + 65, 58, color, 'center');
      api.arrow(ctx, 649, y + 43, 716, y + 43, color, 4);
      api.rect(ctx, 744, y - 10, 552, 108, C.panel, color, 8);
      api.text(ctx, names[rank], 1020, y + 59, 42, C.ink, 'center');
      if (outputs) {
        api.arrow(ctx, 1320, y + 43, 1383, y + 43, C.green, 4);
        api.text(ctx, vector(outputs[rank]), 1580, y + 64, 51, C.green, 'center');
      } else {
        api.text(ctx, '···', 1580, y + 64, 55, C.muted, 'center');
      }
    }
  });
}

export default {
  id: 'process-groups',
  draw: drawProcessGroups,
  cues: ['other-call', 'stalled', ...operations.map(({ id }) => id), 'same-branch', 'returned-sum'],
};
