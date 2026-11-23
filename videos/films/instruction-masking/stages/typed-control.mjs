import { cueProgress } from '../construction.mjs';
import {
  instructionCell as cell,
  instructionF as focus,
  instructionT as text,
} from '../defaults.mjs';

export function drawTypedControl(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    focus(ctx, api, 'typed-example', () => {
      for (const [i, owner] of ['Template ending', 'Quoted in a message'].entries()) {
        const y = 350 + i * 285;
        text(ctx, api, owner, 118, y, 37, C.muted);
        text(ctx, api, '<end>', 118, y + 108, 65, C.ink);
        api.arrow(ctx, 482, y + 77, 658, y + 77, C.muted, 4);
        const ids = i ? Array.from('<end>', (c) => 1000 + c.codePointAt(0)) : [2];
        ids.forEach((id, j) =>
          cell(ctx, api, id, 735 + j * 203, y + 25, 181, 103, i ? C.blue : C.yellow, 41),
        );
      }
    });
    return;
  }
  if (beat === 1) {
    const p = cueProgress(state, 'typed-match', 1);
    focus(ctx, api, 'typed-spans', () => {
      text(ctx, api, 'Pinned Mistral tokenizer', 120, 301, 37);
      for (const [i, [owner, pos]] of [
        ['User text', 6],
        ['Template boundary', 11],
      ].entries()) {
        const y = 476 + i * 216;
        text(ctx, api, owner, 120, y, 46, i ? C.yellow : C.blue);
        text(ctx, api, 'position ' + pos, 120, y + 66, 33, C.muted);
        for (let j = 0; j < 4; j++)
          cell(
            ctx,
            api,
            'piece ' + (j + 1),
            696 + j * 249,
            y - 63,
            229,
            100,
            p * 4 > j ? C.cyan : C.muted,
            35,
          );
      }
      text(
        ctx,
        api,
        'One four-piece match inside user text and one at the expected boundary',
        960,
        934,
        39,
        C.ink,
        'center',
      );
    });
    return;
  }
  focus(ctx, api, 'encoding-policy', () => {
    const split = cueProgress(state, 'typed-split', 2);
    for (const [i, owner] of ['Quoted end token', 'Genuine end token'].entries()) {
      const y = 381 + i * 222;
      text(ctx, api, owner, 120, y, 45);
      cell(ctx, api, 2, 680, y - 68, 170, 100, C.yellow, 44);
      if (split > 0) {
        api.arrow(ctx, 882, y - 18, 1000, y - 18, C.muted, 4);
        [1867, 28713, 28767].forEach((id, j) =>
          cell(ctx, api, split * 3 > j ? id : '…', 1050 + j * 235, y - 68, 210, 100, C.blue, 36),
        );
      }
    }
    text(
      ctx,
      api,
      split === 1
        ? 'Splitting the whole transcript changes the genuine ending too.'
        : 'Default encoding of the reserved spelling',
      960,
      863,
      44,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'typed-control',
  draw: drawTypedControl,
  cues: ['typed-toy', 'typed-match', 'typed-split'],
};
