import { modelSnapshot } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { finished } from '../scene-clock.mjs';

export function drawAccumulation(ctx, scene, state, api) {
  const { C } = api;
  const { stored, backwardCalls } = modelSnapshot('accumulation', state);
  const cleared = finished(state, 'buffer-clear', 1, 0.3);
  text(ctx, api, 'w = 1', 240, 331, 55, C.blue);
  text(ctx, api, 'loss = w²', 950, 331, 55, C.ink, 'center');
  text(ctx, api, 'slope = 2w = 2', 1670, 331, 55, C.yellow, 'right');
  api.focus.target('accumulation-buffer', () => {
    text(ctx, api, 'w.grad', 260, 490, 45, C.ink);
    text(
      ctx,
      api,
      backwardCalls ? 'Stored   ' + stored : 'None',
      1655,
      490,
      47,
      backwardCalls ? C.yellow : C.muted,
      'right',
    );
    const left = 260,
      width = 1400,
      y = 542;
    api.rect(ctx, left, y, width, 165, C.panel, C.muted, 6);
    for (let pass = 0; pass < backwardCalls; pass++) {
      const x = left + (pass * width) / 2 + 10;
      const color = pass ? C.pink : C.yellow;
      api.rect(ctx, x, y + 10, width / 2 - 20, 145, C.bg, color, 5);
      text(ctx, api, '+2', x + width / 4, y + 104, 68, color, 'center');
    }
    if (!backwardCalls) text(ctx, api, 'Empty', 960, 646, 49, C.muted, 'center');
    const code = cleared && backwardCalls === 0 ? 'w.grad = None' : '(w**2).backward()';
    api.text(ctx, code, 960, 847, 49, C.cyan, 'center', 'mono');
    const prompt =
      state.beat === 1 && cleared
        ? 'After one more backward call, what will w.grad hold?'
        : backwardCalls === 2
          ? 'Same derivative twice in one buffer'
          : cleared && backwardCalls
            ? 'One derivative in the new update window'
            : 'The weight stays at one throughout.';
    text(ctx, api, prompt, 960, 976, 38, C.ink, 'center');
  });
}
export default {
  id: 'accumulation',
  draw: drawAccumulation,
  cues: ['buffer-first', 'buffer-second', 'buffer-clear', 'buffer-ask', 'buffer-fresh'],
};
