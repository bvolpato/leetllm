import { sampleModel } from '../construction.mjs';
import { after, progress } from '../timing.mjs';
import { text } from '../defaults.mjs';

export function drawPublication(ctx, scene, state, api) {
  const { C, focus } = api;
  const snap = sampleModel('publication', state);
  if (state.beat < 2) {
    text(ctx, api, 'Response to R900', 160, 300, 46, C.ink);
    focus.target('visible-output', () => {
      api.rect(ctx, 160, 370, 1600, 220, C.panel, C.muted);
      text(
        ctx,
        api,
        snap.visibleText || 'No words visible',
        235,
        509,
        snap.published ? 62 : 42,
        snap.published ? C.ink : C.muted,
      );
    });
    focus.target('retry-permission', () => {
      api.line(ctx, 300, 739, 1530, 739, C.muted, 3);
      const pre = state.beat === 0;
      const blocked = !pre && snap.published;
      const position = pre
        ? progress(state, 'retry-classifier', 0, 0.15, 0.58)
        : progress(state, 'publish-words', 1, 0.03, 0.32);
      const x = 330 + (blocked ? 605 : 1170) * position;
      api.circle(ctx, x, 739, 16, blocked ? C.yellow : C.cyan);
      if (blocked) api.line(ctx, 960, 681, 960, 790, C.pink, 6);
      text(ctx, api, 'Generation', 300, 826, 32, C.muted, 'center');
      text(ctx, api, 'Consider D', 1500, 826, 32, C.muted, 'center');
      const label = pre
        ? snap.mayRetry
          ? 'Pre-output timeout   ·   check D’s contract and budgets'
          : 'Waiting for C'
        : snap.failure
          ? 'Stream interrupted   ·   offer a new attempt or handoff'
          : snap.published
            ? 'Words delivered   ·   automatic restart closed'
            : 'Connection open';
      text(
        ctx,
        api,
        label,
        960,
        962,
        38,
        snap.failure && !snap.mayRetry ? C.pink : C.cyan,
        'center',
      );
    });
    return;
  }
  const checked = after(state, 'invalid-citation', 2, 0.7);
  const allowed = snap.evidenceIds;
  const id = snap.reply.citations[0];
  focus.target('reply-fields', () => {
    text(ctx, api, 'D’s buffered reply', 165, 320, 46, C.cyan);
    text(ctx, api, snap.reply.schema, 165, 410, 32, C.muted);
    text(ctx, api, '“' + snap.reply.answer + '”', 165, 523, 35, C.ink);
    text(ctx, api, 'Review   ·   ' + snap.reply.review, 165, 620, 32, C.ink);
    text(ctx, api, 'Cites   ' + id, 165, 750, 47, C.yellow);
  });
  focus.target('evidence-check', () => {
    text(ctx, api, 'Authorized for R900', 1135, 320, 46, C.ink);
    text(ctx, api, 'Evidence ID', 1135, 410, 32, C.muted);
    text(ctx, api, allowed.join(', '), 1135, 526, 63, C.cyan);
    const p = progress(state, 'check-id', 2, 0.25, 0.53);
    if (p > 0) {
      const x = api.lerp(450, 1035, p);
      api.line(ctx, 445, 735, x, 735, C.yellow, 4);
      api.circle(ctx, x, 735, 9, C.yellow);
    }
    if (checked) text(ctx, api, 'No matching ID', 1135, 750, 40, C.pink);
  });
  text(
    ctx,
    api,
    checked && !snap.accepted
      ? 'Withhold the reply and report the citation failure'
      : 'May the desk publish this reply?',
    960,
    965,
    40,
    checked ? C.pink : C.yellow,
    'center',
  );
}
export default {
  id: 'publication',
  draw: drawPublication,
  cues: ['retry-classifier', 'publish-words', 'latch-output', 'check-id', 'invalid-citation'],
};
