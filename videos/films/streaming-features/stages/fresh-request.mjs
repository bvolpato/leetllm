import { availableHeartbeat, formatClock, sourceFreshness } from '../arithmetic.mjs';
import { afternoonHeartbeats } from '../fixtures.mjs';
import {
  minuteScale,
  publicationLabelGaps,
  publicationTrace,
  receipt,
  requestLine,
  spoken,
} from '../request-clock.mjs';

const firstRead = 840;
const secondRead = 850;
const captured = availableHeartbeat(afternoonHeartbeats, firstRead);
const current = availableHeartbeat(afternoonHeartbeats, secondRead);
const ageMinutes = secondRead - current.event;
const ageLabel = `current heartbeat age ${ageMinutes} min`;

function selectHeartbeat(ctx, api, clock) {
  const { C } = api;
  const [h7, h8] = afternoonHeartbeats;
  const x = minuteScale(825, 853, 440, 1730);
  const cutoff = Math.round(firstRead + (secondRead - firstRead) * clock.progress('new'));
  api.text(
    ctx,
    `${h7.id}   ·   sent ${formatClock(h7.event)}   ·   readable ${formatClock(h7.available)}`,
    108,
    236,
    35,
    C.blue,
  );
  api.focus.target('afternoon-delivery', () => {
    requestLine(ctx, api, x, cutoff, 312, 715, publicationLabelGaps(409, 121));
    api.text(ctx, 'H8', 108, 329, 41, C.cyan);
    publicationTrace(ctx, api, {
      x,
      cutoff,
      record: h8,
      sent: clock.started('worker'),
      startY: 409,
      gap: 121,
      ingestProgress: clock.progress('broker'),
      publishProgress: clock.progress('publish'),
    });
  });
  api.focus.target('first-capture', () =>
    receipt(ctx, api, {
      y: 817,
      label: '14:00 capture',
      value: clock.finished('age')
        ? `${captured.id}     14:00 − ${formatClock(captured.event)} = ${captured.ageHours} h`
        : 'Heartbeat  ?      Age  ?',
      color: clock.finished('age') ? C.blue : C.yellow,
    }),
  );
  if (clock.started('new')) {
    api.focus.target('later-capture', () => {
      const ageReady = clock.finished('new-age');
      receipt(ctx, api, {
        y: 959,
        label: ageReady ? `14:10 request    ${current.id}` : '14:10 request',
        value: ageReady ? ageLabel : 'Heartbeat  ?      Age  ?',
        color: ageReady ? C.green : C.yellow,
      });
      if (clock.started('origin-question')) {
        const originReady = clock.finished('origin');
        api.text(
          ctx,
          `14:10 − ${originReady ? formatClock(current.event) : '?'}`,
          755,
          967,
          42,
          originReady ? C.cyan : C.yellow,
          'center',
        );
      }
    });
  }
}

function chooseMode(ctx, api, clock) {
  const { C } = api;
  const x = minuteScale(815, secondRead, 615, 1240);
  const alternative = clock.started('coverage-change');
  const originalCoverage = 820;
  const coverage = alternative ? 835 : originalCoverage;
  const lastWrite = 849;
  const freshness = sourceFreshness(coverage * 60, secondRead * 60);
  const lagMinutes = freshness.lagSeconds / 60;
  const lagReady = alternative ? clock.finished('normal-lag') : clock.finished('lag');
  const modeReady = alternative ? clock.finished('normal') : clock.finished('fallback');
  const modeLabel =
    freshness.mode === 'degraded' ? 'Validated degraded fallback' : 'Score normally';
  const rows = [
    {
      label: 'H8 worker time',
      start: current.event,
      color: C.cyan,
      visible: true,
      value: ageLabel,
    },
    {
      label: 'Last row write',
      start: lastWrite,
      color: C.muted,
      visible: clock.started('write'),
      value: `${secondRead - lastWrite} min since write`,
    },
    {
      label: 'All inputs covered through',
      start: coverage,
      color: C.blue,
      visible: clock.started('coverage'),
      value: lagReady ? `${lagMinutes} min lag` : '? min lag',
    },
  ];
  api.focus.target('freshness-clocks', () => {
    requestLine(ctx, api, x, secondRead, 280, 682);
    rows.forEach(({ label, start, color, visible, value }, i) => {
      if (!visible) return;
      const y = 356 + i * 147;
      api.text(ctx, label, 108, y + 11, 33, color);
      api.line(ctx, x(815), y, x(secondRead), y, '#343740', 3);
      api.line(ctx, x(start), y, x(secondRead), y, color, 9);
      api.circle(ctx, x(start), y, 11, color);
      api.text(ctx, formatClock(start), x(start) - 14, y - 23, 35, color, 'right');
      api.text(ctx, value, 1803, y + 15, 38, color, 'right');
    });
  });
  api.focus.target('freshness-choice', () => {
    api.line(ctx, 105, 731, 1808, 731, '#575961', 2);
    api.text(ctx, 'Source lag (min)', 108, 804, 32, C.muted);
    api.text(ctx, '≤ 15   normal', 515, 804, 32, C.ink);
    api.text(ctx, '15 < lag ≤ 45   fallback', 969, 804, 32, C.ink);
    api.text(ctx, '> 45   abstain', 1520, 804, 32, C.ink);
    if (alternative) {
      api.text(
        ctx,
        `Coverage to ${formatClock(originalCoverage)}`,
        480,
        875,
        32,
        C.muted,
        'center',
      );
      api.text(
        ctx,
        `${secondRead - originalCoverage} min   ·   Fallback`,
        480,
        939,
        44,
        C.ink,
        'center',
      );
      api.text(ctx, `Coverage to ${formatClock(coverage)}`, 1410, 875, 32, C.blue, 'center');
      const lag = lagReady ? `${lagMinutes} min` : '? min';
      api.text(
        ctx,
        `${lag}   ·   ${modeReady ? modeLabel : 'Which mode?'}`,
        1410,
        939,
        44,
        modeReady ? C.green : C.yellow,
        'center',
      );
      return;
    }
    let decision = 'Which mode should this request record?';
    if (lagReady) decision = `Heartbeat age ${ageMinutes} min and pipeline lag ${lagMinutes} min`;
    if (modeReady) decision = modeLabel;
    api.text(ctx, decision, 960, 904, 48, modeReady ? C.green : C.yellow, 'center');
  });
  receipt(ctx, api, {
    y: 1017,
    label: '14:00 capture',
    value: `${captured.id}    ·    ${captured.ageHours} h`,
    color: C.blue,
  });
}

export function drawFreshRequest(ctx, scene, state, api) {
  const clock = spoken(scene, state);
  if (clock.started('clocks')) chooseMode(ctx, api, clock);
  else selectHeartbeat(ctx, api, clock);
}
export default {
  id: 'fresh-request',
  draw: drawFreshRequest,
  cues: [
    'worker',
    'broker',
    'publish',
    'question',
    'age',
    'new',
    'new-age',
    'origin-question',
    'origin',
    'clocks',
    'write',
    'coverage',
    'lag',
    'fallback',
    'coverage-change',
    'normal-lag',
    'normal',
  ].map((id) => 'sf-fresh-request-' + id),
};
