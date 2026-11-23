import { sampleModel } from '../observations.mjs';

export function drawRecovery(ctx, scene, state, api) {
  const { C } = api;
  const s = sampleModel('recovery', state);
  const released = s.releaseProgress === 1;
  const fenced = state.cues['recovery-retry-fence'].phase === 'after';
  api.focus.target('recovery-old-owner', () => {
    api.text(ctx, 'A-1   /   original reservation', 140, 275, 43, C.ink);
    api.text(
      ctx,
      'attempt-1   ' + (s.quiescent ? 'RETIRED' : 'RETIREMENT UNKNOWN'),
      140,
      366,
      41,
      s.quiescent ? C.green : C.yellow,
    );
  });
  api.focus.target('recovery-retry-owner', () => {
    api.text(
      ctx,
      'attempt-2   ' + (s.quiescent ? 'not dispatched' : fenced ? 'BLOCKED' : 'proposed'),
      1755,
      366,
      40,
      s.quiescent ? C.muted : C.yellow,
      'right',
    );
  });
  if (state.beat < 2) {
    api.focus.target('recovery-boundary', () => {
      api.rect(ctx, 140, 422, 744, 223, C.panel, s.usageKnown ? C.cyan : C.muted, 14);
      api.text(ctx, 'Worker usage receipt', 181, 494, 32, C.muted);
      api.text(
        ctx,
        s.usageKnown ? 'Trusted usage 300 + 120' : 'Awaiting receipt',
        181,
        590,
        47,
        C.ink,
      );
      api.rect(ctx, 936, 422, 819, 223, C.panel, s.quiescent ? C.green : C.yellow, 14);
      api.text(ctx, 'Execution owner', 979, 494, 32, C.muted);
      const device = s.quiescent
        ? 'Last read finished'
        : s.usageKnown
          ? 'Last read outstanding'
          : 'Status unknown';
      api.text(ctx, device, 979, 590, 47, s.quiescent ? C.green : C.yellow);
    });
    const held = released ? s.held : 700;
    const settled = released ? s.settled : 0;
    const available = 1000 - held - settled;
    api.focus.target('recovery-reservation', () => {
      const x = 142,
        y = 770,
        width = 1610;
      let cursor = x;
      for (const [value, color] of [
        [available, C.muted],
        [held, C.yellow],
        [settled, C.blue],
      ]) {
        const segment = (width * value) / 1000;
        if (segment) api.rect(ctx, cursor, y, segment, 54, color, undefined, 0);
        cursor += segment;
      }
      api.text(
        ctx,
        'Available ' + available + ' + held ' + held + ' + settled ' + settled + ' = 1,000',
        x,
        903,
        40,
        C.ink,
      );
      let decision = 'Can we refund the hold and start attempt 2?';
      if (fenced) decision = 'Keep the hold. Reconcile the original attempt.';
      if (s.quiescent) decision = 'Both records are in. Apply the settlement once.';
      if (released) decision = 'Original attempt settled once · unused 280 released';
      if (s.usageKnown) api.text(ctx, decision, x, 985, 34, released ? C.green : C.ink);
    });
  } else {
    const error = state.cues['recovery-partial-error'].phase === 'after';
    const visible = state.cues['recovery-stream-prefix'].phase !== 'before';
    api.focus.target('recovery-stream', () => {
      api.text(ctx, 'Stream already delivered to Alice', 140, 490, 38, C.ink);
      const parts = [
        ['01', 'The'],
        ['02', 'review'],
      ];
      parts.forEach(([seq, word], i) => {
        const x = 140 + i * 397;
        api.rect(ctx, x, 559, 337, 174, C.panel, visible ? C.blue : C.muted, 12);
        api.text(ctx, seq, x + 25, 609, 27, C.muted);
        if (visible) api.text(ctx, word, x + 168, 691, 49, C.ink, 'center');
      });
      api.rect(ctx, 952, 559, 802, 174, C.panel, error ? C.yellow : C.muted, 12);
      api.text(ctx, error ? 'Terminal event' : 'Next event', 983, 609, 27, C.muted);
      api.text(
        ctx,
        error ? 'Partial-result error' : '?',
        1353,
        689,
        45,
        error ? C.yellow : C.ink,
        'center',
      );
      api.text(ctx, 'Resume checkpoint for this prefix: unavailable', 140, 852, 39, C.ink);
    });
    api.text(ctx, 'A-1   ·   settled 420 units   ·   available 580', 140, 979, 34, C.muted);
  }
}
export default {
  id: 'recovery',
  draw: drawRecovery,
  cues: [
    'recovery-old-attempt',
    'recovery-retry-fence',
    'recovery-beat-1-focus-1',
    'recovery-usage',
    'recovery-quiescence',
    'recovery-release-unused',
    'recovery-stream-prefix',
    'recovery-partial-error',
  ],
};
