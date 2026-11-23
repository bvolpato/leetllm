import { done, sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterEquation,
  chapterHeading,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawBenchmarkContract(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'benchmark-contract', bi, si),
      resultComplete = (bi, si) => done(state, 'benchmark-contract', bi, si);
    {
      const headings = [
        'One four-GPU all-reduce',
        'Read the units in the benchmark row',
        'Which sample is p99?',
      ];
      chapterHeading(ctx, api, headings[currentBeat]);
      if (currentBeat === 0) {
        const values = [
          ['Payload per rank', '256 MiB', 0],
          ['GPUs / processes / threads', '4 / 1 / 1', 1],
          ['Warmup runs', '5', 1],
          ['Timed runs / correctness checks', '20 / 1', 2],
          ['Timeout', '60 seconds', 2],
        ];
        values.forEach(([k, v, cue], i) => {
          chapterText(ctx, api, k, 220, 400 + i * 110, 31, themeColors.blue);
          chapterCard(
            ctx,
            api,
            v,
            1020,
            350 + i * 110,
            650,
            80,
            progress(0, cue) > 0 ? themeColors.cyan : themeColors.muted,
          );
        });
        api.text(
          ctx,
          './build/all_reduce_perf -b 256M -e 256M -g 4 -n 20 -w 5 -c 1 -T 60',
          960,
          1000,
          33,
          themeColors.ink,
          'center',
          'mono',
        );
      } else if (currentBeat === 1) {
        const bytes = resultComplete(1, 0),
          elements = resultComplete(1, 1),
          seconds = resultComplete(1, 2);
        chapterEquation(
          ctx,
          api,
          '256 × 1024²' + (bytes ? ' = 268435456 bytes' : ''),
          960,
          460,
          45,
          bytes ? themeColors.green : themeColors.yellow,
        );
        chapterEquation(
          ctx,
          api,
          '268435456 / 4' + (elements ? ' = 67108864 floats' : ''),
          960,
          650,
          43,
          elements ? themeColors.green : themeColors.yellow,
        );
        chapterEquation(
          ctx,
          api,
          '6000 µs' + (seconds ? ' = 0.006 s' : ''),
          960,
          840,
          43,
          seconds ? themeColors.green : themeColors.yellow,
        );
        chapterNote(ctx, api, 'Decimal GB/s divides bytes per second by one billion');
      } else {
        chapterText(
          ctx,
          api,
          '#wrong = 0   ·   output matched in the correctness check',
          960,
          389,
          32,
          themeColors.ink,
          'center',
        );
        const q = progress(2, 3),
          index = resultComplete(2, 3) ? 20 : Math.min(20, Math.floor(q * 20));
        for (let j = 0; j < 20; j++) {
          const x = 210 + j * 76,
            h = 80 + j * 12;
          chapterRectangle(
            ctx,
            api,
            x,
            850 - h,
            50,
            h,
            themeColors.panel,
            j + 1 === index ? themeColors.green : themeColors.blue,
          );
        }
        chapterText(
          ctx,
          api,
          'Sorted timing samples · n = 20',
          960,
          930,
          31,
          themeColors.blue,
          'center',
        );
        chapterText(
          ctx,
          api,
          resultComplete(2, 3)
            ? 'ceil(0.99 × 20) = 20 → observed maximum'
            : 'Nearest-rank index = ceil(p × n)',
          960,
          1010,
          31,
          resultComplete(2, 3) ? themeColors.green : themeColors.yellow,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'benchmark-contract',
  draw: drawBenchmarkContract,
  cues: [
    'nc-benchmark-contract-b0-s0',
    'nc-benchmark-contract-b0-s1',
    'nc-benchmark-contract-b0-s2',
    'nc-benchmark-contract-b1-s0',
    'nc-benchmark-contract-b1-s1',
    'nc-benchmark-contract-b1-s2',
    'nc-benchmark-contract-b1-s3',
    'nc-benchmark-contract-b2-s0',
    'nc-benchmark-contract-b2-s1',
    'nc-benchmark-contract-b2-s2',
    'nc-benchmark-contract-b2-s3',
    'nc-benchmark-contract-b2-s4',
  ],
};
