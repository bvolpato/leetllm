import { decomposition } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { CHAIN } from '../fixtures.mjs';
import { verifyChain } from '../model.mjs';

export function drawChain(ctx, scene, state, api) {
  const { C } = api;
  const chain = verifyChain();
  const proposed = CHAIN.map((r) => r.words[r.candidate]);
  const centers = [475, 995, 1515];
  const accepted = heard(state, 1, 'accept-first', 0.30);
  const rejected = heard(state, 1, 'reject-second', 0.62);
  const skipped = heard(state, 2, 'discard-suffix', 0.10);
  const corrected = heard(state, 2, 'residual-correction', 0.60);
  const rows = movement(state, 0, 'target-rows', 0.60, 0.78) > 0;
  const text = (value, x, y, size, color, align = 'center') => api.text(ctx, value, x, y, size, color, align);

  api.focus.target('chain-draft', () => {
    text('Proposed after “The bird”', 150, 269, 35, C.muted, 'left');
    for (const [i, word] of proposed.entries()) {
      const color = i === 0 && accepted ? C.green : i === 1 && rejected ? C.pink : i === 2 && skipped ? C.muted : C.cyan;
      const x = centers[i];
      text(word, x, 394, 68, color);
      api.line(ctx, x - 160, 425, x + 160, 425, color, 4);
      if (i < proposed.length - 1)
        api.arrow(ctx, x + 180, 370, centers[i + 1] - 180, 370, C.muted, 4);
    }
  });
  api.focus.target('chain-rows', () => {
    text('Target verification', 150, 517, 34, C.blue, 'left');
    if (!rows) return;
    for (const [i, r] of CHAIN.entries()) {
      const x = centers[i];
      const prefix = i === 0 ? 'bird' : proposed[i - 1];
      text('Row after ' + prefix, x, 605, 40, C.blue);
      text('p ' + r.p[r.candidate].toFixed(2) + '     q ' + r.q[r.candidate].toFixed(2), x, 680, 36, C.ink);
      if (i === 0 && accepted || i === 1 && rejected) {
        const alpha = decomposition(r.p, r.q).acceptance[r.candidate];
        text('Draw ' + r.uniform.toFixed(2) + '   /   cutoff ' + alpha.toFixed(2), x, 756, 31, C.muted);
      }
      if (i === 2 && skipped) text('Scored · test skipped', x, 756, 31, C.pink);
    }
  });
  api.focus.target('chain-reader', () => {
    text('Reader', 150, 921, 34, C.green, 'left');
    const sentence = ['The bird', ...(accepted ? chain.accepted : []), ...(corrected ? [chain.correction] : [])];
    text(sentence.join(' '), 475, 940, 62, C.ink, 'left');
    if (accepted && !corrected) api.line(ctx, 915, 946, 1185, 946, C.yellow, 4);
  });
}
export default {
  id: 'chain', draw: drawChain,
  cues: ['conditional-prefixes', 'target-rows', 'accept-first', 'reject-second', 'look-at-today',
    'discard-suffix', 'dependent-suffix', 'residual-correction', 'corrected-prefix'],
};
