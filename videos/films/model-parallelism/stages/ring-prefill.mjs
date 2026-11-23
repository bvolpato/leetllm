import { sceneClock } from '../scene-clock.mjs';
import { parallelRectangle, parallelText, parallelTile } from '../defaults.mjs';

const prefix = 'mp-ring-prefill-';
const blockCount = 4;

function drawOverlap(ctx, api, clock) {
  const x = 680,
    tickWidth = 310;
  const transfer = 2,
    prompt = 3,
    decode = 1;
  for (let tick = 0; tick <= prompt; tick++) {
    const at = x + tick * tickWidth;
    api.text(ctx, String(tick), at, 302, 35, api.C.ink, 'center');
    api.line(ctx, at, 318, at, 334, api.C.muted, 3);
  }
  api.text(ctx, 'Elapsed ticks', x - 50, 302, 35, api.C.muted, 'right');

  function lanes(top, label, compute, progress) {
    api.text(ctx, label, 205, top, 45, api.C.ink);
    const elapsed = Math.max(compute, transfer) * progress;
    for (const [row, name, duration, color] of [
      [0, 'Attention', compute, api.C.blue],
      [1, 'Receive next block', transfer, api.C.cyan],
    ]) {
      const y = top + 27 + row * 76;
      api.text(ctx, name, x - 48, y + 42, 34, color, 'right');
      const width = Math.min(elapsed, duration) * tickWidth;
      if (width > 0) api.rect(ctx, x, y, width, 58, color, undefined, 0);
    }
  }

  lanes(398, 'Prompt block', prompt, clock.progress(prefix + 'overlap'));
  const short = clock.progress(prefix + 'decode');
  if (short > 0) lanes(690, 'One decode query', decode, short);
  if (clock.done(prefix + 'wait')) {
    const width = (transfer - decode) * tickWidth;
    api.rect(ctx, x + decode * tickWidth, 717, width, 58, api.C.pink, undefined, 0);
    api.text(
      ctx,
      `Wait ${transfer - decode} tick`,
      x + decode * tickWidth + width / 2,
      758,
      35,
      api.C.bg,
      'center',
    );
  }
}

export function drawRingPrefill(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  api.focus.target('mp-ring-prefill-mechanism', () => {
    if (state.beat >= 2) {
      drawOverlap(ctx, api, clock);
      return;
    }
    const turns = clock.progress(prefix + 'shift') + 2 * clock.progress(prefix + 'visits');
    const whole = Math.floor(turns),
      travel = turns - whole;
    const colors = [api.C.blue, api.C.cyan, api.C.pink, api.C.yellow];
    parallelText(ctx, api, 'Four blocks of one prompt', 960, 300, 43, api.C.ink, 'center');
    for (let rank = 0; rank < blockCount; rank++) {
      const x = 190 + rank * 425;
      parallelRectangle(ctx, api, x, 390, 330, 165, rank === 0 ? api.C.blue : api.C.muted);
      parallelText(ctx, api, 'GPU ' + rank, x + 165, 447, 33, api.C.muted, 'center');
      parallelText(
        ctx,
        api,
        'Query ' + rank,
        x + 165,
        517,
        44,
        rank === 0 ? api.C.blue : api.C.ink,
        'center',
      );
    }
    for (let id = 0; id < blockCount; id++) {
      const source = (id + whole) % blockCount;
      let x = 245 + source * 425,
        y = 650;
      if (source < 3) x += 425 * travel;
      else if (travel < 0.2) y += 850 * travel;
      else if (travel < 0.8) {
        x -= (1275 * (travel - 0.2)) / 0.6;
        y = 820;
      } else {
        x = 245;
        y = 820 - 850 * (travel - 0.8);
      }
      parallelTile(ctx, api, 'KV ' + id, x, y, 220, 74, colors[id]);
    }
    parallelText(ctx, api, 'Blocks seen by query 0', 560, 987, 37, api.C.ink, 'right');
    for (let visit = 0; visit <= whole; visit++) {
      const block = (blockCount - visit) % blockCount;
      parallelTile(ctx, api, 'KV ' + block, 610 + visit * 220, 935, 190, 76, colors[block]);
    }
    if (clock.done(prefix + 'merge'))
      parallelText(
        ctx,
        api,
        'Online softmax combines the contributions from all four blocks',
        960,
        363,
        32,
        api.C.yellow,
        'center',
      );
  });
}
export default {
  id: 'ring-prefill',
  draw: drawRingPrefill,
  cues: ['0', 'local', 'shift', '1', 'visits', 'merge', '2', 'overlap', 'decode', 'wait'].map(
    (id) => prefix + id,
  ),
};
