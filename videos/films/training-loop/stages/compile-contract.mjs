import { box, text } from '../defaults.mjs';
import { finished } from '../scene-clock.mjs';

export function drawCompileContract(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('compile-contract-mechanism', () => {
    if (state.beat < 2) {
      const check = state.beat === 1;
      text(
        ctx,
        api,
        check ? 'One ticket through the same linear layer' : 'Follow a region of tensor operations',
        960,
        334,
        52,
        C.ink,
        'center',
      );
      const names = check ? ['eager forward', 'captured forward'] : ['TorchDynamo', 'Inductor'];
      const jobs = check
        ? ['original module', 'eager backend']
        : ['capture a graph', 'generate kernels'];
      names.forEach((name, i) => {
        const center = i ? 1380 : 540;
        box(ctx, api, name, center - 310, 475, 620, 124, i ? C.green : C.cyan, 45);
        text(ctx, api, jobs[i], center, 725, 40, C.ink, 'center');
      });
      if (!check) api.arrow(ctx, 875, 537, 1040, 537, C.muted, 5);
      text(
        ctx,
        api,
        check ? 'Both forwards read the same weight tensor.' : 'Time repeated steps after warmup.',
        960,
        936,
        42,
        C.ink,
        'center',
      );
      return;
    }
    const stop = finished(state, 'loop-fullgraph-break', 2, 0.33);
    text(ctx, api, stop ? 'fullgraph=True' : 'fullgraph=False', 960, 338, 60, C.ink, 'center');
    ['tensor region A', 'Python graph break', 'tensor region B'].forEach((label, i) => {
      box(ctx, api, label, 160 + i * 570, 483, 460, 122, i === 1 ? C.yellow : C.cyan, 36);
    });
    api.arrow(ctx, 638, 544, 704, 544, C.cyan, 4);
    if (!stop) api.arrow(ctx, 1208, 544, 1274, 544, C.cyan, 4);
    text(
      ctx,
      api,
      stop ? 'Capture raises at the break.' : 'Run Python, then resume capture.',
      960,
      823,
      52,
      stop ? C.yellow : C.ink,
      'center',
    );
  });
}

export default {
  id: 'compile-contract',
  draw: drawCompileContract,
  cues: [
    'compile-contract-beat-0',
    'compile-contract-beat-1',
    'compile-contract-beat-2',
    'loop-fullgraph-break',
  ],
};
