import { dogTree } from '../dog-tree.mjs';
import { BRANCHES } from '../fixtures.mjs';
import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawIntro(ctx, scene, state, api) {
  if (state.beat < 2) {
    const { C } = api;
    const dock = api.phase(state.t + 0.18, 0, 1.15);
    const pick = movement(state, 'intro-commit', 1, 0.02, 0.23);
    const committed = heard(state, 'intro-commit', 1, 0.23);
    const drop = heard(state, 'intro-drop', 1, 0.39);
    const slot = 945;
    if (state.t < 0.35) ctx.globalAlpha = 1;
    api.focus.target('dog-tree', () => {
      api.text(ctx, 'The dog', 725, 458, 116, C.ink, 'right', 'serif');
      if (pick === 0) api.line(ctx, slot - 160, 482, slot + 160, 482, C.cyan, 6);
      api.line(ctx, 1160, 482, 1480, 482, C.muted, 4);

      const totalWidth = 1320;
      let left = 300;
      for (const [i, branch] of BRANCHES.entries()) {
        const width = totalWidth * branch.p;
        const x = left + (i ? 1 : -1) * 140 * (1 - dock);
        left += width;
        if (i === 1 && drop) continue;
        const color = i ? C.cyan : C.blue;
        const emphasis = movement(
          state,
          i ? 'intro-slept' : 'intro-ran',
          0,
          i ? 0.5 : 0.2,
          i ? 0.7 : 0.4,
        );
        const wordX = x + width / 2;
        api.rect(ctx, x + 4, 724, width - 8, 105, color, undefined, 5);
        coreText(ctx, api, Math.round(branch.p * 100) + '%', wordX, 799, 59, C.bg);
        if (emphasis > 0) api.line(ctx, x + 6, 848, x + 6 + (width - 12) * emphasis, 848, color, 4);
        const travel = i ? 0 : pick;
        if (i === 0 && committed)
          coreText(ctx, api, 'First-word probability', wordX, 678, 40, C.muted);
        api.text(
          ctx,
          branch.word,
          api.lerp(wordX, slot, travel),
          api.lerp(681, 457, travel),
          api.lerp(79, 106, travel),
          travel ? C.yellow : C.ink,
          'center',
          'serif',
        );
      }
    });
    return;
  }
  const home = heard(state, 'intro-home', 2, 0.32);
  const soundly = heard(state, 'intro-soundly', 2, 0.68);
  const question = movement(state, 'intro-pair', 2, 0.72, 0.98) > 0;
  dogTree(ctx, api, {
    cover: true,
    values: [0.3, 0.7, 0, 0.9, 0.1],
    expanded: [...(home ? [1] : []), ...(soundly ? [3] : [])],
    note: question
      ? 'Which pair is more likely: ran home or slept soundly?'
      : 'Stop after two words.',
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-ran',
    'intro-slept',
    'intro-commit',
    'intro-drop',
    'intro-home',
    'intro-soundly',
    'intro-pair',
  ],
};
