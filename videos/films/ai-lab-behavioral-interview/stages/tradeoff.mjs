import { releaseNote } from '../release-note.mjs';

export function drawTradeoff(ctx, scene, state, api) {
  const seen = (id) => api.focus.visible(id);
  const rerun = seen('omar-build') ? [seen('snippet-denied'), seen('citation-denied')] : null;
  releaseNote(ctx, api, {
    requested: true,
    results: [true, true],
    rerun,
    otherChecks: seen('other-gates-clear'),
    advice: seen('nia-reopens') ? 'Review for 5%' : 'Hold at 0%',
    approval: seen('priya-signs'),
    question:
      seen('reopen-question') && !seen('other-gates-clear')
        ? 'Both cases pass. What still stands between this build and users?'
        : null,
  });
}

export default {
  id: 'tradeoff',
  draw: drawTradeoff,
  cues: [
    'product-reason',
    'omar-build',
    'snippet-denied',
    'citation-denied',
    'reopen-question',
    'other-gates-clear',
    'nia-reopens',
    'priya-signs',
  ],
};
