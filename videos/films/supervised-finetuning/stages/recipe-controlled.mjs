import { motion } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('recipe-controlled-mechanism', () => {
    if (state.beat === 0) {
      text(
        ctx,
        api,
        'Same approved targets, template, adapters and validation set',
        960,
        345,
        41,
        C.ink,
        'center',
      );
      ['Candidate rate A', 'Candidate rate B'].forEach((label, i) => {
        const y = 470 + 204 * i;
        upgradeBox(ctx, api, label, 195, y, 440, 91, C.blue, 37);
        api.arrow(ctx, 690, y + 44, 1470, y + 44, C.cyan, 4);
        text(ctx, api, 'Matched exposure', 1090, y + 106, 31, C.muted, 'center');
        text(ctx, api, 'Grade', 1610, y + 62, 38, C.green, 'center');
      });
      return;
    }
    if (state.beat === 1) {
      text(
        ctx,
        api,
        'InstructGPT supervised baseline   /   learning rate',
        960,
        303,
        39,
        C.ink,
        'center',
      );
      const rate = (t) => 0.1 + 0.45 * (1 + Math.cos(Math.PI * t));
      const x = (t) => 375 + 1140 * t,
        y = (t) => 822 - 365 * rate(t);
      api.line(ctx, x(0), 830, x(1), 830, C.muted, 3);
      const trace = motion(state, 'recipe-controlled-b2', 1, 0.15, 0.42);
      for (let j = 1; j <= Math.ceil(trace * 80); j++) {
        const a = (j - 1) / 80,
          b = Math.min(trace, j / 80);
        api.line(ctx, x(a), y(a), x(b), y(b), C.blue, 5);
      }
      text(ctx, api, 'Starting rate', x(0), y(0) - 45, 31, C.blue, 'center');
      text(ctx, api, '0', x(0), 893, 30, C.muted, 'center');
      text(ctx, api, '16 epochs', x(1), 893, 31, C.muted, 'center');
      if (trace === 1)
        text(ctx, api, '10% of starting rate', x(1), y(1) - 53, 33, C.blue, 'center');
      return;
    }
    text(ctx, api, 'AdamW', 160, 340, 42, C.ink);
    upgradeBox(ctx, api, 'Gradient after clipping', 170, 465, 535, 100, C.blue, 37);
    api.arrow(ctx, 728, 515, 846, 515, C.muted, 4);
    upgradeBox(ctx, api, 'Updated moments', 875, 465, 420, 100, C.cyan, 35);
    api.arrow(ctx, 1318, 515, 1410, 515, C.muted, 4);
    text(ctx, api, 'Adaptive step', 1589, 530, 33, C.green, 'center');
    text(
      ctx,
      api,
      'Weight after decay    −    adaptive step    =    next weight',
      960,
      775,
      45,
      C.ink,
      'center',
    );
    text(
      ctx,
      api,
      'Measure both the gradient norm and the parameter change.',
      960,
      942,
      37,
      C.muted,
      'center',
    );
  });
}

export default {
  id: 'recipe-controlled',
  draw: draw,
  cues: ['recipe-controlled-b1', 'recipe-controlled-b2', 'recipe-controlled-b3'],
};
