import { capacityFixture } from '../arithmetic.mjs';
import { bracket, passage, scaleTime, spoken } from '../trace.mjs';

const promptPositions = 8192;
const chunks = 4;
const occupiedMs = 200;
const ordinaryGap = 35;
const link = 200e9 / 8;
const bytesPerPosition = capacityFixture().perToken;

function worker(ctx, api, state) {
  const { C } = api;
  const split = passage(state, 1, 'split-prompt', 0.21, 0.49);
  if (split === 0) {
    const end = occupiedMs + ordinaryGap;
    const x = scaleTime(0, end, 180, 1710);
    const prompt = passage(state, 0, 'exclusive-work', 0.37, 0.64);
    const decode = passage(state, 0, 'decode-turn', 0.67, 0.82);
    api.text(ctx, 'One shared worker   ·   example timings', 145, 279, 36, C.muted);
    api.text(ctx, 'Chat token leaves', x(0), 419, 36, C.cyan);
    api.line(ctx, x(0), 478, x(end), 478, C.muted, 3);
    api.circle(ctx, x(0), 478, 12, C.cyan);
    api.text(ctx, '0 ms', x(0), 546, 31, C.ink, 'center');
    if (prompt > 0) {
      api.rect(ctx, x(0), 616, (x(occupiedMs) - x(0)) * prompt, 75, C.blue, undefined, 2);
      if (prompt === 1) api.text(ctx, 'New prompt   ·   200 ms', x(100), 742, 36, C.blue, 'center');
    }
    if (decode > 0) {
      api.rect(
        ctx,
        x(occupiedMs),
        616,
        (x(end) - x(occupiedMs)) * decode,
        75,
        C.cyan,
        undefined,
        2,
      );
      if (decode === 1) {
        api.text(
          ctx,
          'Chat   ·   35 ms',
          x(occupiedMs + ordinaryGap / 2),
          742,
          31,
          C.cyan,
          'center',
        );
        api.circle(ctx, x(end), 478, 12, C.cyan);
        api.text(ctx, 'Next chat token', x(end), 419, 36, C.cyan, 'right');
      }
    }
    const known = spoken(state, 1, 'stall-total', 0.13);
    bracket(
      ctx,
      api,
      x(0),
      x(end),
      843,
      C.yellow,
      known ? end + ' ms between chat tokens' : 'Time between chat tokens?',
      42,
    );
    return;
  }
  api.text(ctx, 'Same worker and prompt   ·   order of turns', 145, 279, 36, C.muted);
  api.text(ctx, '8,192 prompt tokens', 170, 389, 38, C.blue);
  const insert = passage(state, 1, 'interleave-decode', 0.5, 0.68);
  const addedTurns = chunks * insert;
  const unit = 250;
  const chatWidth = 140;
  for (let i = 0; i < chunks; i++) {
    const x = 174 + i * unit + Math.min(i, addedTurns) * chatWidth;
    const gap = 12 * split;
    api.rect(ctx, x + gap, 446, unit - gap, 91, C.blue, undefined, 2);
    if (split === 1)
      api.text(
        ctx,
        (promptPositions / chunks).toLocaleString('en-US'),
        x + unit / 2,
        505,
        35,
        C.bg,
        'center',
      );
    const turn = Math.max(0, Math.min(1, addedTurns - i));
    if (turn > 0) {
      api.rect(ctx, x + unit + 4, 446, (chatWidth - 8) * turn, 91, C.cyan, undefined, 2);
      if (turn === 1) {
        const middle = x + unit + chatWidth / 2;
        api.text(ctx, 'Chat', middle, 505, 31, C.bg, 'center');
        api.line(ctx, middle, 554, middle, 625, C.cyan, 4);
        api.circle(ctx, middle, 641, 12, C.cyan);
        api.text(ctx, '+1 token', middle, 704, 31, C.cyan, 'center');
      }
    }
  }
  api.text(
    ctx,
    addedTurns >= 1
      ? 'The chat can emit a token after a chunk finishes.'
      : 'Where can the live chat run?',
    960,
    866,
    45,
    C.ink,
    'center',
  );
  api.text(
    ctx,
    'Chunk widths count positions. Turn durations depend on the workload.',
    960,
    965,
    30,
    C.muted,
    'center',
  );
}

function handoff(ctx, api, state) {
  const { C } = api;
  const long = state.beat === 3;
  const progress = passage(state, long ? 3 : 2, long ? 'send-long' : 'send-short', 0.1, 0.45);
  const shortPositions = 4096;
  const longer = progress > 0 && long;
  const positions = shortPositions * (longer ? 16 : 1);
  const bytes = positions * bytesPerPosition;
  const floor = (bytes / link) * 1000;
  const shortFloor = ((shortPositions * bytesPerPosition) / link) * 1000;
  const groups = long ? 1 + Math.floor(15 * progress) : Math.floor(progress);
  api.text(ctx, 'Prefill worker', 180, 337, 43, C.blue);
  api.text(ctx, 'Decode worker', 1725, 337, 43, C.cyan, 'right');
  api.line(ctx, 200, 445, 1710, 445, C.muted, 3);
  api.text(ctx, '200 Gbit/s  =  25 GB/s', 960, 389, 35, C.muted, 'center');
  for (let i = 0; i < groups; i++) {
    const x = 200 + i * 94;
    api.rect(ctx, x, 505, 83, 105, C.cyan, undefined, 2);
  }
  api.text(
    ctx,
    'Each block carries the raw KV for 4,096 positions (0.25 GiB).',
    960,
    701,
    34,
    C.ink,
    'center',
  );
  if (groups > 0) {
    api.text(
      ctx,
      (groups * shortPositions).toLocaleString('en-US') +
        ' positions   ·   ' +
        ((groups * shortPositions * bytesPerPosition) / 1e9).toFixed(3) +
        ' GB',
      960,
      828,
      46,
      C.cyan,
      'center',
    );
  }
  const known = long ? spoken(state, 3, 'long-floor', 0.52) : spoken(state, 2, 'short-floor', 0.78);
  if (known || (long && groups === 1))
    api.text(
      ctx,
      'Ideal payload transmission time   ≈   ' + (known ? floor : shortFloor).toFixed(1) + ' ms',
      960,
      953,
      46,
      C.yellow,
      'center',
    );
}

export function drawChunkAndHandoff(ctx, scene, state, api) {
  if (state.beat < 2) api.focus.target('worker', () => worker(ctx, api, state));
  else api.focus.target('handoff', () => handoff(ctx, api, state));
}

export default {
  id: 'chunk-and-handoff',
  draw: drawChunkAndHandoff,
  cues: [
    'exclusive-work',
    'decode-turn',
    'stall-total',
    'split-prompt',
    'interleave-decode',
    'send-short',
    'short-floor',
    'send-long',
    'long-floor',
  ],
};
