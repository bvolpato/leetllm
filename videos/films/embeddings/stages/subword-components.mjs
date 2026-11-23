import { subwordComposition } from '../arithmetic.mjs';
import { completed, event } from '../construction.mjs';
import { card, centeredText, extensionText, footer } from '../defaults.mjs';
export function drawSubwordComponents(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString()),
    vec = (v) => '[' + v.map(fmt).join(', ') + ']';
  api.focus.target('subword-components-mechanism', () => {
    const words = ['<play>', '<played>'],
      grams = words.map((w) =>
        Array.from(
          {
            length: w.length - 2,
          },
          (_, i) => w.slice(i, i + 3),
        ),
      ),
      shared = grams[0].filter((x) => grams[1].includes(x));
    centeredText(
      ctx,
      api,
      'Declared character n = 3 toy · original setup uses n = 3…6',
      960,
      285,
      32,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      words.forEach((word, row) => {
        const x = 300,
          y = 400 + row * 260;
        extensionText(
          ctx,
          api,
          row ? 'unknown played' : 'known play',
          250,
          y + 38,
          30,
          row ? themeColors.pink : themeColors.blue,
          'right',
        );
        word
          .split('')
          .forEach((ch, i) =>
            card(
              ctx,
              api,
              ch,
              x + i * 150,
              y,
              115,
              row ? themeColors.pink : themeColors.blue,
              78,
              36,
            ),
          );
        const count = Math.min(
          grams[row].length,
          Math.floor(ev('subword-windows', 0) * (grams[row].length + 1)),
        );
        grams[row]
          .slice(0, count)
          .forEach((g, i) =>
            centeredText(
              ctx,
              api,
              g,
              330 + i * 215,
              y + 155,
              30,
              shared.includes(g) ? themeColors.cyan : themeColors.muted,
            ),
          );
      });
    } else {
      const componentIds = [0, 0, 1],
        r = subwordComposition(componentIds, [
          [1, 0.5],
          [0, 1],
        ]);
      centeredText(
        ctx,
        api,
        'Explicit API arithmetic fixture · repeated bucket IDs',
        960,
        350,
        31,
        themeColors.muted,
      );
      componentIds.forEach((id, i) => {
        card(
          ctx,
          api,
          'bucket ' + id,
          220 + i * 330,
          460,
          260,
          i < 2 ? themeColors.cyan : themeColors.pink,
        );
        centeredText(
          ctx,
          api,
          vec(
            [
              [1, 0.5],
              [0, 1],
            ][id],
          ),
          350 + i * 330,
          615,
          33,
          i < 2 ? themeColors.cyan : themeColors.pink,
        );
      });
      centeredText(ctx, api, 'unknown word: no whole-word row', 960, 760, 32, themeColors.yellow);
      const avg = currentBeat === 2 ? ev('subword-average', 2) : 0,
        current = r.sum.map((v) => v / (1 + 2 * avg));
      centeredText(
        ctx,
        api,
        (avg === 1 ? 'API average ' : avg > 0 ? 'divide by component count ' : 'component sum ') +
          vec(current),
        960,
        880,
        42,
        themeColors.green,
      );
      if (currentBeat === 2)
        centeredText(
          ctx,
          api,
          done('subword-export', 2)
            ? '.vec: vocabulary rows · .bin: component machinery retained'
            : 'Same nonzero direction · changed norm and dot products',
          960,
          955,
          29,
          themeColors.muted,
        );
    }
    footer(
      ctx,
      api,
      'Occurrences remain repeated contributions; a set of unique strings cannot reproduce this API vector',
    );
  });
}
export default {
  id: 'subword-components',
  draw: drawSubwordComponents,
  cues: [
    'emb-subword-windows',
    'emb-subword-occurrences',
    'emb-subword-oov',
    'emb-subword-average',
    'emb-subword-export',
  ],
};
