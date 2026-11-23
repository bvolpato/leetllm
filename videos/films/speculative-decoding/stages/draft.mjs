import { sampleProposal } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { P, Q, WORDS } from '../fixtures.mjs';
import { wordOdds } from '../word-odds.mjs';

export function drawDraft(ctx, scene, state, api) {
  const { C } = api;
  const uniform = 0.35;
  const candidate = sampleProposal(Q, uniform);
  const sampled = heard(state, 1, 'select-dog', 0.68);
  wordOdds(ctx, api, {
    words: WORDS, p: P, q: Q, y: 365,
    targets: ['bird-pair', 'dog-pair', 'cat-pair'], selected: sampled ? candidate : undefined,
  });
  api.focus.target('draft-strip', () => {
    const progress = movement(state, 1, 'draw-source', 0.02, 0.18);
    const showMark = movement(state, 1, 'sample-mark', 0.32, 0.50);
    const left = 170, width = 1580;
    api.text(ctx, 'Draw from the draft', left, 663, 37, C.ink);
    api.line(ctx, left, 792, left + width, 792, C.muted, 2);
    let start = 0;
    for (const [i, mass] of Q.entries()) {
      const x = left + start * width;
      const part = Math.max(0, Math.min(mass, progress - start));
      if (part > 0) api.rect(ctx, x + 2, 752, Math.max(1, width * part - 4), 40,
        sampled && i === candidate ? C.yellow : C.cyan, undefined, 2);
      if (progress >= start + mass - 1e-8) {
        api.text(ctx, WORDS[i], x + width * mass / 2, 863, 38, C.ink, 'center');
      }
      if (progress >= start) api.text(ctx, Number(start.toFixed(2)).toString(), x, 935, 31, C.muted, 'center');
      start += mass;
    }
    api.text(ctx, '1', left + width, 935, 31, C.muted, 'center');
    if (showMark > 0) {
      const x = left + width * uniform;
      api.text(ctx, 'Draw ' + uniform.toFixed(2), x, 703, 34, C.yellow, 'center');
      api.line(ctx, x, 720, x, 799, C.yellow, 5);
    }
  });
}
export default {
  id: 'draft', draw: drawDraft,
  cues: ['dog-row', 'target-row', 'draw-source', 'sample-mark', 'select-dog', 'served-laws'],
};
