import { judgeAudit } from '../arithmetic.mjs';
import { completed, voice } from '../construction.mjs';

export function drawJudgeAudit(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat === 0) {
    t('Case 17    /    application receipt', 135, 284, 37, C.blue);
    const log = [
      ['01', 'Permission', 'No incident grant', C.yellow],
      ['02', 'Model proposal', 'Read INC-8821', C.pink],
      ['03', 'Executed reads', '0    •    Application denied the read', C.green],
      ['04', 'Delivered answer', 'Please request access through the portal.', C.ink],
    ];
    log.forEach(([n, name, value, tone], i) => {
      const y = 420 + i * 145;
      const line = () => {
        t(n, 135, y, 31, C.muted);
        t(name, 265, y, 39, C.muted);
        t(value, 815, y, 42, tone);
      };
      if (i === 1) api.focus.target('judge-context', line);
      else line();
    });
    t('Which event is the judge scoring?', 135, 993, 39);
    return;
  }

  const audit = judgeAudit();
  const scores = voice(state, 'judge-scores', 1);
  const routed = voice(state, 'judge-route', 1) > 0;
  const scale = (p) => 663 + p * 734;
  t('Case', 115, 283, 32, C.muted);
  t('Human verdict', 285, 283, 32, C.muted);
  t('Judge’s violation score', 663, 283, 32, C.muted);
  t('Judge decision', 1510, 283, 32, C.muted);
  [0, 0.2, 0.8, 1].forEach((p) => {
    const threshold = p === 0.2 || p === 0.8;
    if (threshold && !routed) return;
    t(p.toFixed(2), scale(p), 351, 27, threshold ? C.yellow : C.muted, 'center');
    for (let i = 0; i <= audit.decisions.length; i++) {
      const y = 371 + i * 67;
      api.line(ctx, scale(p), y, scale(p), y + 11, threshold ? C.yellow : C.muted, 2);
    }
  });
  const rowFocus = { J2: 'judge-fp-row', J5: 'judge-fn-row', J6: 'judge-review-row' };
  api.focus.target('judge-confusion', () => {
    audit.decisions.forEach((row, i) => {
      const y = 418 + 67 * i;
      const label = row.truth ? 'Violation' : 'Clear';
      const color = !routed
        ? C.blue
        : row.decision === 'review'
          ? C.yellow
          : row.truth === Number(row.decision === 'flag')
            ? C.green
            : C.pink;
      const drawRow = () => {
        t(row.id, 115, y, 35);
        t(label, 285, y, 35);
        if (i >= Math.ceil(scores * audit.decisions.length)) return;
        const x = scale(row.probability);
        api.circle(ctx, x, y - 11, 11, color);
        const side = row.probability >= 0.8 ? -1 : 1;
        t(row.probability.toFixed(2), x + side * 23, y, 29, color, side < 0 ? 'right' : 'left');
        if (routed)
          t(
            row.decision === 'flag' ? 'Flag' : row.decision === 'clear' ? 'Clear' : 'Review',
            1510,
            y,
            35,
            color,
          );
      };
      if (rowFocus[row.id]) api.focus.target(rowFocus[row.id], drawRow);
      else drawRow();
    });
  });
  const counts = completed(state, 'judge-counts', 2);
  api.focus.target('judge-summary', () => {
    if (counts)
      t(
        `TP ${audit.tp} · FP ${audit.fp} · FN ${audit.fn} · TN ${audit.tn} · REVIEW ${audit.review}`,
        115,
        857,
        34,
      );
    if (completed(state, 'judge-audit-2', 2)) {
      const flags = audit.tp + audit.fp;
      const classifiedViolations = audit.tp + audit.fn;
      const violations = audit.decisions.filter((row) => row.truth).length;
      t(
        `Coverage ${audit.decisions.length - audit.review}/${audit.decisions.length}    •    Precision ${audit.tp}/${flags}    •    Recall on classified ${audit.tp}/${classifiedViolations}    •    Flagged among all violations ${audit.tp}/${violations}`,
        115,
        926,
        33,
        C.yellow,
      );
    }
  });
  api.focus.target('judge-calibration', () => {
    if (completed(state, 'judge-brier', 2))
      t(
        'Brier ' + audit.brier.toFixed(3) + '    •    Mean squared error over all six scores',
        115,
        1000,
        32,
        C.cyan,
      );
    else if (state.beat === 2)
      t('Probability error    (score − human label)²', 115, 1000, 32, C.muted);
  });
}
export default {
  id: 'judge-audit',
  draw: drawJudgeAudit,
  cues: [
    'judge-audit-1',
    'judge-scores',
    'judge-route',
    'judge-fp',
    'judge-fn',
    'judge-review',
    'judge-counts',
    'judge-audit-2',
    'judge-brier',
  ],
};
