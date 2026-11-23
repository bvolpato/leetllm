import { place } from '../model.mjs';
import { cueProgress } from '../worksheet.mjs';

export function drawPlacement(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const reference = place(16),
    split = place(8);
  const splitCase = state.beat > 0;
  const moved = p('place-prefix');
  const crossed = p('cross-vector');
  const vector = (v) => '[' + v.map((n) => n.toFixed(4)).join(', ') + ']';
  const processed = splitCase
    ? Math.floor(p('run-prefix') * 16) + Math.floor(p('run-suffix') * 16)
    : Math.floor(p('run-reference') * 32);
  const model = splitCase ? split : reference;

  focus.target('block-budget', () => {
    text('Each block   0.3 GB', 135, 261, 34, C.ink);
    text('Fixed use   3.2 GB', 700, 261, 34, C.pink);
    text(`GPU budget   ${model.budget} GB`, 1270, 261, 34, C.cyan);
  });
  focus.target('block-homes', () => {
    api.rect(ctx, 130, 327, 720, 401, C.panel, C.yellow);
    api.rect(ctx, 1060, 327, 720, 401, C.panel, C.cyan);
    text('Host RAM    /    CPU', 170, 391, 38, C.yellow);
    text('Device memory    /    GPU', 1100, 391, 38, C.cyan);
    model.blocks.forEach((block, i) => {
      const move = i < 16 ? moved : 0;
      const x = 1100 + (i % 8) * 80 - 930 * move;
      const y = 433 + Math.floor(i / 8) * 70;
      const home = move > 0.5 ? C.yellow : C.cyan;
      api.rect(ctx, x, y, 66, 53, i < processed ? home : C.panel, home, 7);
      text(String(i + 1), x + 33, y + 36, 27, i < processed ? C.bg : home, 'center');
    });
  });
  focus.target('activation', () => {
    if (!splitCase) {
      text('Ordered blocks executed', 135, 828, 31, C.muted);
      text(`${processed} / 32`, 135, 907, 52, C.cyan);
      if (processed === 32)
        text('Reference output   ' + vector(reference.output), 715, 907, 41, C.green);
      return;
    }
    if (moved < 1 || processed < 16) {
      text('(8 − 3.2) / 0.3 = 16 blocks on the GPU', 135, 865, 42);
      return;
    }
    const v = split.blocks[15].output;
    const active = crossed > 0;
    text(
      active ? 'Activation after block 16' : 'Block 16 has finished. What crosses to block 17?',
      135,
      807,
      35,
      active ? C.green : C.yellow,
    );
    // Identical endpoints for CPU output and GPU input. Only the activation moves.
    api.line(ctx, 345, 935, 1560, 935, C.muted, 4);
    const center = 345 + (1560 - 345) * crossed;
    api.rect(ctx, center - 195, 837, 390, 82, C.bg, C.green, 12);
    text(vector(v), center, 890, 35, C.green, 'center');
    if (processed === 32)
      text('Split output = reference   ' + vector(split.output), 135, 1000, 35, C.green);
    else
      text(
        active
          ? 'CPU weights stay in host RAM'
          : 'At block 16: 0.3 GB of weights and a two-number output',
        135,
        998,
        30,
        C.yellow,
      );
  });
}
export default {
  id: 'placement',
  draw: drawPlacement,
  cues: [
    'fixed-blocks',
    'run-reference',
    'smaller-budget',
    'place-prefix',
    'run-prefix',
    'ask-boundary',
    'cross-vector',
    'run-suffix',
    'inspect-placement',
  ],
};
