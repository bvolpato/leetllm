import { inputs, reduced } from '../fixtures.mjs';
import { cueProgress, heard } from '../construction.mjs';

function drawWeight(ctx, state, api, slot, column) {
  const { C, focus } = api;
  const sumReady = heard(state, 0, 'intro-sum');
  const copied = heard(state, 1, 'intro-all-reduce');
  const adding = cueProgress(state, 0, 'intro-terms');
  const ask = cueProgress(state, 0, 'intro-destination') > 0;

  if (state.t < 0.35) ctx.globalAlpha = 1;
  focus.target('intro-column', () => {
    api.text(ctx, 'Who needs the sum of these gradients?', 960, 253, 50, C.ink, 'center');
  });
  column.forEach((value, rank) => {
    const x = 345 + 410 * rank;
    const slotX = x - 75 + 50 * slot;
    focus.target('intro-outputs', () => {
      for (let pin = 0; pin < 5; pin++) {
        const y = 326 + 25 * pin;
        api.line(ctx, x - 155, y, x - 132, y, C.blue, 7);
        api.line(ctx, x + 132, y, x + 155, y, C.blue, 7);
      }
      api.rect(ctx, x - 132, 299, 264, 165, C.panel, C.blue, 18);
      api.text(ctx, 'GPU  ·  rank ' + rank, x, 362, 33, C.ink, 'center');
      if (copied) {
        api.text(ctx, String(reduced[slot]), x, 432, 55, C.yellow, 'center', 'mono');
      } else {
        for (let i = 0; i < inputs[rank].length; i++) {
          api.rect(ctx, x - 95 + 50 * i, 390, 40, 41, i === slot ? C.yellow : C.bg, C.muted, 6);
        }
      }
    });
    // Lift the same slot from each buffer into one arithmetic expression.
    const travel = Math.min(1, Math.max(0, ((state.t ?? 0) + 0.35 - 0.08 * rank) / 1.85));
    const tileX = slotX + (x - slotX) * travel;
    const tileY = 511 + 157 * travel;
    focus.target('intro-column', () => {
      if (!copied) api.line(ctx, slotX, 465, tileX, tileY - 58, C.muted, 3);
      api.rect(ctx, tileX - 106, tileY - 53, 212, 106, C.panel, C.yellow, 12);
      api.text(ctx, String(value), tileX, tileY + 22, 65, C.yellow, 'center', 'mono');
    });
    focus.target('intro-equation', () => {
      if (travel < 1) api.line(ctx, x - 106, 725, x + 106, 725, C.muted, 3);
      if (rank > 0) {
        const color = adding > (rank - 1) / 3 ? C.ink : C.muted;
        api.text(ctx, '+', x - 205, 689, 55, color, 'center');
      }
    });
  });
  focus.target('intro-equation', () => {
    api.text(
      ctx,
      sumReady ? '= ' + reduced[slot] : '= ?',
      960,
      845,
      86,
      sumReady ? C.yellow : C.muted,
      'center',
      'mono',
    );
  });
  if (ask) {
    focus.target('intro-outputs', () =>
      api.text(ctx, 'Each GPU updates a full copy of the model', 960, 985, 40, C.ink, 'center'),
    );
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const slot = 2;
  const column = inputs.map((row) => row[slot]);
  if (state.beat === 0 || (state.beat === 1 && !cueProgress(state, 1, 'nc-intro-b1-s1'))) {
    return drawWeight(ctx, state, api, slot, column);
  }
  const copied = heard(state, 1, 'intro-all-reduce');
  const full = heard(state, 1, 'nc-intro-b1-s1');
  const owner = heard(state, 3, 'intro-owner');
  const sharded = heard(state, 3, 'intro-shards');
  const cell = (x, y, value, color, size) => {
    api.rect(ctx, x - 73, y - 43, 146, 86, C.panel, color, 8);
    api.text(ctx, String(value), x, y + 14, size, color, 'center', 'mono');
  };
  const xAt = (side, i) => (side === 'input' ? 375 : 1160) + 159 * i;
  const rowY = (r) => 410 + 108 * r;
  const title = (value, x) => api.text(ctx, value, x, 261, 39, C.ink, 'center');
  title('Four independent local vectors', 610);
  focus.target('intro-outputs', () => {
    title(
      sharded
        ? 'One slot per rank'
        : owner
          ? 'Keeping the local shard'
          : full
            ? 'The same sum on every rank'
            : 'Output buffers',
      1398,
    );
  });

  for (let i = 0; i < column.length; i++) {
    for (const side of ['input', 'output']) {
      const target = side === 'input' ? 'intro-column' : 'intro-outputs';
      focus.target(target, () =>
        api.text(
          ctx,
          'Slot ' + i,
          xAt(side, i),
          331,
          29,
          i === slot ? C.yellow : C.muted,
          'center',
        ),
      );
    }
  }
  inputs.forEach((row, rank) => {
    const y = rowY(rank);
    api.text(ctx, 'Rank ' + rank, 240, y + 12, 37, C.ink, 'right');
    row.forEach((value, i) => {
      focus.target('intro-column', () =>
        cell(xAt('input', i), y, value, i === slot ? C.yellow : C.muted, 40),
      );
      const exists =
        (full || (copied && i === slot)) && !(i !== rank && (sharded || (owner && i === slot)));
      focus.target('intro-outputs', () => {
        const color = exists ? (i === slot ? C.yellow : C.cyan) : C.muted;
        cell(xAt('output', i), y, exists ? reduced[i] : '·', color, 40);
      });
    });
  });
  focus.target('intro-equation', () => {
    api.math(ctx, column.join('+') + '=' + reduced[slot], 610, 912, 48, C.yellow, 'center');
  });
  focus.target('intro-outputs', () => {
    const request =
      state.beat >= 2
        ? 'Update only the local weight shard'
        : 'Update a complete model on each GPU';
    api.text(ctx, request, 1398, 902, 34, C.ink, 'center');
    if (sharded) api.text(ctx, 'Reduce-scatter', 1398, 969, 36, C.cyan, 'center');
    else if (full && state.beat === 1)
      api.text(ctx, 'Sum all-reduce', 1398, 969, 36, C.cyan, 'center');
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-column',
    'intro-terms',
    'intro-sum',
    'intro-destination',
    'intro-all-reduce',
    'nc-intro-b1-s1',
    'intro-sharded',
    'intro-which-copy',
    'intro-owner',
    'intro-shards',
  ],
};
