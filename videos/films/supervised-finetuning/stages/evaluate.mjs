import { spoken } from '../construction.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('evaluation-tracks', () => {
    text(
      ctx,
      api,
      'Held-out request   /   “My key is 21 days old. Can I still use it?”',
      960,
      310,
      43,
      C.ink,
      'center',
    );
    const first = spoken(state, 'free-first', 1, 0.26);
    const rest = spoken(state, 'free-rest', 1, 0.51);
    ['Reference supplied', 'Model generates'].forEach((name, i) => {
      const y = 425 + 233 * i;
      text(ctx, api, name, 145, y + 66, 33, i ? C.blue : C.muted);
      upgradeBox(
        ctx,
        api,
        i ? (first ? 'wait' : '?') : 'open',
        560,
        y,
        300,
        101,
        i ? C.blue : C.green,
        43,
      );
      api.arrow(ctx, 883, y + 51, 1070, y + 51, C.muted, 3);
      upgradeBox(
        ctx,
        api,
        i ? (rest ? 'until next month' : '…') : 'score “ticket”',
        1100,
        y,
        590,
        101,
        i && rest ? C.pink : i ? C.blue : C.green,
        39,
      );
    });
    if (rest)
      text(
        ctx,
        api,
        'Generated reply defers review  ·  policy failure',
        960,
        931,
        44,
        C.pink,
        'center',
      );
  });
}

export default {
  id: 'evaluate',
  draw: draw,
  cues: ['reference-prefix', 'free-first', 'free-rest', 'grade-reply'],
};
