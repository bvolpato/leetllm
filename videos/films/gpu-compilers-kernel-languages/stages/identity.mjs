import { specializationFixture } from '../arithmetic.mjs';
import { after, arrow, text } from '../defaults.mjs';

export function drawIdentity(ctx, scene, state, api) {
  const { C, focus } = api;
  const changed = after(api, 'cache-header');
  const stale = after(api, 'stale-result');
  const miss = after(api, 'header-miss');
  const rebuild = after(api, 'compile-header');
  const wrote = after(api, 'rebuilt-result');
  const value = specializationFixture(changed ? 2 : 1, rebuild);
  focus.target('cache-recipe', () => {
    api.text(ctx, 'vector_add.cu', 155, 262, 31, C.cyan, 'left', 'mono');
    text(ctx, api, 'out = (4 + 5) × SCALE', 155, 363, 54, C.ink);
    text(ctx, api, 'scale.cuh', 1090, 262, 31, C.cyan);
    api.rect(ctx, 1080, 296, 610, 98, C.panel, changed ? C.yellow : C.cyan, 6);
    text(ctx, api, '#define SCALE ' + value.factor, 1110, 362, 46, changed ? C.yellow : C.ink);
  });
  focus.target('cache-lookups', () => {
    api.line(ctx, 150, 455, 1740, 455, C.muted, 2);
    text(ctx, api, 'Lookup key', 155, 529, 29, C.muted);
    text(ctx, api, 'Compiled operation', 830, 529, 29, C.muted);
    text(ctx, api, 'Output', 1575, 529, 29, C.muted, 'center');
    const cached = after(api, 'cache-save');
    for (let i = 0; i < 2; i++) {
      const y = 635 + 180 * i;
      const lower = i === 1;
      const probing = lower ? focus.visible('lookup-header') : stale;
      const color = probing ? (lower ? C.cyan : C.pink) : C.muted;
      text(ctx, api, lower ? 'Main file + header' : 'Main file alone', 155, y + 14, 39, color);
      const replaced = lower && value.compiled;
      const empty = lower && miss && !replaced;
      if (cached && (!changed || !lower || miss)) {
        const instruction = empty ? 'MISS' : 'multiply by ' + (replaced ? value.factor : 1);
        arrow(ctx, api, 595, y, 725, y, color);
        api.rect(ctx, 750, y - 52, 462, 106, C.panel, empty ? C.yellow : color, 5);
        text(ctx, api, instruction, 981, y + 14, 37, empty ? C.yellow : C.ink, 'center');
      }
      const active = lower ? wrote : stale;
      // Both keys can retrieve the original scale-one operation before the edit.
      const original = cached && !changed;
      const result = active
        ? lower
          ? value.current
          : value.cached
        : original
          ? value.cached
          : null;
      api.rect(
        ctx,
        1475,
        y - 53,
        200,
        106,
        C.panel,
        result === null ? C.muted : active && !lower ? C.pink : C.green,
        7,
      );
      if (result !== null) {
        arrow(ctx, api, 1240, y, 1450, y, active && !lower ? C.pink : C.green);
        text(ctx, api, result, 1575, y + 20, 61, C.ink, 'center');
      }
    }
    const question = changed && !stale ? 'Which value will the main-file lookup write?' : '';
    const comparison = wrote
      ? 'Same main file. The included header changed what the executable multiplies by.'
      : !cached && after(api, 'cache-original')
        ? '(4 + 5) × 1 = ' + value.cached
        : question;
    if (comparison) text(ctx, api, comparison, 155, 999, 32, C.ink);
  });
}

export default {
  id: 'identity',
  draw: drawIdentity,
  cues: [
    'cache-original',
    'cache-save',
    'cache-header',
    'stale-result',
    'lookup-header',
    'header-miss',
    'compile-header',
    'rebuilt-result',
  ],
};
