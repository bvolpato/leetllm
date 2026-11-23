import {
  completed,
  cpuBytesPerSlot,
  cpuIds,
  editedCpuIds,
  firstDifference,
  movement,
  tailScore,
} from '../replay.mjs';
import { ruler, slot } from '../strips.mjs';

const prefix = cpuIds.slice(0, -1);
const start = 465;
const step = 255;
function idRow(ctx, api, name, values, y, color, different = -1) {
  api.text(ctx, name, 100, y + 65, 40, color);
  for (let i = 0; i < 5; i++)
    slot(ctx, api, {
      x: start + i * step,
      y,
      width: step,
      word: values[i],
      color: i === different ? api.C.pink : color,
      size: 55,
    });
}

function scoreScale(ctx, api, cached, full, verdict) {
  const { C } = api;
  const lo = -0.24,
    hi = -0.12,
    left = 580,
    right = 1470;
  const at = (value) => left + ((right - left) * (value - lo)) / (hi - lo);
  api.text(
    ctx,
    'Next-token score for vocabulary ID ' + tailScore.vocabularyId,
    100,
    712,
    42,
    C.ink,
  );
  api.text(ctx, verdict, 1790, 709, 30, C.muted, 'right');
  for (const [label, score, y, color] of [
    ['Cached forward', cached, 800, C.cyan],
    ['Full forward', full, 891, C.blue],
  ]) {
    api.text(ctx, label, 100, y + 11, 36, color);
    api.line(ctx, left, y, right, y, C.muted, 2);
    if (score !== null) api.circle(ctx, at(score), y, 14, color);
    api.text(
      ctx,
      score === null ? '?' : score.toFixed(3).replace('-', '−'),
      1788,
      y + 16,
      47,
      score === null ? C.muted : color,
      'right',
    );
  }
  for (const value of [-0.24, -0.2, -0.16, -0.12]) {
    api.line(ctx, at(value), 912, at(value), 925, C.muted, 2);
    api.text(ctx, value.toFixed(2).replace('-', '−'), at(value), 969, 29, C.muted, 'center');
  }
}

function drawReplay(ctx, state, api) {
  const { C } = api;
  const edited = completed(state, 0, 'prefix-edit');
  const rebuilt = completed(state, 1, 'prefix-rebuild');
  const request = edited ? editedCpuIds : cpuIds;
  const source = rebuilt ? request.slice(0, -1) : prefix;
  const difference = firstDifference(source, request.slice(0, 4));
  api.text(ctx, 'CPU fixture   /   float32   /   seed 7', 1800, 242, 28, C.muted, 'right');
  ruler(ctx, api, start, 312, step, 5);
  idRow(ctx, api, 'Saved prefix IDs', source, 342, C.cyan, difference);
  idRow(ctx, api, 'Request IDs', request, 511, C.blue, difference);
  if (movement(state, 0, 'prefix-tail') > 0) {
    const tailX = start + 4.5 * step;
    api.text(ctx, 'Tail ID', tailX, 488, 29, C.yellow, 'center');
  }
  api.text(ctx, 'cached_ids == request_ids[:4]', 100, 247, 39, C.ink, 'left', 'mono');
  const failed = completed(state, 1, 'prefix-fail');
  const hasVerdict = edited ? state.beat === 1 : completed(state, 0, 'prefix-match');
  api.text(
    ctx,
    hasVerdict ? (difference === -1 ? 'True' : 'False') : '?',
    850,
    247,
    47,
    hasVerdict ? (difference === -1 ? C.green : C.pink) : C.yellow,
  );
  const measured = completed(state, 0, 'prefix-match');
  const cached = measured ? (rebuilt ? tailScore.edited : tailScore.original) : null;
  const full = edited ? (failed ? tailScore.edited : null) : measured ? tailScore.original : null;
  const verdict =
    !completed(state, 0, 'prefix-checked') || (edited && !failed) || (rebuilt && !completed(state, 1, 'prefix-rechecked'))
      ? '32 logits to compare'
      : failed && !rebuilt
        ? '32-logit check fails'
        : '32-logit check passes';
  scoreScale(ctx, api, cached, full, verdict);
  api.text(ctx, 'Compare all 32 logits with atol 1e−6 and rtol 1e−5.', 100, 1040, 27, C.muted);
}

function drawFork(ctx, state, api) {
  const { C } = api;
  const copies = completed(state, 2, 'prefix-copy');
  const first = completed(state, 2, 'prefix-a');
  const second = completed(state, 2, 'prefix-b');
  const wrong = completed(state, 2, 'prefix-wrong');
  api.text(ctx, 'Independent continuations from the same prefix', 100, 270, 48, C.ink);
  ruler(ctx, api, start, 352, step, 5);
  idRow(ctx, api, 'Request A', first ? [...prefix, 2] : prefix, 392, C.blue);
  idRow(ctx, api, 'Copy for B', copies ? (second ? [...prefix, 3] : prefix) : [], 602, C.cyan);
  if (wrong) {
    api.text(ctx, 'If B appended to A instead', 100, 856, 37, C.pink);
    api.text(ctx, '[1, 7, 9, 4, 2, 3]', 760, 856, 51, C.pink, 'left', 'mono');
    api.text(ctx, 'B needs 3 immediately after 4.', 760, 947, 36, C.ink);
  }
}

function drawBytes(ctx, state, api) {
  const { C } = api;
  const live = cpuIds.length;
  const capacity = 16;
  api.text(ctx, '2 layers × K and V × 2 heads × 8 values × 4 bytes', 100, 298, 44, C.ink);
  api.text(ctx, cpuBytesPerSlot + ' bytes per position', 100, 376, 44, C.cyan);
  const cases = [
    ['Dynamic', live, 'prefix-dynamic'],
    ['Static', capacity, 'prefix-static'],
  ];
  cases.forEach(([name, slots, cue], j) => {
    const y = 465 + j * 219;
    api.text(ctx, name, 100, y + 65, 37, C.ink);
    for (let i = 0; i < capacity; i++) {
      const x = 396 + i * 62;
      if (i < slots) api.rect(ctx, x, y, 51, 92, i < live ? C.cyan : C.panel, C.cyan, 4);
    }
    const answer = completed(state, 3, cue);
    api.text(
      ctx,
      answer ? (slots * cpuBytesPerSlot).toLocaleString('en-US') + ' bytes' : 'Payload ?',
      1430,
      y + 62,
      40,
      answer ? C.cyan : C.muted,
    );
    api.text(ctx, live + ' live   /   ' + slots + ' allocated', 396, y + 143, 31, C.muted);
  });
}

export function drawCacheIdentity(ctx, scene, state, api) {
  if (state.beat < 2) return api.focus.target('prefix-replay', () => drawReplay(ctx, state, api));
  if (state.beat === 2) return api.focus.target('prefix-fork', () => drawFork(ctx, state, api));
  return api.focus.target('prefix-bytes', () => drawBytes(ctx, state, api));
}

export default {
  id: 'cache-identity',
  draw: drawCacheIdentity,
  cues: [
    'prefix-tail',
    'prefix-match',
    'prefix-checked',
    'prefix-edit',
    'prefix-ask',
    'prefix-where',
    'prefix-fail',
    'prefix-rebuild',
    'prefix-rechecked',
    'prefix-copy',
    'prefix-a',
    'prefix-b',
    'prefix-wrong',
    'prefix-dynamic',
    'prefix-static',
  ],
};
