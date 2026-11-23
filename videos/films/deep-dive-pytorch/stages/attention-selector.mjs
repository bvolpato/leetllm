import { cueFraction } from '../cues.mjs';

function plane(ctx, api, x, y, size, color) {
  api.rect(ctx, x, y, size, size, api.C.panel, color, 3);
  for (let i = 1; i < 8; i++) {
    const d = (i * size) / 8;
    api.line(ctx, x + d, y, x + d, y + size, api.C.muted, 1);
    api.line(ctx, x, y + d, x + size, y + d, api.C.muted, 1);
  }
}

export function drawAttentionSelector(ctx, scene, state, api) {
  const { C } = api,
    length = 8192,
    heads = 2,
    cells = heads * length ** 2;
  const cue = (id, b, a, z) => cueFraction(state, id, b, a, z);
  api.focus.target('score-planes', () => {
    if (state.beat === 0) {
      for (let i = 0; i < heads; i++) {
        const x = 145 + i * 425;
        api.text(ctx, 'Head ' + i, x, 300, 40, C.blue);
        plane(ctx, api, x, 340, 370, C.blue);
        api.text(ctx, '8192 × 8192', x + 185, 783, 42, C.ink, 'center');
      }
      api.text(ctx, 'One score per query-key pair', 1050, 334, 39, C.ink);
      if (cue('score-count', 0, 0.29, 0.41) > 0) {
        api.text(ctx, cells.toLocaleString('en-US'), 1050, 460, 70, C.cyan);
        api.text(ctx, 'score cells across both heads', 1050, 528, 34, C.muted);
      }
      if (cue('score-bytes', 0, 0.41, 0.62) > 0)
        api.text(ctx, '× 2 bytes = ' + (cells * 2) / 2 ** 20 + ' MiB', 1050, 674, 47, C.ink);
      const wider = cue('head-width', 0, 0.62, 0.72) > 0;
      api.text(ctx, 'Grid squares group blocks of scores', 538, 843, 32, C.muted, 'center');
      api.text(
        ctx,
        'One dot product:   ' + (wider ? '128' : '64') + ' multiplications',
        960,
        945,
        47,
        wider ? C.yellow : C.ink,
        'center',
      );
    } else if (state.beat === 1) {
      api.text(ctx, 'One head', 160, 290, 42, C.ink);
      const left = 160,
        top = 330,
        n = 8,
        unit = 64;
      plane(ctx, api, left, top, unit * n, C.muted);
      const progress = cue('score-tile', 1, 0.15, 0.48);
      const finished = Math.floor(progress * n);
      for (let i = 0; i < finished; i++)
        api.rect(
          ctx,
          left + i * unit + 4,
          top + 3 * unit + 4,
          unit - 8,
          unit - 8,
          C.blue,
          undefined,
          4,
        );
      if (finished < n)
        api.rect(
          ctx,
          left + finished * unit + 4,
          top + 3 * unit + 4,
          unit - 8,
          unit - 8,
          C.yellow,
          undefined,
          4,
        );
      api.text(ctx, 'Key blocks', left + 256, 914, 34, C.muted, 'center');
      api.text(ctx, 'One query block', 880, 408, 42, C.yellow);
      api.text(ctx, 'Key blocks accumulated     ' + finished + ' / 8', 880, 550, 42, C.ink);
      api.text(ctx, 'Running softmax sum', 880, 660, 37, C.cyan);
      api.text(ctx, 'Running weighted value sum', 880, 733, 37, C.cyan);
      if (cue('score-path', 1, 0.84, 0.98) > 0)
        api.text(
          ctx,
          'Check the profiler for the selected backend',
          960,
          1027,
          39,
          C.ink,
          'center',
        );
    } else {
      const px = [290, 710, 1210, 1630],
        headX = [500, 1420];
      api.text(ctx, 'Query heads', 140, 285, 39, C.ink);
      for (const [i, x] of px.entries()) {
        api.circle(ctx, x, 426, 64, C.panel, C.blue, 4);
        api.text(ctx, 'Q' + i, x, 446, 48, C.blue, 'center');
        const target = headX[Math.floor(i / 2)],
          p = cue('group-heads', 2, 0.12, 0.32);
        if (p > 0) api.line(ctx, x, 505, x + (target - x) * p, 505 + 188 * p, C.cyan, 5);
      }
      for (const [i, x] of headX.entries()) {
        api.rect(ctx, x - 174, 715, 348, 90, C.panel, C.cyan, 5);
        api.text(ctx, 'K' + i + '  /  V' + i, x, 777, 48, C.cyan, 'center');
      }
      api.text(ctx, '2 query heads per shared key/value head', 960, 969, 45, C.ink, 'center');
    }
  });
}
export default {
  id: 'attention-selector',
  draw: drawAttentionSelector,
  cues: ['score-count', 'score-bytes', 'head-width', 'score-tile', 'score-path', 'group-heads'],
};
