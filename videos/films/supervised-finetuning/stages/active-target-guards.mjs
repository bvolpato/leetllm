import { motion, spoken } from '../construction.mjs';
import { TOKENS } from '../fixtures.mjs';
import { inputStrip } from '../token-strip.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('active-target-guards-mechanism', () => {
    const { C } = api;
    if (state.beat === 0) {
      text(ctx, api, 'Vocabulary size 4    /    all logits 0', 960, 305, 41, C.ink, 'center');
      const xs = [430, 780, 1130, 1480];
      ['prompt', 'assistant', 'answer', 'stop'].forEach((word, i) => {
        const x = xs[i];
        text(ctx, api, 'Row ' + i, x, 417, 31, C.muted, 'center');
        upgradeBox(ctx, api, word, x - 134, 447, 268, 88, C.blue, 37);
        upgradeBox(
          ctx,
          api,
          ['−100', '−100', 'ID 2', 'ID 3'][i],
          x - 134,
          695,
          268,
          83,
          i >= 2 ? C.green : C.muted,
          36,
        );
        if (i >= 2) api.arrow(ctx, xs[i - 1], 548, x, 677, C.yellow, 4);
      });
      text(ctx, api, 'Labels', 140, 751, 30, C.muted);
      if (spoken(state, 'active-log-four', 0, 0.68))
        text(
          ctx,
          api,
          'Each active term   −ln(¼) = ln 4 ≈ ' + Math.log(4).toFixed(3),
          960,
          925,
          48,
          C.green,
          'center',
        );
      return;
    }
    const cut = motion(state, 'active-truncated', 1, 0.18, 0.32);
    inputStrip(ctx, api, { count: TOKENS.length - Math.floor(3 * cut) });
    api.line(ctx, 1165, 333, 1165, 550, C.yellow, 4);
    text(ctx, api, 'Length limit 5', 1130, 550, 30, C.yellow, 'right');
    const retained = TOKENS.slice(0, TOKENS.length - Math.floor(3 * cut));
    const usable = Math.max(0, retained.length - 5);
    text(
      ctx,
      api,
      'Input positions   ' + retained.length + '      /      Usable shifted targets   ' + usable,
      960,
      730,
      45,
      C.ink,
      'center',
    );
    if (usable === 0)
      text(
        ctx,
        api,
        'Reject this row or preserve its reply with a different length limit.',
        960,
        885,
        39,
        C.pink,
        'center',
      );
  });
}

export default {
  id: 'active-target-guards',
  draw: draw,
  cues: [
    'active-target-guards-b1',
    'active-log-four',
    'active-target-guards-b2',
    'active-truncated',
  ],
};
