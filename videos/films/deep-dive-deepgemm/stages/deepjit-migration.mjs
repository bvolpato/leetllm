import { sampleDeepGemmChapter } from '../construction.mjs';
import { drawBox, drawFooter, drawLink, drawSubtitle, drawText } from '../defaults.mjs';
export function drawDeepjitMigration(ctx, scene, state, api) {
  return api.focus.target('deepjit-migration-construction', () => {
    const { C: themeColors } = api,
      modelState = sampleDeepGemmChapter('deepjit-migration', state),
      { b: currentBeat, g: teaching2 } = modelState;
    {
      drawSubtitle(ctx, api, 'The host pin and submodule define one cache contract');
      if (currentBeat === 0) {
        const old = drawBox(
            ctx,
            api,
            'July · in-tree JIT',
            150,
            380,
            650,
            110,
            themeColors.blue,
            37,
          ),
          next = drawBox(
            ctx,
            api,
            'October · DeepJIT submodule',
            1120,
            380,
            650,
            110,
            themeColors.cyan,
            34,
          );
        drawLink(ctx, api, old, next, teaching2(0, 0), themeColors.cyan);
        ['Configured first root', 'Environment / fallback root', 'Default .dj root'].forEach(
          (v, i) =>
            drawBox(
              ctx,
              api,
              v,
              420,
              600 + i * 110,
              1080,
              80,
              i <= Math.floor(teaching2(0, 3) * 3) ? themeColors.cyan : themeColors.muted,
              30,
            ),
        );
        drawText(
          ctx,
          api,
          'Snapshot environment before initialization',
          960,
          970,
          29,
          themeColors.yellow,
          'center',
        );
      } else if (currentBeat === 1) {
        const parts = [
            'Dependency\nsignature',
            'Complete compiler\nversion',
            'Effective compiler\nflags',
            'Post-hook path\n+ content',
            'Source + tracked\ninclude tree',
          ],
          ingredients = parts.map((v, i) =>
            drawBox(
              ctx,
              api,
              v,
              135 + i * 335,
              360,
              285,
              120,
              i <= Math.floor(teaching2(1, 0) * 5) ? themeColors.blue : themeColors.muted,
              27,
            ),
          );
        const digest = drawBox(
          ctx,
          api,
          'Length-delimited cache checksum',
          620,
          680,
          680,
          140,
          themeColors.cyan,
          33,
        );
        parts.forEach((_, i) => {
          if (teaching2(1, 0) > i / 5)
            drawLink(ctx, api, ingredients[i], digest, 1, themeColors.blue);
        });
        drawText(
          ctx,
          api,
          'Cache lookup → compiled binary',
          960,
          925,
          32,
          themeColors.yellow,
          'center',
        );
      } else {
        const hit = drawBox(
            ctx,
            api,
            'Existing compiled entry',
            170,
            390,
            650,
            110,
            themeColors.green,
            36,
          ),
          dump = drawBox(
            ctx,
            api,
            'PTX / SASS dump requested',
            1100,
            390,
            650,
            110,
            themeColors.yellow,
            32,
          );
        drawLink(ctx, api, dump, hit, teaching2(2, 1), themeColors.yellow);
        if (teaching2(2, 2) > 0) {
          drawText(
            ctx,
            api,
            'Hit does not rebuild missing dumps',
            960,
            675,
            42,
            themeColors.yellow,
            'center',
          );
          drawBox(
            ctx,
            api,
            'Untracked: CPATH / implicit flags / external headers',
            250,
            820,
            1420,
            100,
            themeColors.pink,
            31,
          );
        }
      }
      drawFooter(ctx, api, 'Version implicit compiler inputs explicitly');
    }
  });
}
export default {
  id: 'deepjit-migration',
  draw: drawDeepjitMigration,
  cues: [
    'deepjit-migration-b0',
    'dg-deepjit-migration-0-0',
    'dg-deepjit-migration-0-1',
    'dg-deepjit-migration-0-2',
    'dg-deepjit-migration-0-3',
    'dg-deepjit-migration-0-4',
    'deepjit-migration-b1',
    'dg-deepjit-migration-1-0',
    'dg-deepjit-migration-1-1',
    'dg-deepjit-migration-1-2',
    'dg-deepjit-migration-1-3',
    'dg-deepjit-migration-1-4',
    'deepjit-migration-b2',
    'dg-deepjit-migration-2-0',
    'dg-deepjit-migration-2-1',
    'dg-deepjit-migration-2-2',
    'dg-deepjit-migration-2-3',
  ],
};
