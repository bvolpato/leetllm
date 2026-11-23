import { kernelChapterFrame } from '../construction.mjs';
import { drawArrow, drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawBuildResources(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('build-resources', state),
    colors = [
      themeColors.blue,
      themeColors.cyan,
      themeColors.pink,
      themeColors.green,
      themeColors.yellow,
    ];
  api.focus.target('build-resources-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Resolve the loaded artifact and actual launched symbol',
        'The included-symbol list alone does not establish dispatch',
      );
      const stages = [
        ['source S1', 'compiler + flags + dependencies'],
        ['cubin K1', 'target sm90 / exact artifact hash'],
        ['wrapper D1', 'supplied wrapper chooses reference'],
      ];
      stages.forEach((a, i) => {
        const y = 420 + i * 155;
        drawRow(ctx, api, [a[0]], 230, y, 400, colors[i]);
        drawChapterText(ctx, api, a[1], 750, y + 45, 30, colors[i]);
        if (i < Math.floor(progress * 3)) api.line(ctx, 650, y + 35, 710, y + 35, colors[i], 5);
      });
      drawNote(
        ctx,
        api,
        'Baseline H100 sm90 and architecture-specific sm90a have different compatibility scope',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Pack whole blocks into the supplied shared-memory budget',
        '99 KiB per SM · 64 KiB requested per block',
      );
      api.rect(ctx, 320, 420, 1188, 130, themeColors.panel, themeColors.muted, 2);
      api.rect(ctx, 320, 420, 768 * Math.min(1, progress * 2), 130, themeColors.blue);
      drawChapterText(ctx, api, '64 KiB block', 700, 390, 36, themeColors.blue, 'center');
      api.rect(ctx, 1088, 600, 420, 100, themeColors.panel, themeColors.yellow, 2);
      drawChapterText(ctx, api, '35 KiB left', 1298, 665, 31, themeColors.yellow, 'center');
      if (at('resident', 1)) {
        drawChapterText(
          ctx,
          api,
          'floor(99 / 64) = 1 block',
          960,
          800,
          40,
          themeColors.green,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'another 64 KiB block does not fit',
          960,
          870,
          31,
          themeColors.pink,
          'center',
        );
      }
      drawNote(
        ctx,
        api,
        'Illustrative single constraint · registers,threads and allocation granularity may reduce residency further',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Trace a spill to its chosen storage',
        'Compiler choice changes the traffic experiment',
      );
      const shared = progress > 0.55;
      drawRow(ctx, api, ['register value r9'], 300, 425, 1300, themeColors.blue);
      const x = shared ? 1110 : 350;
      api.rect(
        ctx,
        x,
        660,
        470,
        110,
        themeColors.panel,
        shared ? themeColors.cyan : themeColors.pink,
        2,
        8,
      );
      drawChapterText(
        ctx,
        api,
        shared ? 'opt-in shared spill' : 'local-memory spill',
        x + 235,
        728,
        32,
        shared ? themeColors.cyan : themeColors.pink,
        'center',
      );
      drawArrow(ctx, api, 950, 515, x + 235, 635, shared ? themeColors.cyan : themeColors.pink);
      drawChapterText(
        ctx,
        api,
        shared ? 'CUDA13 opt-in path' : 'device-backed / cached',
        960,
        875,
        31,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Inspect actual compiler reports and completed performance · no residency/speed result is measured here',
      );
    }
  });
}
export default {
  id: 'build-resources',
  draw: drawBuildResources,
  cues: [
    'kg-build-resources-voice-0',
    'kg-build-resources-voice-1',
    'kg-build-resources-resident',
    'kg-build-resources-voice-2',
  ],
};
