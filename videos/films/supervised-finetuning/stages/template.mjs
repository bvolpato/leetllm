import { motion } from '../construction.mjs';
import { inputStrip } from '../token-strip.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 2) {
    api.focus.target('token-input', () => {
      const partial = motion(state, 'continue-partial', 2, 0.57, 0.77) > 0;
      text(
        ctx,
        api,
        partial ? 'Serving a partial assistant message' : 'Serving a new user request',
        145,
        314,
        38,
        C.ink,
      );
      inputStrip(ctx, api, { y: 560, count: partial ? 6 : 5, mark: partial ? 5 : 4 });
      text(
        ctx,
        api,
        partial ? 'Continue after open' : 'Generate the first reply token after ASSIST',
        960,
        862,
        43,
        C.yellow,
        'center',
      );
    });
    return;
  }
  [
    ['System', 'Follow the review policy'],
    ['User', 'My key is 18 days old'],
    ['Assistant', 'Open a rotation ticket'],
  ].forEach(([role, words], i) => {
    const x = 140 + i * 558;
    text(ctx, api, role, x + 246, 320, 33, C.muted, 'center');
    upgradeBox(ctx, api, words, x, 361, 496, 100, C.blue, 33);
  });
  api.focus.target('token-input', () => {
    const progress = motion(state, 'serialize', 0, 0.48, 0.85);
    inputStrip(ctx, api, { y: 680, count: Math.ceil(progress * 8), mark: state.beat > 0 ? 4 : -1 });
    text(
      ctx,
      api,
      state.beat === 0
        ? 'One checkpoint-specific sequence'
        : '4  assistant marker     →     5  first reply token',
      960,
      913,
      39,
      state.beat > 0 ? C.yellow : C.muted,
      'center',
    );
  });
}

export default {
  id: 'template',
  draw: draw,
  cues: ['serialize', 'template-boundary', 'new-turn', 'continue-partial'],
};
