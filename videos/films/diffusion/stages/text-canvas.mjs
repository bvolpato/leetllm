import { completed } from '../construction.mjs';

const rounds = [
  ['mask', 'mask', 'mask', 'mask'],
  ['write', 'mask', 'mask', 'later'],
  ['write', 'unit', 'mask', 'first'],
  ['write', 'unit', 'tests', 'first'],
];

export function drawTextCanvas(ctx, scene, state, api) {
  let round = 0;
  if (state.beat >= 2) round = 3;
  else if (state.beat === 1) {
    for (const [i, cue] of ['text-first', 'text-second', 'text-third'].entries()) {
      if (completed(state, cue)) round = i + 1;
    }
  }
  const committed = state.beat >= 2;
  const words = rounds[round];
  api.text(ctx, 'Example refinement rounds', 220, 337, 40, api.C.ink);
  api.focus.target('df-text-canvas-result', () => {
    for (const [i, word] of words.entries()) {
      const color = i === 3 ? api.C.yellow : api.C.cyan;
      const x = 220 + 375 * i;
      api.rect(ctx, x, 460, 345, 170, api.C.panel, color, 12);
      api.text(
        ctx,
        word === 'mask' ? '[mask]' : word,
        x + 172,
        567,
        64,
        word === 'mask' ? api.C.muted : color,
        'center',
      );
    }
    api.text(ctx, 'Round ' + round + ' of 3', 220, 738, 40, api.C.ink);
    api.text(
      ctx,
      committed ? 'Committed text' : 'Editable draft',
      1690,
      738,
      40,
      committed ? api.C.green : api.C.yellow,
      'right',
    );
  });
}
export default {
  id: 'text-canvas',
  draw: drawTextCanvas,
  cues: [
    'df-text-canvas-0',
    'df-text-canvas-1',
    'df-text-first',
    'df-text-second',
    'df-text-third',
    'df-text-canvas-2',
  ],
};
