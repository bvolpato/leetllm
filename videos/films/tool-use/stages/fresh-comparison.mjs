import { filmClock } from '../clock.mjs';
import { releasePromotionTarget, sameSuiteToolComparison } from '../model.mjs';

const a = Object.freeze({ release: 'A', call_id: 'c31', suite: 'Q1', score: 0.86 });
const bOtherSuite = Object.freeze({ release: 'B', call_id: 'c32', suite: 'Q2', score: 0.89 });
const bFresh = Object.freeze({ release: 'B', call_id: 'c33', suite: 'Q1', score: 0.83, gate: 'passed' });
const session = { principal: 'reader', project: 'search', can_promote: false };

export function drawFreshComparison(ctx, scene, state, api) {
  const { C, focus } = api;
  const { started, after, progress } = filmClock(scene, state);
  const beat = state.beat ?? 0;
  const read = beat > 1 || started('tu-fresh-read-repair');
  const returned = beat > 1 || after('tu-fresh-new-score');
  const compare = sameSuiteToolComparison([a, returned ? bFresh : bOtherSuite]);
  const revealDelta = compare.ok && (beat > 1 || after('tu-fresh-delta'));
  const difference = revealDelta ? compare.delta.toFixed(2) : '?';
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, value, x, y, size, color, 'left', font);

  function cell(row, x, y, arrived, pending = false) {
    api.rect(ctx, x, y, 446, 166, C.panel, arrived ? C.cyan : C.muted, 8);
    if (arrived) {
      label(row === bFresh ? 'Fresh authorized read · ' + row.call_id :
        'Release ' + row.release + ' · ' + row.call_id, x + 23, y + 45, 30, C.cyan);
      label(row.suite + ' · score ' + row.score.toFixed(2), x + 23, y + 117, 45);
      if (row.gate) label('Gate ' + row.gate, x + 23, y + 151, 26, C.muted);
    } else if (pending) {
      label('Fresh authorized read · ' + row.call_id, x + 23, y + 50, 30, C.blue);
      label('score / gate pending', x + 23, y + 114, 36);
      const length = 394 * progress('tu-fresh-read-repair');
      if (length > 0) api.line(ctx, x + 23, y + 143, x + 23 + length, y + 143, C.blue, 4);
    } else {
      label('—', x + 180, y + 107, 50, C.muted);
    }
  }

  focus.target('fresh-grid', () => {
    label('Release A', 295, 307, 43, C.ink, 'serif');
    label('Release B', 765, 307, 43, C.ink, 'serif');
    label('Q1', 135, 448, 54);
    label('Q2', 135, 726, 54);
    focus.target('fresh-a-cell', () => cell(a, 260, 345, beat > 0 || after('fresh-a')));
    focus.target('fresh-b-cell', () => cell(bFresh, 730, 345, returned, read));
    api.rect(ctx, 260, 623, 446, 166, C.panel, C.muted, 8);
    label('—', 440, 730, 50, C.muted);
    focus.target('fresh-b-other', () => cell(bOtherSuite, 730, 623, beat > 0 || after('fresh-b')));
    if (returned && (started('fresh-subtract') || revealDelta)) {
      const left = 478, right = 951;
      api.line(ctx, left, 527, left, 555, C.cyan, 3);
      api.line(ctx, left, 555, right, 555, C.cyan, 3);
      api.line(ctx, right, 555, right, 527, C.cyan, 3);
      if (started('fresh-report')) {
        api.circle(ctx, left + (right - left) * progress('fresh-report'), 555, 9, C.cyan);
      }
    }
  });

  focus.target('fresh-calculation', () => {
    if (returned) {
      let heading = 'Q1 scores   /   A minus B';
      if (revealDelta) {
        heading = beat === 1 ? 'Q1 scores   /   ' + a.call_id + ' − ' + bFresh.call_id + ' = +' + difference :
          'A scored higher on Q1';
      }
      label(heading, 137, 868, 34, C.muted);
      const expression = a.score.toFixed(2) + ' − ' + bFresh.score.toFixed(2) + ' = ' +
        (revealDelta ? '+' + difference : '?');
      label(expression, 137, 955, 58, C.cyan, 'mono');
    } else if (after('tu-fresh-suite-denial') && !compare.ok) {
      label('B’s Q1 score is missing.', 137, 928, 45, C.yellow);
    }
  });

  focus.target('fresh-policy', () => {
    const x = 1270;
    label('Trusted session', x, 312, 42, C.ink, 'serif');
    label('Evaluation reads only', x, 385, 37, C.yellow);
    api.line(ctx, x, 421, 1790, 421, C.muted, 2);
    if (beat < 2) {
      label(read ? 'Read B on Q1' : 'One read available', x, 530, 37, C.blue);
      if (started('fresh-ask') && !read) label('Which release and suite?', x, 620, 35);
      if (returned) label('Filed under ' + bFresh.call_id, x, 620, 35, C.cyan);
      return;
    }
    const corrected = beat > 2 || after('fresh-remove-extra');
    const checked = corrected ? after('fresh-deny-role') : after('tu-fresh-deny-extra');
    const args = corrected ? { release_id: a.release } : { release_id: a.release, approved: true };
    const target = releasePromotionTarget();
    const decision = target.apply(session, args);
    if (!started('fresh-proposal') && !checked && !corrected) {
      label('Request to promote A', x, 530, 37, C.blue);
      return;
    }
    label('Promote proposal', x, 508, 35, C.blue);
    label('release_id: ' + a.release, x, 590, 35, C.ink, 'mono');
    if (!corrected) label('approved: true', x, 655, 35, C.yellow, 'mono');
    if (corrected && decision.checks.includes('shape')) label('Shape accepted', x, 655, 35, C.cyan);
    if (checked && !decision.ok) {
      label(corrected ? 'Promotion role required' : 'Extra field rejected', x, 748, 35, C.yellow);
      label('Promotion effects: ' + target.snapshot().effects, x, 820, 37);
      if (!corrected) {
        label('That field grants neither a promotion role nor approval.', 125, 1033, 28, C.muted);
      }
    } else if (corrected) {
      label('Send the write?', x, 763, 44, C.yellow);
    }
  });
}

export default {
  id: 'fresh-comparison',
  draw: drawFreshComparison,
  cues: ['fresh-a', 'fresh-b', 'fresh-ask', 'tu-fresh-suite-denial', 'tu-fresh-read-repair',
    'tu-fresh-new-score', 'fresh-subtract', 'tu-fresh-delta', 'fresh-proposal', 'tu-fresh-deny-extra',
    'fresh-remove-extra', 'fresh-write-question', 'fresh-deny-role', 'fresh-report'],
};
