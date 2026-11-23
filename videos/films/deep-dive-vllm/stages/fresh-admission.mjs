import { vvProgress, vvState } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';
import { firstTokenRuler } from '../first-token.mjs';

const freeBlocks = 3;
const blockSize = 4;
const durations = [7, 65, 24, 6];

export function drawFreshAdmission(ctx, scene, state, api) {
  const { C } = api;
  const s = vvState('fresh-admission', state);
  const p = (id, b) => vvProgress(state, 'vv-fresh-admission-' + id, b);
  const group = (name, fn) => api.focus.target('fresh-' + name, fn);

  if (s.b >= 4) {
    const clock = durations.reduce(
      (sum, duration, i) => sum + duration * p(['input', 'queue', 'prefill', 'delivery'][i], 4),
      0,
    );
    group('clock', () => {
      api.text(ctx, 'A separate request for adapter A', 135, 267, 44, C.ink);
      api.text(ctx, 'Supplied timings', 1775, 265, 32, C.muted, 'right');
      firstTokenRuler(ctx, api, durations, clock, 390);
    });
    group('diagnosis', () => {
      if (p('question', 4) > 0 && !s.latencyReady) {
        api.text(ctx, 'Which interval would you open first?', 960, 784, 45, C.yellow, 'center');
      }
      if (s.latencyReady) {
        api.text(ctx, '65 ms in the engine queue', 960, 760, 53, C.pink, 'center');
        api.text(
          ctx,
          'Check the token budget and free blocks at each admission attempt.',
          960,
          876,
          38,
          C.ink,
          'center',
        );
        if (p('dispatch', 5) === 1) {
          api.text(
            ctx,
            'Both available? Check when the scheduler sent the work.',
            960,
            956,
            38,
            C.ink,
            'center',
          );
        }
      }
    });
    return;
  }

  const matching = p('matches', 0) > 0;
  const showStock = p('resources', 0) > 0;
  const hitP = p('matching-blocks', 3);
  const placed = s.restored
    ? Math.ceil(blockSize * p('tail-four', 3)) + Math.ceil(p('tail-one', 3))
    : ['first-four', 'next-four', 'third-four'].reduce(
        (n, cue) => n + Math.ceil(blockSize * p(cue, 1)),
        0,
      ) + Math.ceil(p('overflow', 1));
  const highlighted = s.restored ? Math.floor(s.skipped * hitP + 1e-8) : 0;
  const tokenX = (i) => 202 + i * 104 + Math.floor(i / blockSize) * 25;

  group('prompt', () => {
    api.text(ctx, 'Q requests adapter ' + (s.restored ? 'A' : 'B'), 140, 258, 40, C.ink);
    api.text(ctx, '13 prompt positions   ·   4 positions per block', 1775, 255, 31, C.ink, 'right');
    for (let i = 0; i < 13; i++) {
      tokenCell(
        api,
        'q' + i,
        tokenX(i),
        306,
        97,
        87,
        i < highlighted ? C.green : C.pink,
        i < highlighted,
      );
    }
    if (matching) {
      api.line(ctx, tokenX(0), 414, tokenX(9) + 97, 414, C.cyan, 4);
      api.text(ctx, 'First 10 token IDs match the live prefix under A', tokenX(0), 473, 31, C.cyan);
    }
  });
  if (showStock)
    group('pool', () => {
      api.text(ctx, 'New KV storage   ·   3 blocks free at the start', 140, 586, 36, C.ink);
      api.text(ctx, 'Step cap 14   ·   1 active decode', 1780, 585, 35, C.blue, 'right');
      const visibleBlocks = s.restored
        ? freeBlocks
        : Math.max(freeBlocks, Math.ceil(placed / blockSize));
      for (let block = 0; block < visibleBlocks; block++) {
        const x = 145 + block * 421;
        const overflow = block >= freeBlocks;
        for (let j = 0; j < blockSize; j++) {
          const n = block * blockSize + j;
          const assigned = n < placed;
          tokenCell(
            api,
            assigned ? 'q' + (s.skipped + n) : '',
            x + j * 91,
            634,
            85,
            85,
            overflow ? C.yellow : C.cyan,
            assigned && !overflow,
            29,
          );
        }
        api.line(ctx, x, 740, x + 358, 740, overflow ? C.yellow : C.cyan, 3);
        api.text(
          ctx,
          overflow ? 'No fourth block' : 'Block ' + (block + 1),
          x,
          797,
          30,
          overflow ? C.yellow : C.cyan,
        );
      }
    });
  group('decision', () => {
    let caption = '';
    let detail = '';
    if (p('whole-prompt', 0) > 0) caption = 'Can the entire prompt run with the active decode?';
    if (s.miss) detail = 'skip 0 · compute 13';
    if (s.wait) caption = `${s.used} inputs fit · ${s.blocks} blocks >${freeBlocks} free → wait`;
    if (s.restored) {
      if (s.counts) detail = `skip ${s.skipped} · compute ${s.compute}`;
      else if (hitP === 1) detail = `skip ${s.skipped}`;
      if (s.admitted)
        caption = `${s.used} of 14 inputs   ·   ${s.blocks} of 3 new blocks   ·   entire prompt fits`;
      else if (s.b === 2)
        caption = 'Same tokens. This request asks for A. Does the entire prompt fit?';
      else if (s.b === 3) caption = '';
    }
    if (detail) api.text(ctx, detail, 960, 900, 34, C.ink, 'center');
    if (caption) api.text(ctx, caption, 960, 995, 41, s.admitted ? C.green : C.yellow, 'center');
  });
}

export default {
  id: 'fresh-admission',
  draw: drawFreshAdmission,
  cues: [
    'matches',
    'resources',
    'whole-prompt',
    'miss',
    'first-four',
    'next-four',
    'third-four',
    'overflow',
    'memory-wait',
    'restore-adapter',
    'matching-blocks',
    'hit-counts',
    'tail-four',
    'tail-one',
    'hit-admitted',
    'input',
    'queue',
    'prefill',
    'delivery',
    'question',
    'latency-total',
    'dispatch',
  ].map((id) => 'vv-fresh-admission-' + id),
};
