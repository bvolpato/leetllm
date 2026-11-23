import { outputs, prompt, tokenTimes } from '../fixtures.mjs';
import { decodeHistory } from '../model.mjs';
import { spoken } from '../trace.mjs';

export function drawDecode(ctx, scene, state, api) {
  const { C } = api;
  const history = decodeHistory(state);
  const x = (i) => 371 + i * 191;
  const words = [...prompt, ...outputs];
  api.focus.target('token-history', () => {
    api.text(
      ctx,
      'Server trace A   ·   each output stays at its own position',
      130,
      267,
      37,
      C.ink,
    );
    api.text(ctx, 'Prompt', x(0), 370, 30, C.blue, 'center');
    api.text(ctx, 'Output', x(prompt.length), 370, 30, C.yellow, 'center');
    words.forEach((word, i) => {
      const output = i - prompt.length;
      const known = output < history.emitted;
      const cached = i < history.cached.length;
      if (known) {
        api.text(
          ctx,
          word === '.' ? '“.”' : word,
          x(i),
          463,
          48,
          output < 0 ? C.blue : C.yellow,
          'center',
        );
        if (output >= 0)
          api.text(
            ctx,
            'T' + (output + 1) + ' · ' + tokenTimes[output] + ' ms',
            x(i),
            525,
            25,
            C.ink,
            'center',
          );
      }
      api.rect(
        ctx,
        x(i) - 55,
        697,
        51,
        55,
        cached ? C.cyan : C.panel,
        cached ? C.cyan : C.muted,
        4,
      );
      api.rect(ctx, x(i) + 4, 697, 51, 55, cached ? C.pink : C.panel, cached ? C.pink : C.muted, 4);
      if (cached) {
        api.text(ctx, 'K', x(i) - 30, 736, 29, C.bg, 'center');
        api.text(ctx, 'V', x(i) + 29, 736, 29, C.bg, 'center');
      }
    });
    api.text(ctx, 'Cached', 110, 737, 35, C.ink);
    if (history.feed > 0 && history.emitted === state.beat + 1) {
      const column = x(prompt.length + state.beat);
      const tip = 552 + history.feed * 120;
      api.line(ctx, column, 550, column, tip, C.yellow, 4);
      api.circle(ctx, column, tip, 7, C.yellow);
    }
    const summary =
      history.cached.length +
      ' cached positions     ·     ' +
      history.emitted +
      (history.emitted === 1 ? ' emitted token' : ' emitted tokens');
    api.text(ctx, summary, 960, 863, 44, C.ink, 'center');
    if (spoken(state, 2, 'seven-cached', 0.5))
      api.text(
        ctx,
        'Full history   ·   P + O − 1  =  4 + 4 − 1  =  7',
        960,
        963,
        40,
        C.yellow,
        'center',
      );
  });
}

export default {
  id: 'decode',
  draw: drawDecode,
  cues: [
    'take-at',
    'emit-dawn',
    'take-dawn',
    'emit-too',
    'take-too',
    'emit-period',
    'seven-cached',
  ],
};
