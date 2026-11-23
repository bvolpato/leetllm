import { FAIL_PREFIX, LANGUAGE, VALUE_PREFIX } from '../fixtures.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { prefixLine } from '../page.mjs';

export function drawPrefixLanguage(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('prefix-paths', () => {
    const shared = focus.progress('prefix-key', 0);
    const branch = focus.progress('prefix-fa', 0);
    const prefix =
      shared < 1
        ? VALUE_PREFIX.slice(0, Math.floor(shared * VALUE_PREFIX.length))
        : FAIL_PREFIX.slice(0, VALUE_PREFIX.length + Math.floor(branch * 2));
    prefixLine(ctx, api, prefix);
    text(ctx, api, 'Complete strings in this grammar', 145, 523, 34, C.muted);
    const cell = 50;
    LANGUAGE.forEach((record, row) => {
      const y = 660 + row * 170;
      const possible = record.startsWith(prefix);
      [...record].forEach((ch, col) => {
        const color = !possible ? C.muted : col < prefix.length ? C.yellow : C.ink;
        code(ctx, api, ch, 170 + col * cell, y, 52, color);
      });
      if (prefix.length && possible)
        api.line(ctx, 165, y + 21, 165 + prefix.length * cell - 10, y + 21, C.yellow, 5);
      text(
        ctx,
        api,
        possible ? 'Possible' : 'Ruled out',
        1720,
        y,
        38,
        possible ? C.cyan : C.muted,
        'right',
      );
    });
  });
}
export default {
  id: 'prefix-language',
  draw: drawPrefixLanguage,
  cues: ['prefix-key', 'prefix-fa'],
};
