import { r1 } from '../fixtures.mjs';
import { vvProgress } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id, beat) => vvProgress(state, 'intro-' + id, beat);
  const blocked = progress('wait', 1) === 1;
  const secondBlock = progress('second-block', 2);
  const placement = progress('fifth', 2);
  const accepted = placement === 1;
  const count = accepted ? 5 : 4;
  const wordX = (i) => 125 + i * 185;
  const stepX = (i) => 444 + i * 225;

  // Cut directly from the course mark to the word in flight.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  if (state.beat === 0 && progress('whole-step', 0) === 0) {
    api.focus.target('intro-prompt', () => {
      api.text(ctx, 'R1’s prompt', 145, 412, 42, C.pink);
      api.text(ctx, r1.slice(0, 4).join(' '), 140, 583, 100, C.ink, 'left', 'serif');
    });
    api.focus.target('intro-step', () => {
      const travel = Math.min(1, 0.08 + state.t / 2.3);
      const width = 220 - 59 * travel;
      const height = 115 - 44 * travel;
      const x = 883 + (stepX(5) + 20 - 883) * travel;
      const y = 487 - 42 * travel - 80 * Math.sin(Math.PI * travel);
      tokenCell(api, '?', stepX(5), 535, 203, 95, C.yellow, false, 44);
      tokenCell(api, r1[4], x, y, width, height, C.yellow, true, 61 - 22 * travel);
      api.text(ctx, 'Last GPU place', stepX(5) + 101, 711, 42, C.yellow, 'center');
    });
    return;
  }
  api.focus.target('intro-prompt', () => {
    api.text(ctx, 'New prompt  ·  R1', 125, 243, 39, C.pink);
    api.text(ctx, '9 tokens  ·  prefix reuse off', 1775, 241, 32, C.ink, 'right');
    r1.forEach((word, i) => {
      const color = i === 4 && !accepted ? C.yellow : C.pink;
      tokenCell(api, word, wordX(i), 278, 161, 91, color, i < count, 41);
    });
  });

  api.focus.target('intro-step', () => {
    api.text(ctx, 'GPU step', 125, 575, 43, C.ink);
    api.text(ctx, '6 input places', 125, 630, 31, C.muted);
    for (let i = 0; i < 6; i++) {
      const word = i === 0 ? 'R0 decode' : i <= count ? r1[i - 1] : '';
      const color = i === 0 ? C.blue : word ? C.pink : C.yellow;
      tokenCell(api, word, stepX(i), 535, 203, 95, color, Boolean(word), i === 0 ? 33 : 39);
    }
    api.text(ctx, 'KV ready', stepX(0) + 101, 681, 30, C.blue, 'center');
    if (!blocked) {
      tokenCell(api, r1[4], stepX(5) + 20, 445, 161, 71, C.yellow, true, 39);
    } else if (placement > 0 && !accepted) {
      tokenCell(api, 'on', stepX(5) + 20, 445 + 101 * placement, 161, 71, C.pink, true, 39);
    }
  });

  api.focus.target('intro-storage', () => {
    api.text(ctx, 'KV space', 125, 795, 43, C.cyan);
    api.text(ctx, 'for R1', 125, 848, 31, C.muted);
    for (let block = 0; block < (secondBlock > 0 ? 2 : 1); block++) {
      const x = stepX(0) + block * 738;
      const cells = block === 0 ? 4 : Math.ceil(secondBlock * 4);
      for (let j = 0; j < cells; j++) {
        const i = block * 4 + j;
        tokenCell(api, i < count ? r1[i] : '', x + j * 151, 751, 141, 85, C.cyan, i < count, 36);
      }
      api.line(ctx, x, 856, x + (cells - 1) * 151 + 141, 856, C.cyan, 4);
      api.text(ctx, 'Block ' + (block + 1), x, 906, 31, C.cyan);
    }
  });

  const note = accepted
    ? 'Worker gets 1 decode input + 5 prompt inputs'
    : blocked && secondBlock === 0
      ? '4 prompt inputs can run  ·  5 wait'
      : 'Where would “on” store its keys and values?';
  api.focus.target('intro-decision', () => api.text(ctx, note, 960, 1015, 40, C.yellow, 'center'));
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-word',
    'intro-whole-step',
    'intro-reserve',
    'intro-storage',
    'intro-wait',
    'intro-second-block',
    'intro-fifth',
  ],
};
