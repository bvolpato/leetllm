import { memoryInventory } from '../model.mjs';
import { completed, operation } from '../construction.mjs';
import { text } from '../defaults.mjs';
function drawStaticByteInventory(ctx, scene, state, api) {
  if ((state.beat ?? 0) < 3) return false;
  const { C } = api;
  api.focus.target('memory-extension-4', () => {
    text(ctx, api, 'Assemble the static bytes of one parameter', 960, 270, 38, C.cyan, 'center');
    const base = [
      ['weight', 4],
      ['gradient', 4],
      ['m', 4],
      ['v', 4],
    ];
    const master = [
      ['w', 2],
      ['g', 2],
      ['master w', 4],
      ['moments', 8],
    ];
    const rows = [
      {
        name: 'FP32 inventory',
        parts: base,
        progress: operation(state, 'memory-fp32-parts'),
        ready: completed(state, 'memory-fp32-total'),
      },
      {
        name: 'Master-copy recipe',
        parts: master,
        progress: operation(state, 'memory-master-parts'),
        ready: completed(state, 'memory-master-total'),
      },
      {
        name: 'Optional staging',
        parts: [...master, ['staging', 4]],
        progress: completed(state, 'memory-master-total')
          ? 4 + operation(state, 'memory-staging')
          : 0,
        ready: completed(state, 'memory-staging'),
        counted: true,
      },
    ];
    rows.forEach((row, i) => {
      const y = 390 + i * 205;
      const amount = row.counted ? row.progress : row.progress * row.parts.length;
      text(ctx, api, row.name, 175, y + 48, 27, C.muted);
      let x = 540,
        assembled = 0;
      row.parts.forEach(([name, bytes], j) => {
        const width = bytes * 55;
        const admitted = amount >= j + 1;
        const color = [C.blue, C.pink, C.yellow, C.green, C.cyan][j];
        api.rect(ctx, x, y, width, 85, C.panel, C.muted, 2);
        if (admitted) {
          api.rect(ctx, x, y, width, 85, color);
          assembled += bytes;
          text(ctx, api, `${name} ${bytes}`, x + width / 2, y + 54, 24, C.bg, 'center');
        }
        x += width;
      });
      text(
        ctx,
        api,
        row.ready ? `${assembled} B` : `${assembled} B assembled`,
        row.ready ? 1710 : 1080,
        row.ready ? y + 55 : y + 130,
        row.ready ? 34 : 24,
        row.ready ? C.ink : C.muted,
        'center',
      );
    });
    text(
      ctx,
      api,
      completed(state, 'memory-amp-total')
        ? 'Ordinary FP32-model AMP retains the same 16 static bytes'
        : 'Each rectangle keeps its true byte width while the inventory is assembled',
      960,
      335,
      28,
      completed(state, 'memory-amp-total') ? C.green : C.muted,
      'center',
    );
    text(
      ctx,
      api,
      'Activations, conversion, workspace and allocator bytes remain additional',
      960,
      1040,
      28,
      C.muted,
      'center',
    );
  });
  return true;
}
export function drawMemory(ctx, scene, state, api) {
  if (drawStaticByteInventory(ctx, scene, state, api)) return;
  const { C } = api;
  const beat = state.beat ?? 0;
  const fractionCast = beat < 1 ? 0 : beat > 1 ? 1 : operation(state, 'memory-contraction');
  const memory = memoryInventory(fractionCast);
  const start = 265,
    perGB = 282;
  const persistent = memory.baseline.slice(0, 3).reduce((sum, n) => sum + n, 0);
  const seam = start + persistent * perGB;
  const end = start + memory.original * perGB;
  const colors = [C.blue, C.pink, C.yellow, C.cyan];
  text(ctx, api, '100 million parameters', start, 285, 38, C.ink);
  text(ctx, api, '800 million selected activation values', seam + 130, 285, 38, C.ink);
  const rows = [
    {
      label: 'All four components in FP32',
      y: 456,
      parts: memory.baseline,
      total: memory.original,
    },
    { label: 'Cast selected activations', y: 705, parts: memory.current, total: memory.total },
  ];
  for (const row of rows) {
    let x = start;
    text(ctx, api, row.label, start, row.y - 42, 36, C.ink);
    api.focus.target('memory-components', () => {
      for (const [i, n] of row.parts.entries()) {
        const width = n * perGB;
        api.rect(ctx, x, row.y, width, 90, colors[i], undefined, 0);
        text(ctx, api, n.toFixed(1), x + width / 2, row.y + 59, 34, C.bg, 'center');
        x += width;
      }
    });
    text(ctx, api, row.total.toFixed(1) + ' GB', x, row.y - 42, 40, C.ink, 'right');
  }
  const labels = ['W', 'Grad', 'Adam m + v'];
  let x = start;
  for (const [i, width] of memory.baseline.slice(0, 3).entries()) {
    text(ctx, api, labels[i], x + (width * perGB) / 2, 603, 29, colors[i], 'center');
    x += width * perGB;
  }
  text(ctx, api, 'Saved activations', (seam + end) / 2, 603, 30, C.cyan, 'center');
  api.focus.target('memory-savings', () => {
    if (fractionCast > 0) {
      const edge = start + memory.total * perGB;
      api.line(ctx, edge, 837, end, 837, C.cyan, 4);
      for (const x of [edge, end]) api.line(ctx, x, 822, x, 844, C.cyan, 4);
      if (fractionCast === 1)
        text(
          ctx,
          api,
          memory.saved.toFixed(1) + ' GB freed',
          (edge + end) / 2,
          898,
          35,
          C.cyan,
          'center',
        );
    }
    const answered = beat > 1 || completed(state, 'memory-b2-1');
    const footer =
      fractionCast === 1
        ? 'Share of original inventory freed   ' +
          memory.saved.toFixed(1) +
          ' / ' +
          memory.original.toFixed(1) +
          '  =  ' +
          (answered ? (memory.fraction * 100).toFixed(1) + '%' : '?')
        : 'What fraction of the original 4.8 GB would the cast free?';
    text(ctx, api, footer, 960, 995, 38, fractionCast === 1 ? C.cyan : C.ink, 'center');
  });
}

export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'memory-b1-1',
    'memory-b2-1',
    'memory-contraction',
    'memory-b3-1',
    'memory-extension-4',
    'memory-fp32-parts',
    'memory-fp32-total',
    'memory-amp-total',
    'memory-master-parts',
    'memory-master-total',
    'memory-staging',
  ],
};
