import { exactMatch, score } from '../arithmetic.mjs';
import { examples } from '../fixtures.mjs';
import { exactCue, pyP } from '../construction.mjs';
import { code, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawProgramEntry(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    q = (id) => exactCue(state, 'py-entry-' + id);
  pyMark(api, 'program-entry', () => {
    if (currentBeat === 0) {
      const visits = Math.floor(q('plus') * examples.length);
      const result = score(examples);
      code(
        ctx,
        api,
        [
          'matches = 0',
          'for row in examples:',
          '    if exact_match(row["expected"], row["prediction"]):',
          '        matches += 1',
        ],
        200,
        300,
        32,
        60,
      );
      examples.forEach((row, i) => {
        const x = 220 + i * 540;
        const match = exactMatch(row.expected, row.prediction);
        const seen = i < visits;
        text(ctx, api, 'request ' + (101 + i), x, 620, 32, api.C.blue);
        rail(
          ctx,
          api,
          x,
          660,
          430,
          seen ? 'matches = ' + score(examples.slice(0, i + 1)).matches : '…',
          seen && match ? api.C.green : api.C.muted,
          90,
          37,
        );
      });
      text(
        ctx,
        api,
        'matches, total, fraction = score_examples(examples)',
        220,
        860,
        33,
        api.C.ink,
        'left',
        true,
      );
      if (q('tuple') === 1) {
        text(ctx, api, 'matches = ' + result.matches, 220, 960, 36, api.C.cyan, 'left', true);
        text(ctx, api, 'total = ' + result.total, 760, 960, 36, api.C.cyan, 'left', true);
        text(
          ctx,
          api,
          'fraction ≈ ' + result.fraction.toFixed(3),
          1300,
          960,
          36,
          api.C.cyan,
          'left',
          true,
        );
      }
    } else if (currentBeat === 1) {
      code(ctx, api, ['if __name__ == "__main__":', '    main(selected_path)'], 250, 310, 42, 65);
      const gate = q('guard'),
        usage = q('usage');
      rail(ctx, api, 200, 520, 650, 'import module', api.C.blue, 85, 35);
      rail(ctx, api, 1080, 520, 650, 'execute module directly', api.C.cyan, 85, 32);
      if (gate === 1) {
        text(ctx, api, 'Functions available · no report', 525, 680, 31, api.C.blue, 'center');
        text(ctx, api, 'main(selected_path)', 1405, 680, 35, api.C.cyan, 'center', true);
      }
      if (q('script') > 0) code(ctx, api, ['argv[0]  script'], 1100, 750, 31);
      if (q('path') > 0) code(ctx, api, ['argv[1]  optional input path'], 1100, 810, 31);
      if (q('default') > 0)
        text(ctx, api, 'No argv[1] → declared default', 1100, 868, 30, api.C.muted);
      if (usage === 1)
        text(
          ctx,
          api,
          'Extra arguments → usage exit before open',
          960,
          940,
          31,
          api.C.pink,
          'center',
        );
    } else {
      const bad = q('input'),
        failed = q('exit');
      const labels = ['load all accepted rows', 'compute counts', 'print metric'];
      labels.forEach((s, i) => {
        rail(ctx, api, 220 + i * 540, 340, 470, s, api.C.blue, 100, 28);
      });
      stripe(ctx, api, 220, 490, 1550, pyP(state, 'program-entry'), api.C.cyan);
      if (failed === 1) {
        rail(
          ctx,
          api,
          220,
          590,
          1550,
          'Below-floor data: metric → stderr diagnostic → exit 1',
          api.C.pink,
          100,
          32,
        );
        code(
          ctx,
          api,
          ['stdout: metric printed', 'stderr: failed-gate diagnostic', 'status: 1'],
          260,
          770,
          32,
          60,
        );
      }
      if (bad === 1) {
        rail(ctx, api, 1030, 770, 740, 'Input exception: no metric', api.C.pink, 100, 31);
        text(
          ctx,
          api,
          'Different boundary · different coverage',
          1400,
          940,
          28,
          api.C.muted,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'program-entry',
  draw: drawProgramEntry,
  cues: [
    'py-program-entry-0',
    'py-entry-tuple',
    'py-entry-plus',
    'py-program-entry-1',
    'py-entry-guard',
    'py-entry-script',
    'py-entry-path',
    'py-entry-default',
    'py-entry-usage',
    'py-program-entry-2',
    'py-entry-exit',
    'py-entry-input',
  ],
};
