import { pairs } from '../fixtures.mjs';
import { orderedAffineFixture, orderedPrefixTree } from '../model.mjs';
import { arrow, box, extensionEquation, extensionText, footer } from '../defaults.mjs';
export function drawPrefixConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    actualBeat = state.beat ?? 0;
  const currentBeat = actualBeat;
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const active = (id) => cueProgress(id) > 0;
  const target =
    currentBeat < 3
      ? 'prefix-construction' + '-mechanism'
      : 'prefix-construction' + '-extension-' + (currentBeat + 1);
  const pairText = (v) => '(' + v.map((x) => Number(x.toFixed(4))).join(', ') + ')';
  api.focus.target(target, () => {
    if (currentBeat < 2) {
      const reversed = currentBeat === 1 && active('ssm-prefix-reverse');
      extensionText(
        ctx,
        api,
        reversed
          ? 'Change order, keeping the two update identities'
          : 'Apply each affine update to its incoming state',
        960,
        285,
        38,
      );
      const swap = build('ssm-prefix-reverse');
      orderedAffineFixture().updates.forEach((pair, i) => {
        const x = 300 + i * 850 + (i ? -1 : 1) * 850 * swap,
          y = 410 + (i ? 1 : -1) * 100 * Math.sin(Math.PI * swap);
        box(
          ctx,
          api,
          '× ' + pair[0] + '  + ' + pair[1],
          x,
          y,
          450,
          110,
          i ? themeColors.pink : themeColors.blue,
          39,
        );
      });
      const first = (currentBeat > 0 && !reversed) || resultComplete('ssm-prefix-first'),
        second = (currentBeat > 0 && !reversed) || resultComplete('ssm-prefix-second');
      extensionText(ctx, api, 'h₀ = 0', 180, 690, 37, themeColors.muted);
      arrow(ctx, api, 310, 675, 610, 675, themeColors.blue);
      extensionText(
        ctx,
        api,
        reversed
          ? resultComplete('ssm-prefix-reverse')
            ? 'h₁ = 1'
            : 'first result pending'
          : first
            ? 'h₁ = 2'
            : 'first result pending',
        850,
        690,
        35,
        themeColors.blue,
      );
      arrow(ctx, api, 1070, 675, 1320, 675, themeColors.pink);
      extensionText(
        ctx,
        api,
        reversed
          ? resultComplete('ssm-prefix-reverse')
            ? 'h₂ = 2.5'
            : 'second result pending'
          : second
            ? 'h₂ = 1.4'
            : 'second result pending',
        1580,
        690,
        35,
        themeColors.green,
      );
      if (currentBeat === 0 && second)
        extensionEquation(ctx, api, '0.2(0.5h+2)+1=0.1h+1.4', 960, 870, 44, themeColors.yellow);
      if (currentBeat === 1)
        extensionText(
          ctx,
          api,
          resultComplete('ssm-prefix-composite')
            ? reversed
              ? 'Original-order reference: (0.1, 1.4)'
              : 'Ordered composite: (0.1, 1.4)'
            : 'Compose the original order',
          960,
          860,
          35,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        reversed
          ? 'Associativity preserves order · swapping inputs changes the function'
          : 'A scan retains both prefixes · a reduction retains only the final composition',
      );
    } else {
      const tree = orderedPrefixTree(),
        x = [300, 740, 1180, 1620];
      extensionText(
        ctx,
        api,
        'First reduce ranges, then send incoming prefixes down',
        960,
        270,
        37,
      );
      pairs.forEach((pair, i) =>
        box(ctx, api, pairText(pair), x[i] - 155, 390, 310, 80, themeColors.blue, 29),
      );
      const up = build('ssm-prefix-tree-up'),
        down = build('ssm-prefix-tree-down');
      if (up > 0) {
        [
          [520, tree.left],
          [1400, tree.right],
        ].forEach(([cx, pair], i) => {
          arrow(ctx, api, x[2 * i], 485, cx, 555, themeColors.yellow);
          arrow(ctx, api, x[2 * i + 1], 485, cx, 555, themeColors.yellow);
          box(
            ctx,
            api,
            resultComplete('ssm-prefix-tree-up') ? pairText(pair) : 'compose range',
            cx - 170,
            575,
            340,
            80,
            themeColors.yellow,
            28,
          );
        });
      }
      if (down > 0) {
        extensionText(ctx, api, 'incoming identity (1, 0)', 480, 760, 29, themeColors.green);
        extensionText(
          ctx,
          api,
          'incoming left range ' + pairText(tree.left),
          1400,
          760,
          29,
          themeColors.green,
        );
        for (let i = 0; i < 4; i++) {
          extensionText(
            ctx,
            api,
            'prefix in ' + pairText(tree.incoming[i]),
            x[i],
            820,
            25,
            themeColors.green,
          );
          arrow(ctx, api, x[i], 835, x[i], 855, themeColors.green, 3);
          box(
            ctx,
            api,
            resultComplete('ssm-prefix-tree-down')
              ? 'h' + (i + 1) + ' = ' + Number(tree.outputs[i].toFixed(4))
              : 'prefix pending',
            x[i] - 155,
            870,
            310,
            80,
            resultComplete('ssm-prefix-tree-down') ? themeColors.green : themeColors.muted,
            29,
          );
        }
      }
      footer(
        ctx,
        api,
        'Incoming prefixes compose before local updates · every leaf receives its complete ordered prefix',
      );
    }
  });
}
export default {
  id: 'prefix-construction',
  draw: drawPrefixConstruction,
  cues: [
    'prefix-construction-b1',
    'ssm-prefix-first',
    'ssm-prefix-second',
    'prefix-construction-b2',
    'ssm-prefix-composite',
    'ssm-prefix-reverse',
    'prefix-construction-b3',
    'ssm-prefix-tree-up',
    'ssm-prefix-tree-down',
  ],
};
