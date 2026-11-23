import { spoken } from '../construction.mjs';
import { sftResume } from '../model.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('resume-update-mechanism', () => {
    const { C } = api;
    if (state.beat === 2) {
      const weight = 0.8,
        lr = 0.1,
        beta = 0.9,
        g = 1;
      text(
        ctx,
        api,
        'Momentum SGD    w = 0.8    g = 1    learning rate = 0.1',
        960,
        325,
        39,
        C.ink,
        'center',
      );
      [2, 0].forEach((old, i) => {
        const velocity = beta * old + g;
        const next = weight - lr * velocity;
        const y = 530 + i * 225;
        text(ctx, api, old ? 'Saved velocity' : 'Reset velocity', 170, y, 36, C.muted);
        text(ctx, api, '0.9 × ' + old + ' + 1 = ' + velocity, 805, y, 38, C.blue, 'center');
        text(
          ctx,
          api,
          '0.8 − 0.1 × ' + velocity + ' = ' + next.toFixed(2),
          1460,
          y,
          37,
          C.green,
          'center',
        );
      });
      return;
    }
    const x = (w) => 660 + 4830 * (w - 0.84);
    text(
      ctx,
      api,
      'Saved weight ≈ 0.900    /    next gradient −1    /    learning rate 0.1',
      960,
      318,
      39,
      C.ink,
      'center',
    );
    [true, false].forEach((restored, i) => {
      const v = sftResume(restored),
        y = 526 + i * 265;
      const shown = spoken(
        state,
        restored ? 'resume-branch-results' : 'resume-reset',
        1,
        restored ? 0.2 : 0.54,
      );
      const col = restored ? C.cyan : C.yellow;
      text(ctx, api, restored ? 'Restored moments' : 'Fresh optimizer', 140, y - 8, 35, col);
      text(
        ctx,
        api,
        restored ? 'm=.2   v=.004   step 1' : 'm=0   v=0   step 0',
        140,
        y + 56,
        28,
        C.muted,
      );
      api.line(ctx, x(0.84), y, x(1.04), y, C.muted, 3);
      for (const t of [0.85, 0.9, 0.95, 1]) {
        api.line(ctx, x(t), y + 5, x(t), y + 20, C.muted, 2);
        text(ctx, api, t.toFixed(2), x(t), y + 65, 27, C.muted, 'center');
      }
      api.circle(ctx, x(v.saved), y, 9, C.ink);
      if (shown) {
        api.arrow(ctx, x(v.saved), y, x(v.weight), y, col, 5);
        text(ctx, api, v.weight.toFixed(6), x(v.weight), y - 51, 36, col, 'center');
      }
    });
  });
}

export default {
  id: 'resume-update',
  draw: draw,
  cues: [
    'resume-update-b1',
    'resume-update-b2',
    'resume-branch-results',
    'resume-reset',
    'resume-update-b3',
  ],
};
