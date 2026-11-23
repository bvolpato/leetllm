import { recipeDigest } from '../arithmetic.mjs';
import {
  arrow,
  box,
  codeText,
  cueProgress,
  detailText,
  focusTarget,
  footer,
  visible,
} from '../defaults.mjs';
export function drawManifestContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0)
      focusTarget(ctx, api, 'manifest-fields', () => {
        detailText(
          ctx,
          api,
          'A build recipe is an ordered dependency record',
          150,
          280,
          33,
          themeColors.yellow,
        );
        const fields = [
          ['source + includes', 'contents and resolved paths'],
          ['compiler components', 'versions and configuration'],
          ['flags + targets', 'ordered flags; virtual/native targets'],
          ['tensor contract', 'shape, stride, dtype, alignment'],
          ['specialization', 'block, warps, stages'],
        ];
        fields.forEach(([key, value], i) => {
          if (i > 1 && !visible(ctx, api, 'recipe-fields')) return;
          if (i === 4 && !visible(ctx, api, 'meta-parameters')) return;
          const y = 360 + i * 110;
          box(ctx, api, 170, y, 1470, 88, i === 4 ? themeColors.green : themeColors.cyan);
          detailText(ctx, api, key, 200, y + 55, 30, themeColors.cyan);
          detailText(ctx, api, value, 770, y + 55, 29);
        });
      });
    else if (currentBeat === 1) {
      focusTarget(ctx, api, 'manifest-mutations', () => {
        const changes = {
          source: 'changed.cu',
          toolchain: 'different compiler',
          target: 'sm_90',
          flags: ['-lineinfo', '-O3'],
          shape: [999],
          stride: [2],
          dtype: 'float16',
          block: 128,
          warps: 8,
          stages: 3,
        };
        detailText(
          ctx,
          api,
          'CPU recipe exercise · SHA256 miniature',
          150,
          280,
          30,
          themeColors.yellow,
        );
        const n = visible(ctx, api, 'mutate-inputs')
          ? Math.ceil(10 * cueProgress(ctx, api, 'mutate-inputs'))
          : 0;
        Object.entries(changes)
          .slice(0, n)
          .forEach(([key, value], i) => {
            const col = i < 5 ? 0 : 1,
              y = 360 + (i % 5) * 72,
              x = 150 + col * 800;
            detailText(ctx, api, key, x, y, 27, themeColors.cyan);
            codeText(
              ctx,
              api,
              recipeDigest({
                [key]: value,
              }).slice(0, 12),
              x + 210,
              y,
              25,
            );
            detailText(ctx, api, 'MISS', x + 565, y, 27, themeColors.pink);
          });
      });
      focusTarget(ctx, api, 'stride-addresses', () => {
        if (visible(ctx, api, 'stride-addresses')) {
          detailText(
            ctx,
            api,
            'Both arrays contain 1000 logical elements',
            960,
            780,
            29,
            themeColors.yellow,
            'center',
          );
          [1, 2].forEach((stride, i) => {
            const y = 840 + i * 72;
            detailText(
              ctx,
              api,
              `stride ${stride}`,
              150,
              y + 36,
              27,
              i ? themeColors.pink : themeColors.green,
            );
            teaching.grid({
              x: 420,
              y,
              width: 1230,
              height: 56,
              rows: 1,
              columns: 6,
              labels: [
                Array.from(
                  {
                    length: 6,
                  },
                  (_, j) => String(stride * j),
                ),
              ],
              fontSize: 29,
              fill: themeColors.panel,
              stroke: i ? themeColors.pink : themeColors.green,
              textColor: themeColors.ink,
            });
          });
        }
      });
    } else
      focusTarget(ctx, api, 'dependency-tree', () => {
        codeText(ctx, api, 'vector_add.cu', 160, 350, 35, themeColors.blue);
        codeText(ctx, api, '#include "scale.h"', 160, 445, 30, themeColors.cyan);
        arrow(ctx, api, 620, 430, 850, 430, themeColors.cyan);
        box(ctx, api, 880, 330, 780, 370, themeColors.cyan);
        codeText(ctx, api, 'scale.h → nested include', 920, 400, 30, themeColors.cyan);
        codeText(ctx, api, 'resolved path + contents', 920, 485, 30);
        if (visible(ctx, api, 'dependency-discovery')) {
          codeText(ctx, api, 'caller validates changed headers', 920, 570, 27, themeColors.yellow);
          detailText(
            ctx,
            api,
            'Save a validated copy of the build inputs.',
            920,
            650,
            27,
            themeColors.muted,
          );
        }
        detailText(
          ctx,
          api,
          'Artifact digest ≠ recipe digest ≠ load compatibility',
          960,
          850,
          35,
          themeColors.yellow,
          'center',
        );
      });
    if (currentBeat === 1) footer(ctx, api, 'First 12 hex digits of each recipe digest.');
  }
}
export default {
  id: 'manifest-contract',
  draw: drawManifestContract,
  cues: [
    'recipe-fields',
    'meta-parameters',
    'mutate-inputs',
    'stride-addresses',
    'dependency-discovery',
  ],
};
