import { PARAMETERS } from '../fixtures.mjs';
import { backward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import { focusTarget, line, text } from '../defaults.mjs';

const rounded = (v) => Number(v.toFixed(4)).toString();

export function drawBackward(ctx, scene, state, api) {
  const { C } = api;
  const f = neuralFrame(state);
  const d = backward([1, 4], 1);
  const spread = f.progress('gradient-spread', 0);
  const inputs = f.progress('input-gradients', 2);
  const origin = { x: 405, y: 590 };

  focusTarget(ctx, api, 'backward-output', () => {
    text(ctx, api, 'Loss slope at the logit', 322, 493, 32, C.muted, 'center');
    text(ctx, api, d.dz2.toFixed(3), 285, 607, 64, C.yellow, 'center');
  });
  focusTarget(ctx, api, 'hidden-gradient', () => {
    text(ctx, api, 'Output weight', 698, 277, 33, C.muted, 'center');
    text(ctx, api, 'ReLU in forward pass', 1045, 277, 33, C.muted, 'center');
    for (const [i, y] of [440, 740].entries()) {
      const w = PARAMETERS.w2[i];
      const open = d.z1[i] > 0;
      const gateCue = open ? 'positive-gate' : 'relu-gate';
      const gate = f.progress(gateCue, 1);
      line(ctx, api, origin.x, origin.y, 610, y, C.muted, 3);
      line(ctx, api, 610, y, 1015, y, C.muted, 3);
      if (spread > 0) {
        const path = [origin, { x: 610, y }, { x: 1015, y }];
        api.trace(ctx, path, spread, C.yellow, 6);
      }
      text(ctx, api, '× ' + w, 670, y - 45, 46, C.ink, 'center');
      if (f.completed('gradient-spread', 0))
        text(ctx, api, rounded(d.dh[i]), 825, y + 68, 36, C.yellow, 'center');
      const label = 'z' + (i ? '₂' : '₁') + ' = ' + rounded(d.z1[i]);
      text(ctx, api, label, 1045, y - 78, 38, C.cyan, 'center');
      const swing = open ? (gate * Math.PI) / 2 : 0;
      const pivot = { x: 1035, y: y + 39 };
      line(
        ctx,
        api,
        pivot.x,
        pivot.y,
        pivot.x + 78 * Math.sin(swing),
        pivot.y - 78 * Math.cos(swing),
        gate > 0 ? (open ? C.cyan : C.pink) : C.muted,
        9,
      );
      if (gate > 0) {
        const col = open ? C.yellow : C.muted;
        line(ctx, api, 1062, y, 1062 + 170 * gate, y, col, open ? 6 : 2);
        if (f.completed(gateCue, 1))
          text(ctx, api, open ? rounded(d.dz1[i]) : '0', 1183, y + 68, 36, col, 'center');
      }
    }
  });
  focusTarget(ctx, api, 'first-layer-gradient', () => {
    text(
      ctx,
      api,
      f.beat < 2 ? 'Input weights' : 'Prompt × 1       Queue × 4',
      1515,
      277,
      32,
      C.muted,
      'center',
    );
    for (const [i, y] of [440, 740].entries()) {
      if (inputs > 0)
        line(ctx, api, 1240, y, 1240 + 345 * inputs, y, i ? C.yellow : C.muted, i ? 5 : 2);
      if (f.completed('input-gradients', 2)) {
        text(ctx, api, rounded(d.dw1[i][0]), 1405, y - 35, 42, i ? C.yellow : C.muted, 'center');
        text(ctx, api, rounded(d.dw1[i][1]), 1660, y - 35, 42, i ? C.yellow : C.muted, 'center');
      }
    }
  });
  focusTarget(ctx, api, 'backward-parameters', () => {
    if (f.beat === 0) {
      const expression = f.completed('output-weights', 0)
        ? '(p − y) × [0, 2.5]  ≈  [0, ' + rounded(d.dw2[1]) + ']'
        : 'logit slope × saved hidden values';
      text(ctx, api, 'Output weight gradients  =  ' + expression, 960, 970, 37, C.ink, 'center');
    } else if (f.beat === 1 && f.completed('positive-gate', 1)) {
      text(
        ctx,
        api,
        'Local slope    × 0 on the upper path     •     × 1 on the lower path',
        960,
        970,
        36,
        C.ink,
        'center',
      );
    } else if (f.beat === 2 && f.completed('input-gradients', 2)) {
      text(
        ctx,
        api,
        'Hidden bias gradients use the same gated signals    [0, ' + rounded(d.db1[1]) + ']',
        960,
        970,
        36,
        C.ink,
        'center',
      );
    }
  });
}

export default {
  id: 'backward',
  draw: drawBackward,
  cues: ['gradient-spread', 'output-weights', 'relu-gate', 'positive-gate', 'input-gradients'],
};
