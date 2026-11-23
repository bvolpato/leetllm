import { buildIndex, clamp } from '../arithmetic.mjs';
import { q } from '../construction.mjs';
import { drawCaption, drawCard, drawReference, drawTransfer, withFocus } from '../defaults.mjs';

const chargedIds = [...buildIndex().get('charged')];

export function drawTrie(ctx, scene, state, api) {
  const { C: themeColors } = api,
    progress = (id, beat = 0, start, end) => q(state, id, beat, start, end);
  {
    const prefix = progress('trie-prefix', 0),
      output = progress('trie-output', 1, 0.02, 0.23),
      posting = progress('trie-posting', 1, 0.37, 0.51),
      positions = {
        root: [130, 340],
        c: [380, 340],
        h: [630, 340],
        a: [880, 340],
        r: [1130, 340],
        g: [1380, 340],
        e: [1380, 570],
        d: [1160, 800],
        s: [1600, 800],
      },
      nodes = {};
    withFocus(ctx, api, 'trie-prefix', () => {
      for (const [key, [x, y]] of Object.entries(positions)) {
        const at = ['c', 'h', 'a', 'r', 'g'].indexOf(key),
          drawNode = () =>
            drawCard(
              ctx,
              api,
              key === 'root' ? 'root' : key + (['e', 'd', 's'].includes(key) ? ' •' : ''),
              x,
              y,
              110,
              80,
              at >= 0 && prefix * 5 >= at + 1 ? themeColors.green : themeColors.blue,
              1,
              32,
            );
        nodes[key] = key === 'g' ? withFocus(ctx, api, 'trie-output', drawNode) : drawNode();
      }
    });
    [
      ['root', 'c'],
      ['c', 'h'],
      ['h', 'a'],
      ['a', 'r'],
      ['r', 'g'],
    ].forEach(([a, z], i) =>
      drawTransfer(ctx, api, nodes[a], nodes[z], themeColors.green, clamp(prefix * 5 - i)),
    );
    withFocus(ctx, api, 'trie-output', () => {
      [
        ['g', 'e'],
        ['e', 'd'],
        ['e', 's'],
      ].forEach(([a, z], i) =>
        drawTransfer(ctx, api, nodes[a], nodes[z], themeColors.cyan, clamp(output * 3 - i)),
      );
      ['charge', 'charged', 'charges']
        .slice(0, Math.floor(output * 3.01))
        .forEach((word, i) => {
          const indexed = word === 'charged';
          const color = indexed && posting > 0 ? themeColors.cyan : themeColors.green;
          const paint = () => drawCard(ctx, api, word + ' [end]', 170, 610 + i * 110, 570, 80, color);
          if (indexed) withFocus(ctx, api, 'trie-stored-term', paint);
          else paint();
        });
      const showPosting = output === 1 && posting === 1;
      if (showPosting) {
        api.path(
          ctx,
          [
            {
              x: 740,
              y: 760,
            },
            {
              x: 780,
              y: 760,
            },
            {
              x: 780,
              y: 895,
            },
            {
              x: 905 + (chargedIds.length - 1) * 230,
              y: 895,
            },
          ],
          {
            color: themeColors.cyan,
            width: 3,
          },
        );
        chargedIds.forEach((id, i) => {
          api.line(ctx, 905 + i * 230, 895, 905 + i * 230, 915, themeColors.cyan, 3);
          drawReference(ctx, api, id, 820 + i * 230, 915, themeColors.cyan, 1, 170);
        });
      }
      drawCaption(
        ctx,
        api,
        showPosting
          ? 'Notes containing charged'
          : output === 1
            ? 'Three autocomplete suggestions'
            : 'Follow the shared prefix',
        themeColors.cyan,
        1035,
      );
    });
  }
}
export default {
  id: 'trie',
  draw: drawTrie,
  cues: ['trie-prefix', 'trie-output', 'trie-posting'],
};
