import { judgeReport } from '../model.mjs';
import { aggregateSwaps } from '../arithmetic.mjs';
import { restoreReplies, restoreVotes } from '../fixtures.mjs';
import { drawRestoreBallots } from '../restore-ballots.mjs';

const report = judgeReport({ attempted: 20, resolved: 14, comparable: 14, matches: 10 });
const withFailure = judgeReport({ ...report, attempted: report.attempted + 1 });
const preferred = aggregateSwaps(...restoreVotes);

function reportSheet(ctx, api) {
  const { focus, C } = api;
  const failed = focus.visible('fresh-parse');
  const current = failed ? withFailure : report;
  focus.target('fresh-denominators', () => {
    api.text(
      ctx,
      'Separate evaluation sample    /    One column per attempted pair',
      135,
      255,
      34,
      C.muted,
    );
    const rows = [
      ['Attempted', current.attempted, C.ink],
      ['Resolved', current.resolved, C.cyan],
      ['Matches human', current.matches, C.green],
    ];
    for (const [i, [name, count, color]] of rows.entries()) {
      const y = 421 + i * 113;
      api.text(ctx, name, 135, y + 9, 34, color);
      for (let j = 0; j < report.attempted; j++) {
        const x = 450 + 59 * j;
        if (j < count) api.rect(ctx, x, y - 28, 39, 42, color, null, 4);
        else api.line(ctx, x + 5, y, x + 34, y, C.muted, 2);
      }
      api.text(ctx, String(count), 1812, y + 11, 40, color, 'right');
    }
  });
  if (failed)
    focus.target('fresh-parse', () => {
      const x = 450 + 59 * report.attempted;
      api.text(ctx, 'Parse failure', x + 18, 339, 30, C.pink, 'center');
      api.rect(ctx, x, 393, 39, 42, C.pink, null, 4);
      for (const y of [534, 647]) api.line(ctx, x + 5, y, x + 34, y, C.muted, 2);
    });

  focus.target('fresh-rates', () => {
    api.line(ctx, 135, 736, 1790, 736, C.muted, 2);
    api.text(ctx, 'Coverage', 500, 827, 38, C.cyan, 'center');
    api.text(ctx, 'Agreement among comparable pairs', 1355, 827, 36, C.green, 'center');
    if (focus.progress('fresh-rates', 0) === 1) {
      const coverage = failed
        ? focus.progress('fresh-new-coverage', 0) === 1
          ? withFailure.resolved +
            '/' +
            withFailure.attempted +
            '\\approx' +
            withFailure.coverage.toFixed(3)
          : withFailure.resolved + '/' + withFailure.attempted
        : report.resolved + '/' + report.attempted + '=' + report.coverage.toFixed(2);
      focus.target('fresh-parse', () =>
        api.math(ctx, coverage, 500, 941, 59, failed ? C.pink : C.cyan, 'center'),
      );
      if (failed) {
        api.text(ctx, 'Before the failure', 272, 1024, 30, C.muted, 'right');
        api.math(
          ctx,
          report.resolved + '/' + report.attempted + '=' + report.coverage.toFixed(2),
          472,
          1023,
          36,
          C.muted,
          'center',
        );
      }
      const agreement =
        report.matches +
        '/' +
        report.comparable +
        (focus.progress('fresh-coverage-repair', 0) === 1
          ? '\\ \\mathrm{unchanged}'
          : '\\approx' + report.agreement.toFixed(3));
      focus.target('fresh-coverage-repair', () =>
        api.math(ctx, agreement, 1355, 941, 57, C.green, 'center'),
      );
    }
  });
}

function restoreJob(ctx, api) {
  const { focus, C } = api;
  const opened = focus.visible('fresh-completion');
  const completed = opened && focus.progress('fresh-completion', 0) === 1;
  const repeat = focus.progress('fresh-state-failure', 0) === 1;
  const verify = focus.progress('fresh-state-repair', 0) === 1;
  focus.target('fresh-choice', () => {
    api.text(ctx, 'Original receipts   /   A, then B', 145, 252, 32, C.muted);
    api.text(
      ctx,
      preferred + '   “' + restoreReplies[preferred] + '”',
      145,
      386,
      70,
      C.ink,
      'left',
      'serif',
    );
  });
  focus.target('fresh-completion', () => {
    api.line(ctx, 145, 457, 1775, 457, C.muted, 2);
    api.text(ctx, 'Backup service   /   Restore 41', 145, 536, 36, C.ink);
    if (completed) {
      api.text(ctx, 'COMPLETED', 145, 642, 62, C.green);
      api.text(ctx, 'Same job. No subsequent change or new request.', 145, 704, 34, C.muted);
    } else {
      api.text(ctx, opened ? 'Opening job record…' : 'Job record closed', 145, 636, 41, C.muted);
    }
  });
  focus.target('fresh-state-failure', () => {
    if (focus.visible('fresh-state-failure')) {
      api.line(ctx, 145, 767, 1775, 767, C.muted, 2);
      if (repeat) api.text(ctx, 'Stable preference; redundant next action', 145, 832, 35, C.pink);
    }
  });
  focus.target('next-action', () =>
    focus.target('fresh-state-repair', () => {
      if (verify) api.text(ctx, 'Verify recovery instead.', 145, 930, 58, C.ink, 'left', 'serif');
      else if (focus.visible('fresh-next'))
        api.text(ctx, 'What should Maya check next?', 145, 932, 55, C.ink, 'left', 'serif');
    }),
  );
  if (focus.visible('verify-file'))
    focus.target('recovery-check', () =>
      api.text(
        ctx,
        'Restored file contents  =  expected version?     Awaiting check',
        145,
        1013,
        34,
        C.cyan,
      ),
    );
}

export function drawFreshDecision(ctx, scene, state, api) {
  const { focus } = api;
  if (state.beat === 0) {
    return drawRestoreBallots(ctx, api, {
      showVotes: true,
      tie: focus.visible('fresh-tie'),
      showIdentity: focus.progress('fresh-identity', 0) === 1,
      showOutcome: focus.progress('fresh-tie-complete', 0) === 1,
    });
  }
  if (state.beat === 1) return reportSheet(ctx, api);
  return restoreJob(ctx, api);
}

export default {
  id: 'fresh-decision',
  draw: drawFreshDecision,
  cues: [
    'fresh-slots',
    'fresh-verdicts',
    'fresh-predict',
    'fresh-identity',
    'fresh-tie',
    'fresh-tie-complete',
    'fresh-denominators',
    'fresh-rates',
    'fresh-parse',
    'fresh-new-coverage',
    'fresh-coverage-repair',
    'fresh-return',
    'fresh-completion',
    'fresh-state-failure',
    'fresh-next',
    'fresh-state-repair',
    'verify-file',
  ],
};
