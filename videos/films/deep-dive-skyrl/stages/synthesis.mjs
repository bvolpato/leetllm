import { phraseEnded } from '../construction.mjs';
import { restoreProbe } from '../model.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const compare = end('synthesis-replay', 2, 0.6);
  const probe = restoreProbe(compare ? 1 : 0);
  api.text(ctx, 'Save point   /   step 10', 125, 278, 44, C.ink, 'left', 'serif');
  api.focus.target('synthesis-export', () => {
    api.text(ctx, 'Sampler export', 150, 410, 44, C.blue);
    api.text(ctx, 'Model weights + config', 150, 502, 35, C.ink);
    if (end('synthesis-sample', 0, 0.46))
      api.text(ctx, 'Ready for inference', 150, 658, 37, C.blue);
  });
  api.focus.target('synthesis-checkpoint', () => {
    api.text(ctx, 'Training checkpoint', 960, 410, 44, C.cyan);
    api.text(ctx, 'Model weights + optimizer + scheduler', 960, 502, 35, C.ink);
    api.text(ctx, 'Run record   /   next batch and RNG state', 960, 573, 32, C.ink);
    if (state.beat > 0) api.text(ctx, 'Reload and run the same next batch', 960, 658, 37, C.cyan);
  });
  api.focus.target('synthesis-next', () => {
    if (state.beat === 0) {
      api.text(
        ctx,
        'Which artifact lets you repeat the next training update?',
        960,
        903,
        43,
        C.ink,
        'center',
      );
      return;
    }
    for (const [branch, x] of [
      ['reference', 475],
      ['restored', 1435],
    ]) {
      const s = probe[branch];
      api.text(ctx, branch + '   /   step ' + s.step, x, 818, 39, C.ink, 'center');
      api.text(
        ctx,
        `w = ${s.weight.toFixed(3)}     v = ${s.velocity.toFixed(3)}`,
        x,
        906,
        41,
        compare ? C.green : C.cyan,
        'center',
        'mono',
      );
    }
    api.text(
      ctx,
      compare
        ? 'Same batch 11    /    same next weight and velocity'
        : 'Momentum toy    /    next batch gradient 0.2',
      960,
      1013,
      33,
      C.muted,
      'center',
    );
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synthesis-sample', 'synthesis-restore', 'synthesis-replay'],
};
