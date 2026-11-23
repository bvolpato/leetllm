import { advise } from '../arithmetic.mjs';
import { observation } from '../fixtures.mjs';
import { beatCue } from '../construction.mjs';
import { drawReceipt } from '../receipt.mjs';
import { deadlineLedger } from '../tokens.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  const shift = beatCue(state, 'last-shift', 1, 0.18);
  const answer = beatCue(state, 'last-withhold', 2, 0.02).done;
  const count = beatCue(state, 'last-account', 2, 0.58).done;
  const now = 130;
  const record = { ...observation, observedAt: observation.observedAt - (shift.done ? 1 : 0) };
  const verdict = advise(record, now);
  const outstanding = deadlineLedger().admitted.reservations;
  const held = outstanding.reduce((sum, call) => sum + call.value, 0);
  drawReceipt(ctx, api, { record, now, showAge: false });
  api.focus.target('window', () => {
    const x = (t) => 180 + ((t - 93) / 39) * 1520;
    const cut = now - 30;
    const stamp = observation.observedAt - shift.p;
    api.text(ctx, 'Tool observation time', 145, 643, 34, C.muted);
    api.text(
      ctx,
      'Accepted window   /   30 seconds',
      (x(cut) + x(now)) / 2,
      680,
      36,
      C.ink,
      'center',
    );
    api.line(ctx, x(93), 713, x(132), 713, C.muted, 6);
    api.line(ctx, x(cut), 713, x(now), 713, C.blue, 14);
    for (const [t, label] of [
      [cut, '100 s'],
      [now, '130 s · deadline'],
    ]) {
      api.line(ctx, x(t), 697, x(t), 729, C.ink, 4);
      api.text(ctx, label, x(t), 770, 34, C.ink, 'center');
    }
    api.circle(ctx, x(stamp), 713, 13, C.yellow, C.bg, 3);
    api.text(ctx, 'Observed at ' + record.observedAt + ' s', x(stamp), 680, 34, C.yellow, 'center');
  });
  api.focus.target('verdict', () => {
    api.text(ctx, 'Completed response C', 145, 870, 31, C.muted);
    const text = !shift.started
      ? 'Eligible   /   ' + verdict
      : answer
        ? 'Withhold C   /   refresh metrics'
        : 'Can C still be sent?';
    api.text(ctx, text, 145, 942, 48, answer ? C.pink : C.ink);
  });
  api.focus.target('open-calls', () => {
    api.text(
      ctx,
      shift.started && !count
        ? 'How many tokens stay held?'
        : 'Outstanding generated-token reservations',
      999,
      870,
      31,
      C.muted,
    );
    const amounts = outstanding.map((call) => call.id + '  ' + call.value.toLocaleString('en-US'));
    api.text(
      ctx,
      count ? 'B + D   /   ' + held.toLocaleString('en-US') + ' held' : amounts.join('      '),
      999,
      942,
      45,
      C.blue,
    );
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['last-clock', 'last-edge', 'last-shift', 'last-predict', 'last-withhold', 'last-account'],
};
