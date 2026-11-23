import { prEvent } from '../construction.mjs';
import { parentPackingFixture } from '../model.mjs';
import {
  card,
  centeredText,
  extensionFooter,
  extensionText,
  meter,
  sourcePage,
} from '../defaults.mjs';
export function drawContextBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('context-budget-mechanism', () => {
    const fixture = parentPackingFixture(),
      rendered = fixture.packed
        .map((e) => '[' + e.sourceId + '] ' + e.parentId + ' (' + e.version + '): ' + e.text)
        .join('\n');
    if (currentBeat === 0) {
      const words = [
        'definition elsewhere',
        'previous sentence',
        'matched sentence',
        'next sentence',
        'condition farther away',
      ];
      words.forEach((v, i) =>
        card(
          ctx,
          api,
          v,
          250,
          320 + i * 115,
          710,
          90,
          i === 2 ? themeColors.yellow : i === 1 || i === 3 ? themeColors.cyan : themeColors.muted,
          27,
        ),
      );
      if (ev('window', 0) > 0) {
        api.line(ctx, 230, 420, 230, 775, themeColors.cyan, 5);
        api.line(ctx, 980, 420, 980, 775, themeColors.cyan, 5);
        api.line(ctx, 230, 420, 980, 420, themeColors.cyan, 5);
        api.line(ctx, 230, 775, 980, 775, themeColors.cyan, 5);
      }
      centeredText(ctx, api, 'Configured neighbors stay local', 1440, 570, 34, themeColors.yellow);
      centeredText(
        ctx,
        api,
        'A distant definition can remain outside',
        1440,
        680,
        29,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      sourcePage(ctx, api, 100, 345, 830, 400);
      const n = ev('dedup', 1);
      card(
        ctx,
        api,
        n === 1 ? 'Duplicate child reuses E1' : 'Second child → same parent',
        1090,
        355,
        670,
        120,
        n === 1 ? themeColors.muted : themeColors.yellow,
      );
      if (ev('characters', 1) > 0)
        meter(
          ctx,
          api,
          1080,
          650,
          690,
          rendered.length,
          400,
          themeColors.cyan,
          'Rendered labeled context: ' + rendered.length + ' / 400 characters',
        );
      if (done('skip', 1))
        centeredText(
          ctx,
          api,
          'Skip oversized parent · preserve complete conditions',
          1425,
          830,
          28,
          themeColors.green,
        );
    } else {
      const budget = fixture.budget;
      centeredText(
        ctx,
        api,
        'Toy byte-v1 target tokenizer · full formatted request',
        960,
        290,
        32,
        themeColors.yellow,
      );
      let x = 150;
      budget.parts.forEach((part, i) => {
        const w = (1600 * part.tokens) / budget.limit;
        api.rect(
          ctx,
          x,
          490,
          w,
          100,
          [
            themeColors.blue,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
            themeColors.cyan,
          ][i],
          undefined,
          0,
        );
        x += w;
        extensionText(
          ctx,
          api,
          part.label + ' · ' + part.tokens,
          180 + (i % 3) * 570,
          720 + Math.floor(i / 3) * 90,
          28,
          [
            themeColors.blue,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
            themeColors.cyan,
          ][i],
        );
      });
      centeredText(
        ctx,
        api,
        'Prompt ' +
          budget.total +
          ' / ' +
          budget.limit +
          ' · reserved output ' +
          budget.reservedOutput,
        960,
        930,
        34,
        themeColors.ink,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Characters and tokens are different contracts; labels, separators and wrappers consume budget',
    );
  });
}
export default {
  id: 'context-budget',
  draw: drawContextBudget,
  cues: ['pr-window', 'pr-characters', 'pr-skip', 'pr-dedup', 'pr-tokens', 'pr-position'],
};
