import { chapterText, footer, line, rectangle, title } from '../defaults.mjs';
export function drawTargetBuild(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'target-build'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    cueProgress = (k) => api.focus.progress(key(k), 0),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'The measurement belongs to these bytes and this target'
        : currentBeat === 1
          ? 'Read the actual compiled allocation'
          : 'Keep the exercised shapes beside their results',
    );
    if (currentBeat === 0) {
      F('source', () => {
        rectangle(ctx, api, 170, 365, 670, 450, themeColors.panel, themeColors.blue);
        chapterText(ctx, api, 'transpose_lab.cu', 220, 435, 34, themeColors.blue, 'left');
        chapterText(ctx, api, 'source 2322b4c9c9eb…', 220, 510, 29, themeColors.muted, 'left');
        chapterText(ctx, api, 'transpose_checks.hpp', 220, 610, 34, themeColors.blue, 'left');
        chapterText(ctx, api, 'header 1ba87dfc93a5…', 220, 685, 29, themeColors.muted, 'left');
      });
      F('target', () => {
        rectangle(ctx, api, 1080, 365, 670, 450, themeColors.panel, themeColors.cyan);
        for (let i = 0; i < 12; i++) {
          line(ctx, api, 1050, 395 + i * 33, 1080, 395 + i * 33, themeColors.cyan);
          line(ctx, api, 1750, 395 + i * 33, 1780, 395 + i * 33, themeColors.cyan);
        }
        chapterText(ctx, api, 'RTX 5070 Ti · CC 12.0', 1415, 455, 37, themeColors.cyan);
        chapterText(ctx, api, 'CUDA 13.2.78 · sm_120', 1415, 555, 31);
        chapterText(ctx, api, 'driver 595.71.05', 1415, 635, 31);
        chapterText(ctx, api, 'GDDR7 · actual target', 1415, 720, 29, themeColors.muted);
      });
      line(ctx, api, 870, 590, 1050, 590, themeColors.yellow, 5);
      chapterText(ctx, api, 'optimized native build', 960, 900, 32, themeColors.yellow);
      footer(
        ctx,
        api,
        'Source/header identity + build flags + actual target · compiler output is preserved',
      );
    } else if (currentBeat === 1) {
      const rows = [
        ['naive', 20, 0, 0],
        ['tiled', 30, 4096, 1],
        ['padded', 30, 4224, 1],
        ['broken', 32, 4224, 0],
      ];
      chapterText(ctx, api, 'Kernel', 230, 365, 29, themeColors.muted);
      chapterText(ctx, api, 'Registers / thread', 740, 365, 29, themeColors.muted);
      chapterText(ctx, api, 'Static shared storage', 1250, 365, 29, themeColors.muted);
      chapterText(ctx, api, 'Barrier', 1690, 365, 29, themeColors.muted);
      rows.forEach(([name, regs, bytes, barriers], i) => {
        const y = 420 + i * 120;
        chapterText(
          ctx,
          api,
          name,
          240,
          y + 35,
          33,
          name === 'broken' ? themeColors.pink : themeColors.blue,
        );
        F(i === 0 ? 'registers' : i === 3 ? 'registers32' : 'registers30', () => {
          const k = i === 0 ? 'registers' : i === 3 ? 'registers32' : 'registers30';
          rectangle(ctx, api, 450, y, 650, 65, themeColors.panel, themeColors.line);
          if (cueProgress(k) > 0)
            rectangle(
              ctx,
              api,
              450,
              y,
              (regs / 32) * 650 * cueProgress(k),
              65,
              themeColors.blue + '44',
              undefined,
              4,
            );
          if (resultComplete(k)) chapterText(ctx, api, regs, 775, y + 45, 35, themeColors.ink);
        });
        F('shared', () => {
          rectangle(ctx, api, 1160, y, 400, 65, themeColors.panel, themeColors.line);
          if (bytes && cueProgress('shared') > 0)
            rectangle(
              ctx,
              api,
              1160,
              y,
              (bytes / 4224) * 400 * cueProgress('shared'),
              65,
              themeColors.cyan + '44',
              undefined,
              4,
            );
          if (resultComplete('shared'))
            chapterText(ctx, api, bytes + ' B', 1360, y + 45, 30, themeColors.ink);
        });
        F('barriers', () =>
          chapterText(
            ctx,
            api,
            resultComplete('barriers') ? barriers : '?',
            1690,
            y + 43,
            34,
            barriers ? themeColors.green : themeColors.muted,
          ),
        );
      });
      chapterText(
        ctx,
        api,
        'Actual report: 0 spill loads / 0 spill stores for naive, tiled and padded',
        960,
        945,
        29,
        themeColors.green,
      );
      footer(
        ctx,
        api,
        'Compiler allocation does not measure achieved resident warps or elapsed time',
      );
    } else {
      const shapes = [1, 7, 31, 32, 33, 65, 257, 4096],
        n = Math.floor(8 * cueProgress('shapes'));
      for (let i = 0; i < 8; i++) {
        const x = 200 + (i % 4) * 420,
          y = 380 + Math.floor(i / 4) * 215;
        rectangle(
          ctx,
          api,
          x,
          y,
          320,
          150,
          themeColors.panel,
          i < n ? themeColors.green : themeColors.line,
        );
        chapterText(
          ctx,
          api,
          'N = ' + shapes[i],
          x + 160,
          y + 55,
          36,
          i < n ? themeColors.ink : themeColors.muted,
        );
        F(['shapes', 'checked'], () =>
          chapterText(
            ctx,
            api,
            resultComplete('checked') ? '4 normal variants · exact' : 'shape recorded',
            x + 160,
            y + 115,
            26,
            resultComplete('checked') ? themeColors.green : themeColors.muted,
          ),
        );
      }
      F('cpu', () =>
        chapterText(
          ctx,
          api,
          resultComplete('cpu')
            ? 'CPU model: ownership proof on its enumerated coordinates'
            : 'GPU execution: recorded boundary and large-shape checks',
          960,
          915,
          30,
          themeColors.cyan,
        ),
      );
      footer(
        ctx,
        api,
        'Copy is a different operation with equal logical bytes · CPU enumeration is not a GPU profile',
      );
    }
  }
}
export default {
  id: 'target-build',
  draw: drawTargetBuild,
  cues: [
    'gpu-target-build-source',
    'gpu-target-build-target',
    'gpu-target-build-registers',
    'gpu-target-build-shared',
    'gpu-target-build-barriers',
    'gpu-target-build-registers30',
    'gpu-target-build-registers32',
    'gpu-target-build-shapes',
    'gpu-target-build-checked',
    'gpu-target-build-cpu',
  ],
};
