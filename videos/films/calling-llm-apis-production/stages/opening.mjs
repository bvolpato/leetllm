import { trusted } from '../fixtures.mjs';
import { validationCases } from '../model.mjs';
import { cueClock, drawAge } from '../cued-trace.mjs';

const deadline = 4;

function callerWatch(ctx, api, elapsed) {
  const { C } = api;
  const cx = 443,
    cy = 563,
    radius = 218;
  const color = elapsed >= deadline ? C.yellow : C.cyan;
  api.rect(ctx, cx - 17, cy - radius - 50, 34, 52, C.muted);
  api.rect(ctx, cx - 45, cy - radius - 62, 90, 25, C.ink);
  api.circle(ctx, cx, cy, radius, C.panel, C.muted, 4);
  const arc = Array.from({ length: 81 }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * elapsed * i) / (deadline * 80);
    return { x: cx + (radius - 18) * Math.cos(angle), y: cy + (radius - 18) * Math.sin(angle) };
  });
  api.path(ctx, arc, { color, width: 17 });
  api.text(ctx, elapsed.toFixed(1) + ' s', cx, cy + 21, 97, C.ink, 'center');
  api.text(ctx, 'of ' + deadline + ' s', cx, cy + 86, 38, C.muted, 'center');
  api.text(ctx, 'Caller’s clock', cx, cy + radius + 82, 41, C.ink, 'center');
}

export function drawOpening(ctx, scene, state, api) {
  const { C } = api;
  const clock = cueClock(scene, state);
  if (state.beat < 2) {
    const elapsed = 3 + clock.p('caller-wait');
    api.focus.target('caller-clock', () => {
      callerWatch(ctx, api, elapsed);
    });
    if (state.beat === 0) {
      api.text(ctx, 'Key eligibility check', 850, 420, 49, C.ink);
      api.text(ctx, 'Request sent to model', 850, 523, 39, C.muted);
      api.line(ctx, 850, 570, 1655, 570, C.muted, 2);
      api.text(
        ctx,
        elapsed < deadline ? 'Waiting for reply…' : 'Timed out',
        850,
        690,
        69,
        elapsed < deadline ? C.cyan : C.yellow,
      );
      if (clock.after('caller-wait')) api.text(ctx, 'Did the model finish?', 850, 823, 46, C.ink);
    } else {
      const x = (seconds) => 845 + seconds * 143;
      api.text(ctx, 'Two possible histories at the provider', 845, 302, 44, C.ink);
      for (const t of [0, 3, deadline, 6])
        api.text(ctx, t + ' s', x(t), 405, 30, t === deadline ? C.yellow : C.muted, 'center');
      for (const [target, cue, y, seconds, label] of [
        ['provider-one', 'finished-history', 505, 3, 'Finished · reply lost'],
        ['provider-two', 'running-history', 734, 6, 'Still working'],
      ]) {
        api.focus.target(target, () => {
          api.line(ctx, x(0), y, x(6), y, C.muted, 3);
          api.line(ctx, x(deadline), y - 30, x(deadline), y - 9, C.yellow, 4);
          if (clock.started(cue)) {
            const end = x(seconds * clock.p(cue));
            api.line(ctx, x(0), y, end, y, C.blue, 12);
            api.circle(ctx, end, y, 11, C.blue);
          }
          if (clock.after(cue)) api.text(ctx, label, x(0), y + 75, 41, C.blue);
        });
      }
      if (clock.after('timeout-receipt'))
        api.text(
          ctx,
          'Caller timed out    /    Provider outcome and usage unknown',
          960,
          986,
          36,
          C.ink,
          'center',
        );
    }
    return;
  }
  const candidate = validationCases()[0];
  api.text(ctx, 'Another read  /  same account', 145, 258, 36, C.muted);
  api.focus.target('candidate-record', () => {
    api.text(ctx, 'Model reply', 145, 397, 34, C.muted);
    if (clock.started('opening-candidate'))
      api.text(ctx, candidate.value.decision.replace('_', ' '), 545, 402, 59, C.ink);
    if (clock.after('opening-reject')) api.text(ctx, 'Rejected', 1605, 397, 45, C.pink, 'right');
  });
  api.focus.target('key-ruler', () =>
    drawAge(ctx, api, {
      left: 285,
      width: 1320,
      maxAge: 50,
      y: 723,
      age: trusted.ageDays,
      minimum: trusted.thresholdDays,
      ageShown: clock.started('opening-age'),
      policyShown: clock.started('opening-policy'),
    }),
  );
  if (clock.after('opening-policy'))
    api.text(
      ctx,
      clock.after('opening-reject')
        ? '45 ≥ 30 days     ·     This stale key meets P-7.'
        : 'Would you return the model’s answer?',
      145,
      995,
      40,
      C.ink,
    );
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'caller-wait',
    'finished-history',
    'running-history',
    'timeout-receipt',
    'opening-candidate',
    'opening-age',
    'opening-policy',
    'opening-reject',
  ],
};
