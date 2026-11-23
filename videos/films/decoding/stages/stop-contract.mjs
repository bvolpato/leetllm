import { coreBox, coreText, coreTitle } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawStopContract(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('dec-stop-contract-mechanism', () => {
    if (beat === 0) {
      coreTitle(ctx, api, 'What ended this response?');
      const progress = movement(state, 'dec-stop-contract-1', 0, 0, 1);
      const names = ['end-of-turn ID', 'conversation-end ID', 'output budget', 'cancel / error'];
      names.forEach((name, i) => {
        const x = 190 + i * 420;
        const active = i < Math.floor(progress * 4.999);
        coreBox(ctx, api, name, x, 420, 370, 100, active ? C.blue : C.muted, 27);
        api.arrow(ctx, x + 185, 555, x + 185, 685, C.muted, 3);
        coreBox(
          ctx,
          api,
          ['message ended', 'conversation ended', 'length-limited prefix', 'interrupted'][i],
          x,
          740,
          370,
          100,
          active ? C.cyan : C.muted,
          25,
        );
      });
      return;
    }

    const joined =
      beat === 1
        ? heard(state, 'dec-stop-contract-2', 1, 0.53)
        : heard(state, 'dec-stop-contract-3', 2, 0.51);
    const returned = beat === 2 && heard(state, 'dec-stop-empty', 2, 0.83);
    coreText(ctx, api, 'Stop string', 285, 301, 38, C.muted, 'left');
    coreText(ctx, api, 'stop', 550, 301, 57, C.yellow, 'left');
    const x = 440,
      step = 143,
      y = 535;
    const pieces = joined ? ['st', 'opera'] : ['st'];
    let first = 0;
    for (const [i, piece] of pieces.entries()) {
      const left = x + step * first;
      const width = step * piece.length;
      coreText(ctx, api, 'Token ' + (i + 1), left + width / 2, y - 110, 35, C.muted);
      api.rect(ctx, left + 5, y - 77, width - 10, 136, C.panel, C.muted, 8);
      for (const ch of piece) {
        const color = joined ? (first < 4 ? C.cyan : C.muted) : C.ink;
        coreText(ctx, api, ch, x + step * (first + 0.5), y + 22, 74, color);
        first++;
      }
    }
    if (joined) {
      const matchEnd = x + step * 4;
      api.line(ctx, x + 6, 628, matchEnd - 6, 628, C.cyan, 6);
      api.line(ctx, matchEnd + 6, 628, x + step * 7 - 6, 628, C.muted, 4);
      coreText(ctx, api, 'stop matches', x + step * 2, 699, 38, C.cyan);
      coreText(ctx, api, 'era is left over', x + step * 5.5, 699, 38, C.muted);
    } else if (beat === 2) {
      coreText(ctx, api, 'Hold these two letters.', x + step, 699, 38, C.ink);
    }
    if (beat === 2) {
      coreText(ctx, api, 'Returned text', 285, 906, 42, C.muted, 'left');
      coreText(
        ctx,
        api,
        returned ? '""   (empty string)' : 'Nothing streamed yet',
        670,
        906,
        49,
        returned ? C.yellow : C.ink,
        'left',
      );
    }
  });
}
export default {
  id: 'stop-contract',
  draw: drawStopContract,
  cues: ['dec-stop-contract-1', 'dec-stop-contract-2', 'dec-stop-contract-3', 'dec-stop-empty'],
};
