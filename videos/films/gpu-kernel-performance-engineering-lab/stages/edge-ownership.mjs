import { edgeOwnership } from '../arithmetic.mjs';
import { chapterText } from '../defaults.mjs';

const edge = edgeOwnership(33, 1, 0);
const pairs = edge.pairs.toSorted((a, b) => a.producer.row - b.producer.row);
const { producer, consumer } = pairs[1];
const key = (name) => 'gpu-edge-ownership-' + name;

function drawHandoff(ctx, api) {
  const { C, focus } = api;
  const done = (name) => focus.cue(key(name))?.phase === 'after';
  const shared = 'shared[' + producer.shared.join(', ') + ']';
  const cells = [
    {
      x: 330,
      label: 'Input',
      address: 'A[1, 32]',
      target: 'handoff-input',
      ready: done('value'),
      color: C.blue,
    },
    {
      x: 960,
      label: 'Shared memory',
      address: shared,
      target: 'handoff-shared',
      ready: done('producer'),
      color: C.yellow,
    },
    {
      x: 1590,
      label: 'Output',
      address: 'B[32, 1]',
      target: 'handoff-output',
      ready: done('output'),
      color: C.cyan,
    },
  ];
  for (const cell of cells) {
    focus.target(cell.target, () => {
      chapterText(ctx, api, cell.label, cell.x, 360, 42, cell.color);
      api.rect(ctx, cell.x - 168, 412, 336, 225, cell.ready ? '#253547' : C.panel, cell.color, 10);
      if (cell.ready) chapterText(ctx, api, producer.value, cell.x, 567, 118, cell.color);
      chapterText(ctx, api, cell.address, cell.x, 714, 38, cell.color);
    });
  }
  const moves = [
    {
      x: 504,
      end: 786,
      warp: producer.warp,
      thread: producer.thread,
      cue: 'producer',
      verb: 'writes',
      target: 'handoff-write',
    },
    {
      x: 1134,
      end: 1416,
      warp: consumer.warp,
      thread: consumer.thread,
      cue: 'output',
      verb: 'reads',
      target: 'handoff-read',
    },
  ];
  for (const move of moves) {
    focus.target(move.target, () => {
      const p = focus.progress(key(move.cue), 0);
      const color = p > 0 ? C.yellow : C.muted;
      const middle = (move.x + move.end) / 2;
      chapterText(ctx, api, 'Warp ' + move.warp + ' ' + move.verb, middle, 462, 30, color);
      api.arrow(ctx, move.x + 8, 525, move.end - 8, 525, color, 4);
      chapterText(ctx, api, 'thread (' + move.thread.join(', ') + ')', middle, 614, 27, color);
      if (p > 0 && p < 1) {
        const x = api.lerp(move.x + 32, move.end - 32, p);
        api.circle(ctx, x, 525, 32, C.yellow);
        chapterText(ctx, api, producer.value, x, 536, 32, C.bg);
      }
    });
  }
  const message = done('output')
    ? 'Output index   32 × 33 + 1 = ' + consumer.index
    : done('producer')
      ? 'Block barrier   ·   all 256 threads arrive before warp 0 reads'
      : done('value')
        ? 'Input word   1 × 33 + 32 = ' + producer.value
        : 'Input word   1 × 33 + 32';
  chapterText(ctx, api, message, 960, 892, 37, C.ink);
}

function drawEdge(ctx, state, api) {
  const { C, focus } = api;
  const scanning = state.beat === 2;
  const progress = (name) => focus.progress(key(name), 0);
  const stored = scanning ? pairs.length : Math.floor(pairs.length * progress('writes'));
  const checked = Math.floor(pairs.length * progress('unique'));
  const arrivals = scanning
    ? edge.barrierArrivals
    : Math.floor(edge.barrierArrivals * progress('barrier'));
  chapterText(ctx, api, '33 × 33 input    ·    block (1, 0) begins at column 32', 960, 239, 35);
  focus.target('edge-column', () => {
    chapterText(ctx, api, 'Input column 32', 456, 326, 40, C.blue);
    for (const [i, pair] of pairs.entries()) {
      const y = 365 + i * 13;
      const color = scanning && i < checked ? C.cyan : i < stored ? C.blue : '#384960';
      api.rect(ctx, 411, y, 92, 11, color, undefined, 1);
      for (let col = 1; col <= 3; col++)
        api.rect(ctx, 411 + col * 92, y, 85, 11, C.panel, undefined, 1);
      if (i % 8 === 0)
        chapterText(
          ctx,
          api,
          'Rows ' + pair.producer.row + '–' + (pair.producer.row + 7),
          383,
          y + 58,
          29,
          !scanning &&
            focus.cue(key('offsets'))?.phase === 'during' &&
            Math.floor(progress('offsets') * 4) === i / 8
            ? C.yellow
            : C.muted,
          'right',
        );
    }
    chapterText(ctx, api, 'Columns 33 onward fall outside the input', 505, 851, 28, C.muted);
  });
  if (scanning) {
    focus.target('edge-output', () => {
      chapterText(ctx, api, 'Output row 32', 1375, 326, 40, C.cyan);
      for (const [i, pair] of pairs.entries()) {
        const x = 990 + pair.consumer.col * 24;
        api.rect(ctx, x, 485, 21, 100, i < checked ? C.cyan : C.panel, C.line, 2);
      }
      chapterText(ctx, api, 'Column 0', 990, 638, 29, C.muted, 'left');
      chapterText(ctx, api, '31', 1757, 638, 29, C.muted, 'right');
      chapterText(
        ctx,
        api,
        checked + ' / ' + pairs.length + ' destinations checked',
        1375,
        753,
        36,
        C.cyan,
      );
    });
  } else {
    focus.target('edge-barrier', () => {
      chapterText(ctx, api, '32 × 8 threads', 1375, 326, 40, C.cyan);
      for (let i = 0; i < edge.barrierArrivals; i++) {
        const loader = i % 32 === 0 && Math.floor(i / 32) < stored;
        const color = i < arrivals ? C.green : loader ? C.blue : '#454d5a';
        api.circle(ctx, 1004 + (i % 32) * 24, 407 + Math.floor(i / 32) * 45, 8, color);
      }
      chapterText(
        ctx,
        api,
        arrivals + ' / ' + edge.barrierArrivals + ' barrier arrivals',
        1375,
        837,
        36,
        C.green,
      );
    });
  }
  focus.target('edge-summary', () => {
    const message = scanning
      ? 'A[row, 32]   →   B[32, row]      ·      every thread joins the barrier'
      : stored === 32
        ? '32 input words fill one shared column'
        : 'Only one column fits in this tile';
    chapterText(ctx, api, message, 960, 955, 36, C.ink);
  });
}

export default {
  id: 'edge-ownership',
  draw(ctx, scene, state, api) {
    if (state.beat === 1) drawHandoff(ctx, api);
    else drawEdge(ctx, state, api);
  },
  cues: [
    'block',
    'offsets',
    'writes',
    'barrier',
    'value',
    'producer',
    'warp',
    'consumer',
    'output',
    'pair',
    'unique',
    'outside',
  ].map(key),
};
