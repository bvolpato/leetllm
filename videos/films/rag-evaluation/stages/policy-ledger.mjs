import { BYPASS_TEXT } from '../fixtures.mjs';
import { completed, spoken } from '../construction.mjs';
import { policyEvaluation, policyFixture, policyVariants } from '../model.mjs';

export function drawPolicyLedger(ctx, scene, state, api) {
  const { C, text, line } = api;
  const beat = state.beat ?? 0;
  const f = policyFixture();
  const duplicate = spoken(state, 'duplicate-point', 2) > 0;
  const replace = completed(state, 'policy-complete', 4);
  const thirdRow = replace ? f.complete[2] : { ...f.complete[1], id: f.complete[2].id };
  const answer =
    beat === 0
      ? policyVariants()[1].answer
      : duplicate
        ? [...f.complete.slice(0, 2), thirdRow]
        : f.complete.slice(0, 2);
  const result = policyEvaluation(f.trace, answer, f);
  const mapped = answer.map((c) => f.labels.find((label) => label.text === c.text));
  const words = {
    [f.complete[0].text]: ['The request is governed by the', 'release-freeze deploy rule.'],
    [f.complete[1].text]: ['Incident commander approval', 'is required before rollout.'],
    [f.complete[2].text]: ['A linked rollback plan is', 'required before rollout.'],
    [BYPASS_TEXT]: ['The deploy can start without', 'a linked rollback plan.'],
  };
  const pointRows = [
    ['Payment-service production', 'deploy in a freeze'],
    ['Incident commander approval', 'before rollout'],
    ['Linked rollback plan', 'before rollout'],
  ];
  const y = [424, 573, 722];
  const known =
    beat === 0
      ? completed(state, 'policy-unsafe-score', 0)
      : !duplicate || completed(state, 'same-point', 3) || replace;
  text(ctx, 'Maya’s policy explanation', 145, 284, 35, C.blue);
  text(ctx, 'DEPLOY-17   /   Required points', 1155, 284, 35, C.cyan);
  line(ctx, 145, 318, 890, 318, C.muted, 2);
  line(ctx, 1155, 318, 1780, 318, C.muted, 2);
  api.focus.target('claims', () => {
    answer.forEach((claim, i) => {
      const [first, second] = words[claim.text];
      text(ctx, '[' + (i + 1) + ']', 145, y[i], 32, C.muted);
      text(ctx, first, 227, y[i] - 26, 37, C.ink);
      text(ctx, second, 227, y[i] + 19, 37, C.ink);
      text(ctx, '[DEPLOY-17]', 227, y[i] + 57, 25, C.blue);
      if (i === 2) text(ctx, 'claim ID: ' + claim.id, 440, y[i] + 57, 25, C.yellow);
    });
  });
  api.focus.target('point-map', () => {
    pointRows.forEach((parts, i) => {
      const matches = mapped.filter((label) => label?.point === f.required[i]).length;
      const assessed = known || (beat > 0 && i < 2);
      const active = assessed && matches > 0;
      text(ctx, parts[0], 1155, y[i] - 24, 37, active ? C.green : C.ink);
      text(ctx, parts[1], 1155, y[i] + 21, 37, active ? C.green : C.ink);
      if (assessed)
        text(
          ctx,
          active ? 'Covered once' : 'Open',
          1155,
          y[i] + 59,
          25,
          active ? C.green : C.muted,
        );
    });
    mapped.forEach((label, i) => {
      if (!known && (beat === 0 || i === 2)) return;
      if (!label) {
        text(ctx, 'Conflicts', 999, y[i], 26, C.pink, 'center');
        return;
      }
      const point = f.required.indexOf(label.point);
      const start = { x: 852, y: y[i] - 6 };
      const end = { x: 1118, y: y[point] - 6 };
      const travel = replace && i === 2 ? spoken(state, 'rollback-link', 4) : 1;
      api.trace(
        ctx,
        [start, { x: 916, y: start.y }, { x: 1054, y: end.y }, end],
        travel,
        C.green,
        4,
      );
    });
  });

  const totals = [
    ['Faithfulness', mapped.filter(Boolean).length, answer.length, 'policy-unsafe-score'],
    [
      'Cited support',
      Math.round(result.citationSupport * answer.length),
      answer.length,
      'rageval-unsafe-citation',
    ],
    ['Required points', result.points.length, f.required.length, 'rageval-unsafe-completeness'],
  ];
  line(ctx, 145, 829, 1780, 829, C.muted, 2);
  api.focus.target('counts', () => {
    totals.forEach(([label, n, d, cue], i) => {
      let show = true;
      if (beat === 0) show = completed(state, cue, 0);
      else if (replace) show = completed(state, 'complete-counts', 4);
      else if (duplicate) show = completed(state, 'distinct-counts', 3);
      text(ctx, label + ' ' + (show ? n + '/' + d : '?'), 145 + 580 * i, 907, 41, C.ink);
    });
  });
  const note =
    beat === 0
      ? 'Diagnostic counts for this answer. Both claims cite DEPLOY-17.'
      : replace
        ? 'Trace the third claim to the requirement it covers.'
        : duplicate && !known
          ? 'Which requirement does claim 3 cover?'
          : duplicate
            ? 'Claims 2 and 3 both land on approval.'
            : 'The answer ends after approval.';
  text(ctx, note, 145, 993, 31, C.muted);
}

export default {
  id: 'policy-ledger',
  draw: drawPolicyLedger,
  cues: [
    'policy-ledger-1',
    'policy-unsafe-score',
    'rageval-unsafe-citation',
    'rageval-unsafe-completeness',
    'policy-ledger-2',
    'duplicate-point',
    'same-point',
    'distinct-counts',
    'policy-complete',
    'rollback-link',
    'complete-counts',
  ],
};
