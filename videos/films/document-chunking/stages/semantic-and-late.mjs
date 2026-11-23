import { lateChunkSnapshot } from '../construction.mjs';
import { footer, text, visualFocus } from '../defaults.mjs';
export function drawSemanticAndLate(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    const snapshot = lateChunkSnapshot(beat, progress2, state);
    const {
      tokens,
      selected,
      encodedCount,
      encodeProgress,
      pooledCount,
      poolProgress,
      runningMean,
    } = snapshot;
    const left = components.panel(
      {
        x: 110,
        y: 300,
        width: 790,
        height: 525,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 22,
      },
      () => {
        text(ctx, api, 'EARLY CHUNK ENCODING', 505, 355, 28, themeColors.blue, 'center');
        const words = ['page', 'the', 'service', 'owner'];
        visualFocus(ctx, api, 'semantic-and-late-simulation-29', () =>
          words.forEach((word, i) => {
            const x = 230 + i * 145;
            api.circle(ctx, x, 480, 14, i === 3 ? themeColors.yellow : themeColors.cyan);
            text(ctx, api, word, x, 525, 25, themeColors.ink, 'center');
          }),
        );
        components.card({
          label: '',
          x: 190,
          y: 605,
          width: 630,
          height: 118,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          padding: 10,
        });
        text(
          ctx,
          api,
          'Earlier name is outside this local span',
          505,
          642,
          22,
          themeColors.ink,
          'center',
        );
        api.math(ctx, String.raw`\mathbf{h}_{3}`, 410, 691, 27, themeColors.cyan, 'center');
        text(
          ctx,
          api,
          `Maya-related feature · ${snapshot.localOwnerFeature.toFixed(2)}`,
          585,
          691,
          22,
          themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          'One illustrative feature value, not a model measurement',
          505,
          770,
          20,
          themeColors.muted,
          'center',
        );
      },
    );
    const right = visualFocus(ctx, api, 'late-full-input', () =>
      components.panel(
        {
          x: 1020,
          y: 300,
          width: 790,
          height: 525,
          fill: themeColors.panel,
          stroke: themeColors.green,
          padding: 22,
        },
        () => {
          text(ctx, api, 'FULL-INPUT ENCODING', 1415, 348, 27, themeColors.green, 'center');
          text(
            ctx,
            api,
            'Illustrative Maya-related feature · encoded before pooling',
            1415,
            384,
            20,
            themeColors.muted,
            'center',
          );
          const centers = tokens.map((_, i) => 1080 + i * 94);
          api.line(ctx, centers[0], 416, centers.at(-1), 416, themeColors.muted, 2);
          if (beat > 0 && encodeProgress > 0.005) {
            api.line(
              ctx,
              centers[0],
              416,
              centers[0] + (centers.at(-1) - centers[0]) * encodeProgress,
              416,
              themeColors.cyan,
              5,
            );
            api.circle(
              ctx,
              centers[0] + (centers.at(-1) - centers[0]) * encodeProgress,
              416,
              7,
              themeColors.cyan,
            );
          }
          tokens.forEach((token, i) => {
            const cx = centers[i];
            const word = token.text;
            const color =
              i === 2 ? themeColors.yellow : i >= 4 ? themeColors.green : themeColors.cyan;
            api.circle(ctx, cx, 445, 12, color);
            text(ctx, api, word, cx, 485, 22, themeColors.ink, 'center');
            if (i < encodedCount) {
              const isSelected = selected.includes(i);
              const isPooled = isSelected && i - selected[0] < pooledCount;
              components.card({
                focusTarget: 'late-contextual-states',
                label: '',
                x: cx - 34,
                y: 505,
                width: 68,
                height: 54,
                fill: themeColors.panel,
                stroke: isPooled ? themeColors.yellow : isSelected ? themeColors.green : color,
                padding: 5,
              });
              api.math(
                ctx,
                String.raw`\mathbf{h}_{${i}}`,
                cx,
                539,
                22,
                isPooled ? themeColors.yellow : color,
                'center',
              );
              text(
                ctx,
                api,
                token.mayaFeature.toFixed(2),
                cx,
                584,
                19,
                isPooled ? themeColors.yellow : themeColors.ink,
                'center',
              );
            }
          });
          text(
            ctx,
            api,
            `Contextual states · ${encodedCount} / ${tokens.length}`,
            1415,
            615,
            22,
            themeColors.muted,
            'center',
          );
          if (pooledCount > 0) {
            const firstX = centers[selected[0]],
              lastX = centers[selected[pooledCount - 1]];
            api.line(ctx, firstX, 625, lastX, 625, themeColors.yellow, 3);
            api.line(ctx, firstX, 618, firstX, 632, themeColors.yellow, 3);
            api.line(ctx, lastX, 618, lastX, 632, themeColors.yellow, 3);
            api.arrow(
              ctx,
              (firstX + lastX) / 2,
              632,
              (firstX + lastX) / 2,
              657,
              themeColors.yellow,
              4,
            );
            const output = visualFocus(
              ctx,
              api,
              'semantic-and-late-object-pooledcount-4-pooled-chunk-feature-runningmean-tof-42',
              () =>
                components.card({
                  label:
                    pooledCount === 4
                      ? `Pooled chunk feature · ${runningMean.toFixed(2)}`
                      : `Running mean · ${pooledCount} / ${selected.length} states · ${runningMean.toFixed(2)}`,
                  x: 1200,
                  y: 660,
                  width: 565,
                  height: 82,
                  fill: themeColors.panel,
                  stroke: themeColors.yellow,
                  textColor: themeColors.yellow,
                  fontSize: pooledCount === 4 ? 25 : 22,
                  padding: 9,
                }),
            );
            if (pooledCount === 4) {
              text(
                ctx,
                api,
                'The selected states carry context from the earlier name',
                1482,
                776,
                19,
                themeColors.muted,
                'center',
              );
            }
          }
        },
      ),
    );
    if (pooledCount === selected.length) {
      api.math(
        ctx,
        String.raw`\mathbf{c}_{4:7}=\frac{1}{4}\sum_{i=4}^{7}\mathbf{h}_i`,
        960,
        866,
        30,
        themeColors.cyan,
        'center',
      );
    }
    text(
      ctx,
      api,
      'Returned words: “page the service owner”',
      960,
      915,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'semantic-and-late',
  draw: drawSemanticAndLate,
  cues: [
    'semantic-and-late-beat-1-focus-1',
    'semantic-and-late-beat-2-focus-1',
    'semantic-and-late-beat-2-focus-2',
    'semantic-and-late-beat-3-focus-1',
  ],
};
