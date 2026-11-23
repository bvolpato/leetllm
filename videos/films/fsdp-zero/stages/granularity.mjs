import { onWords } from '../card-memory.mjs';

const blockGB = 3.5;
const blocks = 4;
const gatherMs = 4;
const computeMs = 6;
const lateStart = 5;

function drawBlocks(ctx, api, state) {
  const { C } = api;
  const root = state.beat === 0;
  const gathered = onWords(state, api, 0, 'root-gather', 0.46, 0.68);
  const one = onWords(state, api, 1, 'one-block', 0.16, 0.29);
  const reuse = onWords(state, api, 1, 'reuse-buffer', 0.4, 0.56);
  const x = 330;
  const width = 314;
  const groupGap = root ? 4 : 28;
  api.text(ctx, root ? 'One group for the stack' : 'One group per block', 120, 283, 43, C.ink);
  for (let i = 0; i < blocks; i++) {
    const at = x + i * width;
    const active = root || i === (reuse >= 0.5 ? 1 : 0);
    api.rect(ctx, at, 386, width - groupGap, 102, C.panel, active ? C.blue : C.muted, 3);
    api.text(ctx, 'Block ' + (i + 1), at + (width - groupGap) / 2, 452, 37, active ? C.blue : C.muted, 'center');
    api.text(ctx, blockGB + ' GB', at + (width - groupGap) / 2, 545, 32, C.muted, 'center');
  }
  api.text(ctx, 'Gathered weights on one rank', x, 677, 37, C.ink);
  api.focus.target('gather-buffer', () => {
    api.rect(ctx, x, 724, width * blocks, 106, C.panel, C.muted, 3);
    if (root) {
      for (let i = 0; i < blocks; i++) {
        const amount = api.clamp(gathered * blocks - i);
        if (amount > 0)
          api.rect(ctx, x + i * width, 735, (width - 4) * amount, 84, C.blue, undefined, 0);
        if (amount === 1)
          api.text(ctx, 'Block ' + (i + 1), x + (i + 0.5) * width, 789, 32, C.bg, 'center');
      }
    } else {
      const amount = one * Math.abs(1 - 2 * reuse);
      if (amount > 0)
        api.rect(ctx, x, 735, (width - 4) * amount, 84, C.blue, undefined, 0);
      if (amount === 1)
        api.text(ctx, reuse === 1 ? 'Block 2' : 'Block 1', x + width / 2, 789, 32, C.bg, 'center');
    }
  });
  const note = root ? (gathered === 1 ? '4 × 3.5 GB = 14 GB together' : 'Request from block 1')
    : 'One 3.5 GB space can serve successive blocks';
  api.text(ctx, note, 960, 943, 43, C.ink, 'center');
}

function drawTiming(ctx, api, state) {
  const { C } = api;
  const x = ms => 440 + ms * 140;
  const shift = onWords(state, api, 2, 'late-gather', 0.64, 0.82);
  const wait = onWords(state, api, 3, 'exposed-wait', 0.01, 0.18);
  const resident = onWords(state, api, 3, 'prefetch-residency', 0.65, 0.8);
  const total = onWords(state, api, 3, 'prefetch-total', 0.85, 0.95);
  const deadline = x(computeMs);
  api.text(ctx, 'Block 2 needs weights', deadline, 263, 34, C.yellow, 'center');
  api.line(ctx, deadline, 284, deadline, 302, C.yellow, 3);
  api.line(ctx, deadline, 360, deadline, 710, C.yellow, 3);
  for (let i = 0; i <= 9; i++) {
    api.text(ctx, i + ' ms', x(i), 347, 25, i === computeMs ? C.yellow : C.muted, 'center');
  }
  const lane = (label, y, start, duration, color) => {
    api.text(ctx, label, x(0) - 35, y + 44, 32, C.ink, 'right');
    api.rect(ctx, x(start), y, x(duration) - x(0), 64, color, undefined, 1);
  };
  lane('Block 1 compute', 398, 0, computeMs, C.green);
  lane('Early gather', 495, 0, gatherMs, C.cyan);
  api.focus.target('prefetch-interval', () => {
    if (shift > 0) lane('Later gather', 599, lateStart * shift, gatherMs, C.cyan);
    else api.text(ctx, 'Same 4 ms transfer', x(0), 644, 30, C.muted);
  });
  api.focus.target('exposed-wait', () => {
    const missed = lateStart + gatherMs - computeMs;
    if (wait > 0) {
      api.line(ctx, deadline, 705, x(computeMs + missed * wait), 705, C.pink, 8);
      if (wait === 1)
        api.text(ctx, missed + ' ms waiting', (deadline + x(lateStart + gatherMs)) / 2, 766, 36, C.pink, 'center');
    } else if (shift === 1)
      api.text(ctx, 'How long does block 2 wait?', 960, 776, 41, C.ink, 'center');
  });
  api.focus.target('prefetch-live', () => {
    if (resident > 0) {
      api.circle(ctx, x(gatherMs), 527, 12, C.cyan);
      api.text(ctx, 'At ' + gatherMs + ' ms', 150, 883, 39, C.cyan);
      api.text(ctx, 'Early gather complete', 150, 936, 31, C.ink);
      api.rect(ctx, 595, 857, 310, 92, C.blue, undefined, 3);
      api.text(ctx, 'Block 1   3.5 GB', 750, 914, 31, C.bg, 'center');
      api.rect(ctx, 914, 857, 310 * resident, 92, C.cyan, undefined, 3);
      if (resident === 1) {
        api.text(ctx, 'Block 2   3.5 GB', 1069, 914, 31, C.bg, 'center');
        if (total === 1)
          api.text(ctx, '=  ' + 2 * blockGB + ' GB live', 1280, 917, 43, C.ink);
      }
    }
  });
}

export function drawGranularity(ctx, scene, state, api) {
  if (state.beat < 2) drawBlocks(ctx, api, state);
  else drawTiming(ctx, api, state);
}

export default {
  id: 'granularity', draw: drawGranularity,
  cues: ['root-gather', 'one-block', 'reuse-buffer', 'late-gather', 'exposed-wait', 'prefetch-residency', 'prefetch-total'],
};
