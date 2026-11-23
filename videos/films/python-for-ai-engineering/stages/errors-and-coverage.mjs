import { classifyJsonRow, exactMatch } from '../arithmetic.mjs';
import { complete, cueProgress, exactCue, pyP } from '../construction.mjs';
import { examples } from '../fixtures.mjs';
import { code, pyMark, rail, stripe, text } from '../defaults.mjs';
export function drawErrorsAndCoverage(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = currentBeat < 2 ? pyP(state, 'errors-and-coverage') : 1;
  pyMark(api, 'errors-and-coverage', () => {
    if (currentBeat === 0) {
      const cases = [
        ['Program syntax', 'if True', 'SyntaxError', 'py-errors-compile'],
        ['Open input path', 'missing.jsonl', 'FileNotFoundError', 'py-errors-file'],
        [
          'Decode JSON line',
          '{"prediction":}',
          'ValueError: line 2: invalid JSON',
          'py-errors-cause',
        ],
      ];
      cases.forEach(([stage, input, error, cue], i) => {
        const x = 170 + i * 580;
        text(ctx, api, stage, x, 315, 30, api.C.blue);
        rail(ctx, api, x, 370, 520, input, api.C.blue, 110, 30);
        stripe(ctx, api, x, 540, 520, exactCue(state, cue), api.C.pink);
        if (complete(state, cue)) {
          if (i < 2) text(ctx, api, error, x, 650, 29, api.C.pink, 'left', true);
          else {
            code(
              ctx,
              api,
              ['JSONDecodeError', '    ↓ explicit cause', 'ValueError: line 2:', 'invalid JSON'],
              x,
              650,
              27,
              65,
            );
          }
        }
      });
    } else if (currentBeat === 1) {
      const rows = [
        ['missing key', 'KeyError'],
        ['prediction = 7', 'TypeError'],
        ['prediction = " "', 'ValueError'],
        ['"escalated" ≠ "blocked"', 'False'],
      ];
      rows.forEach(([premise, output], i) => {
        const y = 325 + i * 145;
        rail(ctx, api, 220, y, 810, premise, api.C.blue, 90, 33);
        if (
          i < Math.floor(progress * 4 + 0.0001) ||
          (i === 3 && complete(state, 'py-errors-types'))
        )
          rail(ctx, api, 1200, y, 500, output, i === 3 ? api.C.yellow : api.C.pink, 90, 36);
      });
      text(
        ctx,
        api,
        'Final exception + message → follow calls upward',
        960,
        945,
        30,
        api.C.muted,
        'center',
      );
    } else {
      const rows = [
        ...examples,
        { prompt: 'Access request 104 status?', expected: 'approved', prediction: 7 },
      ];
      const checked = rows.map((row, i) => classifyJsonRow(row, i + 1));
      const visits = Math.floor(exactCue(state, 'py-errors-quarantine') * rows.length);
      const accepted = checked.slice(0, visits).filter((r) => r.accepted);
      const matches = accepted.filter(({ row }) => exactMatch(row.expected, row.prediction)).length;
      text(
        ctx,
        api,
        'Quarantine run   /   accuracy floor 2/3   /   coverage floor 95%',
        170,
        254,
        35,
        api.C.ink,
      );
      const columns = [170, 400, 745, 1080, 1420];
      ['Request', 'Expected', 'Prediction', 'Input', 'Decision'].forEach((v, i) =>
        text(ctx, api, v, columns[i], 347, 31, api.C.muted),
      );
      rows.forEach((row, i) => {
        const y = 438 + i * 90;
        [101 + i, row.expected, JSON.stringify(row.prediction)].forEach((v, j) =>
          text(ctx, api, v, columns[j], y, 33, j === 2 ? api.C.cyan : api.C.ink, 'left', true),
        );
        if (i >= visits) return;
        const ok = checked[i].accepted;
        text(
          ctx,
          api,
          ok ? 'accepted' : 'rejected',
          columns[3],
          y,
          32,
          ok ? api.C.blue : api.C.pink,
        );
        const value = ok
          ? exactMatch(row.expected, row.prediction)
            ? 'True'
            : 'False'
          : 'wrong type';
        text(
          ctx,
          api,
          value,
          columns[4],
          y,
          32,
          value === 'True' ? api.C.green : api.C.pink,
          'left',
          true,
        );
      });
      const verdict = cueProgress(state, 'coverage-verdict', 3, 0.4, 0.72) === 1;
      const compareRecords = cueProgress(state, 'compare-records', 3, 0.71, 0.83);
      if (compareRecords > 0) {
        text(ctx, api, 'Quarantine record · request 104', 170, 816, 33, api.C.muted);
        text(ctx, api, "Producer's record · request 104", 990, 816, 33, api.C.muted);
        rail(ctx, api, 170, 855, 700, 'prediction: ' + rows[3].prediction, api.C.pink, 105, 44);
        rail(ctx, api, 990, 855, 730, 'prediction: ?', api.C.blue, 105, 44);
      } else if (complete(state, 'py-errors-coverage')) {
        const coveragePass = 100 * accepted.length >= 95 * visits;
        const accuracyPass = 3 * matches >= 2 * accepted.length;
        text(ctx, api, 'Matches / accepted', 170, 816, 31, api.C.muted);
        text(ctx, api, 'Accepted / attempted', 990, 816, 31, api.C.muted);
        rail(
          ctx,
          api,
          170,
          855,
          700,
          matches +
            ' / ' +
            accepted.length +
            (verdict ? (accuracyPass ? '   PASS' : '   FAIL') : ''),
          verdict ? (accuracyPass ? api.C.green : api.C.pink) : api.C.cyan,
          105,
          46,
        );
        rail(
          ctx,
          api,
          990,
          855,
          730,
          accepted.length +
            ' / ' +
            visits +
            (verdict ? (coveragePass ? '   PASS' : '   HOLD') : ''),
          verdict ? (coveragePass ? api.C.green : api.C.pink) : api.C.cyan,
          105,
          46,
        );
      } else {
        text(
          ctx,
          api,
          'Attempted ' +
            visits +
            '     Accepted ' +
            accepted.length +
            '     Rejected ' +
            (visits - accepted.length),
          170,
          910,
          37,
          api.C.ink,
          'left',
          true,
        );
      }
    }
  });
}
export default {
  id: 'errors-and-coverage',
  draw: drawErrorsAndCoverage,
  cues: [
    'py-errors-and-coverage-0',
    'py-errors-compile',
    'py-errors-file',
    'py-errors-cause',
    'py-errors-and-coverage-1',
    'py-errors-types',
    'py-errors-and-coverage-2',
    'py-errors-quarantine',
    'py-errors-coverage',
    'coverage-verdict',
    'compare-records',
  ],
};
