import { scoreFastP } from '../arithmetic.mjs';
import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawBenchmarkBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('benchmark-boundaries', state);
  api.focus.target('benchmark-boundaries-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Count correctness before the speed threshold',
        'Authored four-task worksheet at speedup threshold p=1',
      );
      const tasks = [
          {
            correct: true,
            speedup: 1.3,
          },
          {
            correct: false,
            speedup: 8,
          },
          {
            correct: true,
            speedup: 0.8,
          },
          {
            correct: true,
            speedup: 1.1,
          },
        ],
        result = scoreFastP(tasks, 1);
      tasks.forEach((v, i) => {
        const y = 400 + i * 115;
        drawChapterText(ctx, api, 'T' + (i + 1), 260, y + 42, 30, themeColors.blue);
        drawRow(
          ctx,
          api,
          [v.correct ? 'correct' : 'wrong', v.speedup + '×'],
          550,
          y,
          800,
          v.correct ? themeColors.green : themeColors.pink,
        );
        if (i < Math.ceil(progress * 4))
          drawChapterText(
            ctx,
            api,
            v.correct && v.speedup > 1 ? 'counts' : 'zero',
            1610,
            y + 42,
            29,
            v.correct && v.speedup > 1 ? themeColors.green : themeColors.pink,
            'center',
          );
      });
      if (at('fastp', 0))
        drawChapterText(
          ctx,
          api,
          'fast₁ = ' + result.eligible + '/' + result.total + ' = ' + result.fraction,
          960,
          920,
          37,
          themeColors.yellow,
          'center',
        );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Preserve the stated benchmark denominator',
        'Historical KernelBench-Verified method snapshot',
      );
      drawRow(ctx, api, ['250 original', '−3 constant-output'], 270, 460, 1380, themeColors.blue);
      if (at('active', 1))
        drawRow(ctx, api, ['247 active tasks'], 550, 680, 820, themeColors.green);
      drawNote(
        ctx,
        api,
        'H200 / TF32 baseline / four correctness distributions / best-of-five samples / fixed shapes',
      );
    } else if (currentBeat === 2) {
      drawTitle(
        ctx,
        api,
        'Keep separate suites in separate columns',
        'Published method and task model determine the interpretation',
      );
      drawRow(
        ctx,
        api,
        ['KernelBench-X', '176 tasks', '15 categories', '6 GPUs'],
        240,
        450,
        1440,
        themeColors.cyan,
      );
      drawRow(
        ctx,
        api,
        ['SOL-ExecBench', '235 problems', 'B200 target', 'fixed baseline'],
        240,
        680,
        1440,
        themeColors.green,
      );
      drawNote(
        ctx,
        api,
        'Operation/byte proxies are idealized task models · allocation is not transferred traffic',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'A shape-only bound can miss value-dependent work',
        'Same dimensions · inspect the actual required computation',
      );
      const zero = at('zeros', 3);
      drawRow(ctx, api, zero ? [0, 0, 0, 0] : [1, 3, 5, 7], 320, 460, 1280, themeColors.blue);
      drawRow(
        ctx,
        api,
        [zero ? 'constant-value shortcut' : 'full declared path'],
        450,
        680,
        1020,
        zero ? themeColors.yellow : themeColors.cyan,
      );
      drawChapterText(
        ctx,
        api,
        'Check the assumed work, the executed code and the timing',
        960,
        860,
        33,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Match the baseline precision to the application',
      );
    }
  });
}
export default {
  id: 'benchmark-boundaries',
  draw: drawBenchmarkBoundaries,
  cues: [
    'kg-benchmark-boundaries-voice-0',
    'kg-benchmark-boundaries-fastp',
    'kg-benchmark-boundaries-voice-1',
    'kg-benchmark-boundaries-active',
    'kg-benchmark-boundaries-voice-2',
    'kg-benchmark-boundaries-voice-3',
    'kg-benchmark-boundaries-zeros',
  ],
};
