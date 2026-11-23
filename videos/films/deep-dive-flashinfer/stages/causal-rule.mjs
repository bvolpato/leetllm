import { bracket, clauseEnded, tile } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';

export function drawCausalRule(ctx, scene, state, api) {
  const { C } = api;
  const { keys, queries, row, position, maskBoundary, mode } = flashinferExtensionFrame(
    'causal-rule',
    state,
  );
  const transfer = state.beat >= 3;
  const answer = !transfer || clauseEnded(state, 'causal-transfer-answer', 4, 0.25);
  const width = 148,
    left = (1920 - width * keys) / 2;
  const wrong = mode === 'unmasked' || mode === 'top-left';
  const color = wrong ? C.pink : C.cyan;
  api.focus.target('fi-causal-rule-mechanism', () => {
    api.text(
      ctx,
      `${transfer ? 'Fresh request' : 'R2'}  /  ${keys} stored keys  /  ${queries} new queries`,
      130,
      265,
      40,
      C.ink,
    );
    for (let k = 0; k < keys; k++) {
      const x = left + k * width;
      tile(api, `k${k}`, x + 4, 380, width - 8, 90, answer && k <= maskBoundary ? color : C.muted);
      const i = k - (keys - queries);
      if (i >= 0)
        tile(
          api,
          `q${i}`,
          x + 10,
          535,
          width - 20,
          80,
          i === row ? C.yellow : C.muted,
          i === row ? C.yellow : C.muted,
        );
    }
    if (answer) bracket(ctx, api, left, left + width * (maskBoundary + 1), 505, color);
    const equation = transfer
      ? `7 − 3 + 1  =  ${answer ? position : '?'}`
      : `i=${row}; K−Q+i =9−4+${row} =${position}`;
    api.text(ctx, equation, 960, 765, 49, C.yellow, 'center');
    const message = !answer
      ? 'For local row 1, where does the read stop?'
      : mode === 'top-left'
        ? 'Top-left mask  /  only k0 is visible'
        : mode === 'unmasked'
          ? 'Mask removed  /  k6, k7 and k8 leak into the read'
          : `Keys 0 through ${maskBoundary}   ·   ${maskBoundary + 1} readable keys`;
    api.text(ctx, message, 960, 914, 43, color, 'center');
  });
}
export default {
  id: 'causal-rule',
  draw: drawCausalRule,
  cues: [
    'fi-causal-rule-0',
    'fi-causal-rule-0-result',
    'fi-causal-rule-1',
    'rule-seven',
    'rule-eight',
    'rule-nine',
    'fi-causal-rule-1-result',
    'fi-causal-rule-2',
    'rule-top',
    'rule-open',
    'rule-restore',
    'causal-transfer',
    'causal-transfer-answer',
  ],
};
