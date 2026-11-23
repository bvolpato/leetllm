import { billingCase, complete, pairString, policyRows, started } from '../policy-sheet.mjs';
import { text } from '../defaults.mjs';
import { safetyDecision } from '../model.mjs';

const sample = { forbidden: 2, relevant: 80, capPercent: 1 };
const decision = safetyDecision(sample);

function billingMark(ctx, api, reviewing = false) {
  api.rect(ctx, 120, 870, 59, 44, api.C.pink, undefined, 5);
  api.line(ctx, 148, 918, 148, 944, api.C.pink, 3);
  if (reviewing) {
    api.line(ctx, 148, 944, 223, 944, api.C.pink, 3);
    api.line(ctx, 223, 944, 223, 918, api.C.pink, 3);
  }
  const label = reviewing
    ? 'Inspect both replies against their approvals'
    : 'billing-service · forbidden serve';
  text(ctx, api, label, 120, 993, 35, api.C.pink);
}

export function drawReleaseDecision(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const answered = complete(state, 'new-gold');
    policyRows(ctx, api, billingCase, {
      showRequest: started(state, 'new-target'),
      compare: answered,
    });
    api.focus.target('reviewed-pair', () => {
      text(ctx, api, 'Reviewed answer', 120, 724, 34, C.muted);
      text(
        ctx,
        api,
        answered ? pairString({ route: 'ABSTAIN', recordId: '' }) : 'route?   record ID?',
        120,
        825,
        54,
        answered ? C.green : C.yellow,
      );
    });
    api.focus.target('candidate-pair', () => {
      if (state.beat === 1) {
        text(ctx, api, 'Frozen candidate', 990, 724, 34, C.muted);
        text(
          ctx,
          api,
          complete(state, 'actual-serve')
            ? pairString({ route: 'SERVE', recordId: billingCase.recordId })
            : '…',
          990,
          825,
          52,
          C.pink,
        );
        if (complete(state, 'first-error')) billingMark(ctx, api);
      }
    });
    return;
  }

  const known = complete(state, 'two-failures');
  const rateVisible = complete(state, 'observed-rate');
  api.focus.target('slice', () => {
    text(ctx, api, 'Requests that required ABSTAIN', 120, 280, 45, C.ink);
    const progress = state.cues?.['relevant-sample']?.progress ?? 0;
    const visible = 1 + Math.floor((sample.relevant - 1) * progress);
    for (let i = known ? sample.forbidden : 1; i < visible; i++) {
      const x = 120 + (i % 10) * 75;
      const y = 870 - Math.floor(i / 10) * 65;
      api.rect(ctx, x, y, 59, 44, C.panel, C.muted, 5);
    }
    if (complete(state, 'relevant-sample')) {
      const label = known
        ? sample.forbidden + ' forbidden serves in ' + sample.relevant + ' cases'
        : sample.relevant + ' relevant cases';
      text(ctx, api, label, 120, 353, 36, known ? C.pink : C.muted);
    }
  });
  api.focus.target('errors', () => {
    billingMark(ctx, api, started(state, 'review-errors'));
    if (known) api.rect(ctx, 195, 870, 59, 44, C.pink, undefined, 5);
  });
  api.focus.target('limit', () => {
    text(ctx, api, 'Release rule', 1030, 282, 35, C.muted);
    if (started(state, 'release-cap'))
      text(
        ctx,
        api,
        'At most ' + sample.capPercent + '% forbidden serves',
        1030,
        376,
        47,
        C.yellow,
      );
    const verdict = complete(state, 'release-result');
    if (started(state, 'ship-or-hold')) {
      text(
        ctx,
        api,
        verdict ? decision.verdict : 'Ship or hold?',
        1030,
        840,
        78,
        verdict ? C.pink : C.yellow,
      );
    }
  });
  api.focus.target('rate', () => {
    text(ctx, api, 'Observed in this sample', 1030, 535, 35, C.muted);
    const rate = rateVisible ? decision.percent + '%' : '?';
    const denominator = complete(state, 'relevant-sample') ? sample.relevant : '?';
    const fraction = (known ? sample.forbidden : '?') + ' / ' + denominator;
    text(ctx, api, fraction + '  =  ' + rate, 1030, 641, 66, rateVisible ? C.pink : C.ink);
    if (started(state, 'development-mean'))
      text(ctx, api, 'Development mean improved', 1030, 730, 34, C.muted);
  });
}
export default {
  id: 'release-decision',
  draw: drawReleaseDecision,
  cues: [
    'new-policy',
    'new-target',
    'ask-pair',
    'new-gold',
    'actual-serve',
    'first-error',
    'relevant-sample',
    'two-failures',
    'development-mean',
    'release-cap',
    'ship-or-hold',
    'observed-rate',
    'release-result',
    'review-errors',
  ],
};
