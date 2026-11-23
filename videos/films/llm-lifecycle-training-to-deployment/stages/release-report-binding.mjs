import { releaseExample, releaseGate, reportMatchesRelease } from '../arithmetic.mjs';
import { drawGradeSheet, grades } from '../grade-sheet.mjs';
import { sceneCues } from '../picture.mjs';

export function drawReleaseReportBinding(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const { report, bundle } = releaseExample;
  api.focus.target('release-report-binding-mechanism', () => {
    if (state.beat === 0) {
      api.text(
        ctx,
        'All five keys are stale   ·   P-7 v1   ·   Minimum 30 days   ·   No rotation ran',
        125,
        251,
        36,
        C.ink,
      );
      const comparisons = Math.floor(grades.length * cue.progress('report-compare'));
      drawGradeSheet(ctx, api, { visible: grades.length, compare: true, comparisons });
      api.text(
        ctx,
        grades.filter((row) => row.pass).length + ' / 5 answers passed',
        125,
        946,
        48,
        C.ink,
      );
      if (cue.after('report-agreed')) {
        const agree = grades.filter((row) => row.pass === row.expected).length;
        api.text(
          ctx,
          agree + ' / ' + grades.length + ' grades match',
          1800,
          946,
          48,
          C.cyan,
          'right',
        );
      }
      return;
    }
    api.text(ctx, 'Separate example report', 125, 250, 37, C.cyan);
    if (state.beat === 1) {
      const duplicate = cue.after('report-double');
      const displayed = duplicate
        ? { ...report, policyCasesPassed: report.policyCasesPassed + 1 }
        : report;
      const rows = [
        [
          'Policy cases passed',
          displayed.policyCasesPassed + ' / ' + displayed.policyCasesTotal,
          duplicate ? 'One pass counted twice' : 'Every case must pass',
        ],
        ['Unauthorized action claims', String(report.actionClaims), 'Must be zero'],
        [
          'Full decision latency, p95',
          report.p95DecisionMs + ' ms',
          'At most ' + report.budgetMs + ' ms',
        ],
      ];
      rows.forEach(([label, value, rule], i) => {
        const y = 409 + i * 142;
        api.text(ctx, label, 125, y, 40, C.ink);
        api.text(ctx, value, 975, y, 48, duplicate && i === 0 ? C.pink : C.ink, 'center');
        api.text(ctx, rule, 1770, y, 34, C.muted, 'right');
        api.line(ctx, 125, y + 35, 1780, y + 35, C.panel, 3);
      });
      if (duplicate ? cue.after('report-block') : cue.after('report-gate'))
        api.text(
          ctx,
          'Metric gate   ·   ' + releaseGate(displayed).verdict,
          960,
          918,
          51,
          duplicate ? C.pink : C.green,
          'center',
        );
      return;
    }
    api.text(ctx, '20 / 20 passed     0 claims     p95 780 ms', 1790, 250, 34, C.ink, 'right');
    const changed = cue.after('bundle-change');
    const intended = { ...bundle, template: changed ? '5' : bundle.template };
    const fields = Object.keys(bundle);
    const x = (i) => 467 + i * 240;
    fields.forEach((field, i) => {
      api.text(
        ctx,
        field === 'policy' ? 'App policy' : field[0].toUpperCase() + field.slice(1),
        x(i),
        408,
        32,
        C.muted,
        'center',
      );
      const diff = intended[field] !== bundle[field];
      api.text(ctx, bundle[field], x(i), 555, 49, C.ink, 'center');
      api.line(ctx, x(i), 583, x(i), 652, diff ? C.yellow : C.muted, 3);
      api.text(ctx, intended[field], x(i), 727, 49, diff ? C.yellow : C.ink, 'center');
    });
    api.text(ctx, 'Report', 125, 555, 38, C.cyan);
    api.text(ctx, 'Proposed', 125, 727, 38, C.blue);
    let conclusion = '';
    const matches = reportMatchesRelease(bundle, intended);
    if (matches && cue.after('bundle-match') && !cue.started('bundle-change'))
      conclusion = 'All six revisions match   ·   Report applies';
    if (!matches && cue.started('bundle-predict') && state.beat === 2)
      conclusion = 'Can this report approve the proposed bundle?';
    if (!matches && cue.after('bundle-repeat')) conclusion = 'Template 5 needs its own evaluation';
    if (conclusion) api.text(ctx, conclusion, 960, 936, 46, matches ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'release-report-binding',
  draw: drawReleaseReportBinding,
  cues: [
    'report-compare',
    'report-agreed',
    'report-numbers',
    'report-gate',
    'report-double',
    'report-block',
    'bundle-match',
    'bundle-change',
    'bundle-predict',
    'bundle-repeat',
  ],
};
