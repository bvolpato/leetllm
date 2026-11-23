import { edgeOwnership } from '../arithmetic.mjs';
import { freshEdgeReadout } from '../model.mjs';
import { chapterText, footer } from '../defaults.mjs';

const edge = edgeOwnership(67, 2, 0);
const pair = edge.pairs.find(({ producer }) => producer.row === 1 && producer.col === 64);
const columns = new Set(edge.producers.map((entry) => entry.col));
const loadThreads = new Set(edge.producers.map((entry) => entry.thread.join(',')));
const key = (s) => 'gpu-fresh-trial-' + s;

function drawEdge(ctx, state, api) {
  const { C, focus } = api;
  const answer = freshEdgeReadout(state.cues);
  const matrixX = 345,
    matrixY = 339,
    size = 14;
  const gridX = 1044,
    gridY = 418;
  chapterText(
    ctx,
    api,
    'N = 67     ·     block (2, 0)     ·     tile begins at input column 64',
    960,
    238,
    36,
  );
  focus.target('fresh-tile', () => {
    chapterText(ctx, api, 'Input tile  ·  32 rows', 568, 305, 34, C.blue);
    const selected = answer.value !== null;
    for (let r = 0; r < 32; r++)
      for (let c = 0; c < 32; c++) {
        const inside = columns.has(64 + c);
        const fill = selected && r === 1 && c === 0 ? C.yellow : inside ? C.blue : C.panel;
        api.rect(
          ctx,
          matrixX + c * size,
          matrixY + r * size,
          size - 1,
          size - 1,
          fill,
          undefined,
          0,
        );
      }
    chapterText(ctx, api, '64–66 valid', matrixX - 20, matrixY + 49, 29, C.blue, 'right');
    chapterText(ctx, api, 'Columns 67–95 fall outside the input', 568, 838, 28, C.muted);
  });
  focus.target('fresh-threads', () => {
    chapterText(ctx, api, 'Block  ·  32 × 8 threads', 1370, 305, 34, C.cyan);
    for (let ty = 0; ty < 8; ty++)
      for (let tx = 0; tx < 32; tx++) {
        const isLoader = loadThreads.has([tx, ty].join(','));
        const color =
          answer.barrierArrivals !== null
            ? C.green
            : answer.producerCount !== null && isLoader
              ? C.blue
              : '#424955';
        api.circle(ctx, gridX + tx * 21, gridY + ty * 37, 7.5, color);
      }
    chapterText(
      ctx,
      api,
      answer.barrierArrivals !== null
        ? '256 arrivals at the block barrier'
        : answer.producerCount !== null
          ? '24 loading threads × 4 values each'
          : 'Each dot is one thread',
      1370,
      779,
      32,
      answer.barrierArrivals !== null ? C.green : C.muted,
    );
  });
  focus.target('fresh-answer', () => {
    const text =
      answer.value !== null
        ? `A[1, 64] = ${pair.producer.value}     →     shared[1, 0]     →     B[64, 1]`
        : answer.producerCount !== null
          ? `32 rows × ${columns.size} columns = ${answer.producerCount} valid loads`
          : 'How many values get loaded? How many threads reach the barrier?';
    chapterText(ctx, api, text, 960, 922, 39, C.yellow);
    footer(
      ctx,
      api,
      answer.outputIndex !== null
        ? `Warp 1 writes   ·   warp 0 reads   ·   output index 64 × 67 + 1 = ${answer.outputIndex}`
        : 'Edge coordinates calculated on CPU',
    );
  });
}

function drawTrial(ctx, state, api) {
  const { C, focus } = api;
  const done = (s) => focus.cue(key(s))?.phase === 'after';
  const combined = done('geometry');
  const split = done('split');
  chapterText(
    ctx,
    api,
    'Hypothetical trial   ·   relative average time   ·   baseline = 100',
    960,
    249,
    35,
    C.muted,
  );
  const recipe = (x, name, stride, rows, time, color) => {
    chapterText(ctx, api, name, x, 353, 38, color);
    const left = x - 128,
      top = 408;
    // Thirty-two rows of data retain their footprint as the extra word is added at the right.
    api.rect(ctx, left, top, 256, 160, '#253447', C.blue, 0);
    for (let i = 1; i < 32; i++) {
      api.line(ctx, left + i * 8, top, left + i * 8, top + 160, '#485466', 1);
      api.line(ctx, left, top + i * 5, left + 256, top + i * 5, '#485466', 1);
    }
    if (stride > 32) api.rect(ctx, left + 256, top, 8, 160, C.yellow, undefined, 0);
    chapterText(ctx, api, `Shared stride  ${stride} words`, x, 620, 32, color);
    if (rows === null) return;
    for (let r = 0; r < rows; r++) api.rect(ctx, left, 651 + r * 4, 256, 3, C.cyan, undefined, 0);
    chapterText(ctx, api, `Block  32 × ${rows}`, x, 766, 32, C.cyan);
    chapterText(ctx, api, time, x, 851, 42, C.ink);
  };
  recipe(380, 'Baseline', 32, 8, '100', C.blue);
  focus.target('trial-combined', () => {
    if (combined) recipe(1540, 'Combined edit', 33, 16, done('compound') ? '94' : '·', C.yellow);
    else chapterText(ctx, api, 'Combined edit', 1540, 353, 38, C.muted);
  });
  focus.target('trial-control', () => {
    if (done('stride'))
      recipe(
        960,
        'Padding alone',
        33,
        split ? 8 : null,
        done('next') ? 'Run next' : 'Measure',
        C.green,
      );
    else {
      chapterText(ctx, api, 'First comparison', 960, 353, 38, C.muted);
      chapterText(ctx, api, '?', 960, 576, 110, C.yellow);
    }
  });
  if (split) {
    api.arrow(ctx, 598, 492, 737, 492, C.yellow, 4);
    if (done('decision')) api.arrow(ctx, 1180, 687, 1320, 687, C.cyan, 4);
  }
  let prompt = 'Which stride and block shape belong in the middle to test padding first?';
  if (done('stride')) prompt = 'Which block shape stays fixed?';
  if (split) prompt = 'Left to middle   ·   Add one word to each shared row';
  if (done('decision'))
    prompt = 'Middle to right   ·   Double the block rows with padding in place';
  if (done('next')) prompt = 'Time the padded tile with the original 32 × 8 block';
  if (state.beat === 5) prompt = 'Next lab   ·   Reductions and scans across lanes';
  focus.target('trial-decision', () => chapterText(ctx, api, prompt, 960, 946, 35, C.ink));
}
export function drawFreshTrial(ctx, scene, state, api) {
  if (state.beat < 3) drawEdge(ctx, state, api);
  else drawTrial(ctx, state, api);
}
export default {
  id: 'fresh-trial',
  draw: drawFreshTrial,
  cues: [
    'premises',
    'values',
    'barrier',
    'value',
    'index',
    'geometry',
    'compound',
    'stride',
    'split',
    'decision',
    'next',
  ].map(key),
};
