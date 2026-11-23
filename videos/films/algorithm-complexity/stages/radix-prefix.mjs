import { PREFIX_QUERY, PREFIX_WORDS } from '../fixtures.mjs';
import { lerp } from '../construction.mjs';
import { radixPrefixSnapshot } from '../model.mjs';
import { arrow, box, focus, text } from '../defaults.mjs';
export function drawRadixPrefix(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = radixPrefixSnapshot(state);
    if (beat === 0) {
      focus(ctx, api, themeColors, 'prefix-query', () => {
        text(
          ctx,
          api,
          themeColors,
          'Find every word that starts with this exact prefix',
          960,
          255,
          36,
          themeColors.muted,
        );
        box(ctx, api, themeColors, 'pla', 190, 300, 270, 80, themeColors.cyan, 36);
      });
      focus(ctx, api, themeColors, 'prefix-words', () => {
        text(ctx, api, themeColors, 'Stored words', 960, 355, 31, themeColors.muted);
        PREFIX_WORDS.forEach((word, row) => {
          const y = 400 + row * 125;
          text(ctx, api, themeColors, String(row + 1), 250, y + 47, 30, themeColors.muted);
          [...word].forEach((letter, column) =>
            box(
              ctx,
              api,
              themeColors,
              letter,
              620 + column * 145,
              y,
              125,
              82,
              column < s.letters ? themeColors.yellow : themeColors.blue,
              35,
            ),
          );
        });
      });
      focus(ctx, api, themeColors, 'prefix-scan', () => {
        text(
          ctx,
          api,
          themeColors,
          'Naive scan: ' +
            s.scanChecks +
            ' / ' +
            PREFIX_WORDS.length * PREFIX_QUERY.length +
            ' prefix comparisons',
          960,
          930,
          37,
          themeColors.yellow,
        );
        text(
          ctx,
          api,
          themeColors,
          'Each word repeats the same leading checks',
          960,
          985,
          29,
          themeColors.muted,
        );
      });
    } else {
      focus(ctx, api, themeColors, 'prefix-tree', () => {
        text(
          ctx,
          api,
          themeColors,
          'Radix tree · exact shared prefix',
          960,
          255,
          36,
          themeColors.muted,
        );
        const rootX = 160,
          rootY = 510,
          branchX = 805,
          branchY = 510;
        const start = {
            x: rootX + 160,
            y: rootY + 45,
          },
          end = {
            x: branchX,
            y: branchY + 45,
          };
        box(ctx, api, themeColors, 'root', rootX, rootY, 160, 90, themeColors.blue, 32);
        api.line(ctx, start.x, start.y, end.x, end.y, themeColors.muted, 4);
        if (s.edge > 0)
          arrow(
            ctx,
            api,
            start.x,
            start.y,
            lerp(start.x, end.x, s.edge),
            end.y,
            themeColors.cyan,
            5,
          );
        box(
          ctx,
          api,
          themeColors,
          'pla',
          490,
          475,
          180,
          70,
          s.edge > 0 ? themeColors.cyan : themeColors.blue,
          34,
        );
        box(
          ctx,
          api,
          themeColors,
          'branch',
          branchX,
          branchY,
          190,
          90,
          s.walk >= 1 ? themeColors.green : themeColors.blue,
          30,
        );
        if (s.walk > 0 && s.walk < 1)
          box(
            ctx,
            api,
            themeColors,
            'query',
            lerp(start.x, end.x, s.walk) - 65,
            630,
            130,
            64,
            themeColors.yellow,
            27,
          );
        text(
          ctx,
          api,
          themeColors,
          s.traversed + ' / 3 shared letters read',
          960,
          840,
          31,
          themeColors.yellow,
        );
        const exits = [
          {
            suffix: 'y',
            word: 'play',
            y: 340,
          },
          {
            suffix: 'ce',
            word: 'place',
            y: 465,
          },
          {
            suffix: 'net',
            word: 'planet',
            y: 590,
          },
          {
            suffix: 'za',
            word: 'plaza',
            y: 715,
          },
        ];
        exits.forEach((item, i) => {
          const origin = {
              x: branchX + 190,
              y: branchY + 45,
            },
            suffixIn = {
              x: 1040,
              y: item.y + 40,
            },
            suffixOut = {
              x: 1190,
              y: item.y + 40,
            },
            target = {
              x: 1270,
              y: item.y + 41,
            };
          const p = Math.max(0, Math.min(1, s.branch * exits.length - i));
          api.line(ctx, origin.x, origin.y, suffixIn.x, suffixIn.y, themeColors.muted, 3);
          api.line(ctx, suffixOut.x, suffixOut.y, target.x, target.y, themeColors.muted, 3);
          if (p > 0) {
            const firstLeg = Math.min(1, p * 2);
            arrow(
              ctx,
              api,
              origin.x,
              origin.y,
              lerp(origin.x, suffixIn.x, firstLeg),
              lerp(origin.y, suffixIn.y, firstLeg),
              themeColors.cyan,
              4,
            );
            if (p > 0.5) {
              const secondLeg = (p - 0.5) * 2;
              arrow(
                ctx,
                api,
                suffixOut.x,
                suffixOut.y,
                lerp(suffixOut.x, target.x, secondLeg),
                lerp(suffixOut.y, target.y, secondLeg),
                themeColors.cyan,
                4,
              );
            }
          }
          box(
            ctx,
            api,
            themeColors,
            item.suffix,
            1040,
            item.y + 5,
            150,
            70,
            p > 0 ? themeColors.cyan : themeColors.muted,
            31,
          );
          box(
            ctx,
            api,
            themeColors,
            item.word,
            1270,
            item.y,
            350,
            82,
            p > 0 ? themeColors.green : themeColors.blue,
            32,
          );
        });
      });
      focus(ctx, api, themeColors, 'prefix-count', () => {
        if (s.count > 0) {
          text(
            ctx,
            api,
            themeColors,
            'Naive scan: 4 × 3 = 12 character comparisons',
            575,
            900,
            32,
            themeColors.pink,
          );
          text(
            ctx,
            api,
            themeColors,
            'Shared radix edge: 3 comparisons',
            1390,
            900,
            32,
            themeColors.cyan,
          );
          text(
            ctx,
            api,
            themeColors,
            'Then return the 4 matching words',
            960,
            975,
            30,
            themeColors.green,
          );
        }
      });
    }
  }
}
export default {
  id: 'radix-prefix',
  draw: drawRadixPrefix,
  cues: [
    'prefix-query',
    'prefix-scan',
    'prefix-edge',
    'prefix-walk',
    'prefix-branch',
    'prefix-count',
  ],
};
