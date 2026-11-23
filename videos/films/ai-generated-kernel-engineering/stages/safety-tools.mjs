import { kernelChapterFrame } from '../construction.mjs';
import { drawArrow, drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawSafetyTools(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('safety-tools', state);
  api.focus.target('safety-tools-construction', () => {
    const hazards = [
      ['out-of-allocation', 'memcheck'],
      ['shared RAW / WAR / WAW', 'racecheck'],
      ['uninitialized slot', 'initcheck'],
      ['invalid block barrier', 'synccheck'],
    ];
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Attach each observed hazard to an instrument',
        'Representative witnesses · declared command scope',
      );
      hazards.slice(0, 3).forEach(([h, tool], i) => {
        const y = 415 + i * 160;
        drawRow(ctx, api, [h], 230, y, 760, themeColors.pink);
        const known = i < Math.ceil(progress * 3);
        drawRow(
          ctx,
          api,
          [known ? tool : '?'],
          1200,
          y,
          480,
          known ? themeColors.green : themeColors.muted,
        );
        if (known) drawArrow(ctx, api, 1020, y + 36, 1170, y + 36, themeColors.green);
      });
      drawNote(
        ctx,
        api,
        'Initcheck defaults to global memory · shared/all requires the explicit documented option',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Preserve the failure in the process exit code',
        'A report and shell success can disagree',
      );
      drawRow(
        ctx,
        api,
        ['conditional barrier hazard', 'synccheck report'],
        250,
        430,
        1400,
        themeColors.pink,
      );
      const fixed = at('exit', 1);
      drawRow(
        ctx,
        api,
        ['report: hazard', fixed ? 'exit: nonzero' : 'exit: 0'],
        250,
        670,
        1400,
        fixed ? themeColors.green : themeColors.pink,
      );
      drawChapterText(
        ctx,
        api,
        fixed ? 'automation blocks promotion' : 'report can be lost by exit-only automation',
        960,
        855,
        34,
        fixed ? themeColors.green : themeColors.pink,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Start with memcheck · cross-stream/global ordering and deadlocks need separate exercised paths',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Where is the raw report?',
        'Release record for kernel K1',
      );
      const names = [
        'command / version',
        'exit / timeout',
        'raw report',
        'candidate K1',
        'performance run',
      ];
      names.forEach((name, i) => {
        drawChapterText(ctx, api, name, 300, 420 + i * 95, 30, themeColors.blue);
        drawRow(
          ctx,
          api,
          [i === 2 ? 'missing' : i === 4 ? 'instrumentation off' : 'retained'],
          1150,
          375 + i * 95,
          530,
          i === 2 ? themeColors.pink : themeColors.cyan,
        );
      });
      drawChapterText(
        ctx,
        api,
        progress > 0.55 ? 'K1 remains pending' : 'inspect each evidence field',
        960,
        905,
        35,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Record the inputs and paths exercised by each sanitizer run',
      );
    }
  });
}
export default {
  id: 'safety-tools',
  draw: drawSafetyTools,
  cues: [
    'kg-safety-tools-voice-0',
    'kg-safety-tools-voice-1',
    'kg-safety-tools-exit',
    'kg-safety-tools-voice-2',
  ],
};
