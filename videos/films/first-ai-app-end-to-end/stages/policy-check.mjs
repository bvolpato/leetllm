import { text } from '../defaults.mjs';
import { accountFacts } from '../fixtures.mjs';
import { checkPolicy, policyCandidate } from '../model.mjs';
import { cueProgress } from '../receipt.mjs';

const base = policyCandidate(accountFacts.acct_10234);
const nice = (decision) => decision.replaceAll('_', ' ');

export function drawPolicyCheck(ctx, scene, state, api) {
  const { C } = api;
  const at = (id) => cueProgress(scene, state, id);
  const extra = state.beat === 5;
  const missing = !extra && at('p-missing') > 0.5;
  const edge = !extra && at('p-edge') > 0;
  const young = !extra && at('p-young') > 0;
  const current = !extra && at('p-current') > 0.5;
  let account = 'acct_10234';
  if (missing) account = 'acct_99999';
  else if (edge) account = 'acct_10237';
  else if (young) account = 'acct_10235';
  else if (current) account = 'acct_10236';
  const facts = accountFacts[account];
  const negative = young && !edge && at('p-negative') > 0;
  const proposed = missing ? 'needs_review' : negative ? 'not_eligible' : base.decision;
  const addedSource = extra && at('p-add-source') > 0;
  const candidate = {
    ...base,
    decision: proposed,
    source_line_ids: addedSource ? ['P-7', 'extra'] : ['P-7'],
  };
  const result = checkPolicy(candidate, facts);
  let show = at('p-first') > 0;
  if (current) show = at('p-reject') > 0;
  if (edge) show = at('p-edge-pass') > 0;
  if (missing) show = at('p-review') > 0;
  if (extra) show = at('p-bad-source') > 0;

  text(ctx, api, 'Trusted account record', 125, 302, 36, C.blue);
  text(ctx, api, account, 125, 388, 48);
  api.focus.target('age', () => {
    const left = 150,
      pixelsPerDay = 15;
    const end = left + 60 * pixelsPerDay;
    const threshold = left + 30 * pixelsPerDay;
    api.line(ctx, left, 572, end, 572, C.muted, 4);
    api.line(ctx, threshold, 572, end, 572, C.green, 7);
    for (const day of [0, 15, 30, 45, 60]) {
      const x = left + day * pixelsPerDay;
      api.line(ctx, x, 568, x, 592, day === 30 ? C.green : C.muted, 3);
      text(ctx, api, day, x, 635, 27, day === 30 ? C.green : C.muted, 'center');
    }
    text(ctx, api, 'Key age in days', left, 692, 30, C.muted);
    text(ctx, api, 'P-7 minimum  ·  30', threshold, 692, 31, C.green, 'center');
    if (facts) {
      const x = left + facts.credential_age_days * pixelsPerDay;
      api.line(ctx, x, 509, x, 555, C.blue, 5);
      api.circle(ctx, x, 572, 12, C.blue);
      text(ctx, api, facts.credential_age_days + ' days', x, 483, 43, C.blue, 'center');
    } else {
      text(ctx, api, 'No record for this account', 150, 485, 37, C.yellow);
    }
  });
  api.focus.target('flag', () => {
    text(ctx, api, 'Stale flag', 145, 801, 32, C.muted);
    text(
      ctx,
      api,
      facts ? (facts.key_stale ? 'Yes' : 'No') : 'Unknown',
      360,
      801,
      43,
      facts ? C.blue : C.yellow,
    );
  });
  api.line(ctx, 1148, 270, 1148, 823, C.muted, 2);
  text(ctx, api, 'Provider candidate', 1220, 302, 36, C.cyan);
  text(ctx, api, missing && !show ? '?' : nice(proposed), 1220, 402, 48);
  text(ctx, api, 'Policy window', 1220, 508, 28, C.muted);
  text(ctx, api, '30 days  ·  integer', 1220, 569, 33);
  api.focus.target('evidence', () => {
    text(ctx, api, 'Evidence  ·  one slot for P-7', 1220, 678, 30, C.muted);
    api.rect(ctx, 1220, 710, 148, 76, C.panel, C.cyan, 7);
    text(ctx, api, 'P-7', 1294, 760, 35, C.cyan, 'center');
    if (addedSource) {
      api.rect(ctx, 1402, 710, 180, 76, C.panel, C.pink, 7);
      text(ctx, api, 'extra', 1492, 760, 35, C.pink, 'center');
    }
  });
  api.focus.target('decision', () => {
    let message = 'Checking the candidate…',
      color = C.muted;
    if (current && !show) {
      message = 'Can the checker accept eligible for this key?';
      color = C.yellow;
    }
    if (missing && !show) {
      message = 'Which decision can the checker accept with both facts missing?';
      color = C.yellow;
    }
    if (show) {
      const rejected = result === 'invalid_decision';
      message = rejected
        ? 'Candidate rejected   ·   invalid_decision'
        : 'Candidate accepted   ·   ' + nice(result);
      color = rejected ? C.pink : C.green;
    }
    text(ctx, api, message, 960, 954, 41, color, 'center');
  });
}
export default {
  id: 'policy-check',
  draw: drawPolicyCheck,
  cues: [
    'p-first',
    'p-current',
    'p-reject',
    'p-young',
    'p-negative',
    'p-edge',
    'p-edge-pass',
    'p-missing',
    'p-review',
    'p-add-source',
    'p-extra',
    'p-bad-source',
  ],
};
