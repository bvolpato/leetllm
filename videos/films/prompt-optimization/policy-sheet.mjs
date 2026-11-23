import { text } from './defaults.mjs';

export const paymentCase = {
  recordId: 'approval-4412',
  allowed: ['roll back', 'payment-tests'],
  requested: ['deploy', 'payment-service'],
};

export const billingCase = {
  recordId: 'approval-7720',
  allowed: ['deploy', 'billing-canary'],
  requested: ['deploy', 'billing-service'],
};

export function started(state, id) {
  const phase = state.cues?.[id]?.phase;
  return phase === 'during' || phase === 'after';
}

export function complete(state, id) {
  return state.cues?.[id]?.phase === 'after';
}

export function policyRows(ctx, api, policy, { showRequest, compare = false }) {
  const { C } = api;
  const xs = [680, 1190];
  const labels = ['Action', 'Target'];
  for (const [i, label] of labels.entries()) {
    text(ctx, api, label, xs[i], 262, 32, C.muted);
  }
  api.focus.target('approval-record', () => {
    text(ctx, api, 'Approval record', 120, 358, 38, C.blue);
    text(ctx, api, policy.recordId, 120, 419, 36, C.blue);
    policy.allowed.forEach((value, i) => text(ctx, api, value, xs[i], 402, 60, C.ink));
  });
  api.focus.target('requested-action', () => {
    text(ctx, api, 'Request', 120, 568, 38, C.yellow);
    xs.forEach((x, i) => {
      const agrees = policy.allowed[i] === policy.requested[i];
      const color = compare ? (agrees ? C.green : C.pink) : C.ink;
      if (compare) {
        text(ctx, api, agrees ? '=' : '≠', x, 486, 48, color);
      }
      text(ctx, api, showRequest ? policy.requested[i] : '…', x, 568, 60, color);
    });
  });
}

export function pairString(pair) {
  return pair.route + ' · ' + (pair.recordId || 'empty ID');
}
