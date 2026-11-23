import { availableHeartbeat, formatClock } from '../arithmetic.mjs';
import { cutoff09, heartbeats } from '../fixtures.mjs';
import {
  minuteScale,
  publicationLabelGaps,
  publicationTrace,
  receipt,
  requestLine,
  spoken,
} from '../request-clock.mjs';

export function drawAvailabilityClock(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const alternative = clock.started('earlier');
  const second = { ...heartbeats[1], ingested: 538, available: alternative ? 539 : 542 };
  const live = availableHeartbeat([heartbeats[0], second], cutoff09);
  const x = minuteScale(505, 550, 420, 1760);
  const resolved = alternative ? clock.finished('admit') : clock.finished('exclude');
  const publish = alternative ? clock.progress('earlier') : clock.progress('publish');

  api.text(ctx, 'J-204   /   H2 delivery', 108, 234, 33, C.muted);
  api.focus.target('publication-path', () => {
    requestLine(ctx, api, x, cutoff09, 302, 715, publicationLabelGaps(380, 135));
    publicationTrace(ctx, api, {
      x,
      cutoff: cutoff09,
      record: second,
      ingestProgress: clock.progress('ingest'),
      publishProgress: publish,
      startY: 380,
      gap: 135,
    });
  });
  api.focus.target('publication-row', () =>
    receipt(ctx, api, {
      y: 810,
      label: '09:00 training row',
      value: resolved
        ? `${live.id}     09:00 − ${formatClock(live.event)} = ${live.ageHours >= 1 ? live.ageHours + ' h' : cutoff09 - live.event + ' min'}`
        : 'Can this request use H2?',
      color: resolved ? C.green : C.yellow,
    }),
  );
  if (clock.started('utc')) {
    receipt(ctx, api, {
      y: 948,
      label: 'One instant on two clocks',
      value: '09:00 +02:00  =  07:00 UTC',
      color: C.cyan,
    });
  } else {
    api.text(ctx, 'H1    ·    sent 01:00    ·    readable 01:02', 110, 950, 32, C.muted);
  }
}
export default {
  id: 'availability-clock',
  draw: drawAvailabilityClock,
  cues: ['ingest', 'publish', 'exclude', 'earlier', 'admit', 'utc'].map(
    (id) => 'sf-availability-clock-' + id,
  ),
};
