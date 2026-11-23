import { PROPOSAL } from '../fixtures.mjs';
import { cueClock, footer, trafficRow } from '../routing.mjs';

export function drawChooseReview(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  if (state.beat === 0) {
    [
      ['read', 'Read evaluation metrics', 'Only this service', 'Automatic read', 'choose-read'],
      ['policy', 'Promote the reranker', 'Changes live traffic', 'Human review', 'choose-live'],
      [
        'safety-filter',
        'Disable a required safety filter',
        'Removes a release safeguard',
        'Stronger review tier',
        'choose-strong',
      ],
    ].forEach(([id, action, effect, tier, cueId], i) => {
      const y = 360 + i * 227;
      api.focus.target(id, () => {
        api.text(ctx, action, 115, y, 44, C.ink);
        api.text(ctx, effect, 115, y + 61, 32, C.muted);
        if (done(cueId)) api.text(ctx, tier, 970, y, 39, i ? C.yellow : C.cyan);
        api.line(ctx, 115, y + 115, 1800, y + 115, C.muted, 2);
      });
    });
    return;
  }
  const threshold = 25;
  const target = done('choose-broad') ? 50 : PROPOSAL.trafficPercent;
  api.focus.target('target', () => {
    trafficRow(ctx, api, {
      y: 420,
      label: 'Promotion target',
      detail: 'Same service and tool',
      percent: target,
      color: C.yellow,
    });
  });
  api.focus.target('policy', () => {
    const x = 665 + (940 * threshold) / 100;
    api.line(ctx, x, 472, x, 548, C.ink, 3);
    api.text(ctx, '25% threshold', x, 610, 34, C.ink, 'center');
    const resolved = target === threshold || done('choose-escalate');
    api.text(ctx, 'Weekday decision', 115, 790, 41, C.ink);
    api.text(
      ctx,
      resolved ? (target > threshold ? 'Senior review' : 'Ordinary approval') : 'Checking target…',
      665,
      790,
      49,
      C.yellow,
    );
    if (state.beat === 2)
      footer(ctx, api, 'A queue score can change priority. The host sets the required review.');
  });
}
export default {
  id: 'choose-review',
  draw: drawChooseReview,
  cues: [
    'choose-read',
    'choose-live',
    'choose-strong',
    'choose-threshold',
    'choose-broad',
    'choose-escalate',
    'choose-floor',
  ],
};
