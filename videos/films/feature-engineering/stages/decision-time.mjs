import { events } from '../fixtures.mjs';
import { heartbeatAge } from '../arithmetic.mjs';
import { eligibleFeatureEvent, featureFrame } from '../model.mjs';
import { drawHeartbeatLedger } from '../heartbeat-ledger.mjs';

const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const records = events.map(({ event, available }) => ({
  job: 'J-204',
  event: minutes(event),
  available: minutes(available),
  revision: 1,
}));
const cutoff = 540;
const latest = eligibleFeatureEvent(records, cutoff);

export function drawDecisionTime(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const compared = f.started('decision-filter', 1);
  const selected = f.completed('decision-selected', 1);
  api.focus.target('decision-receipts', () =>
    drawHeartbeatLedger(ctx, api, {
      records,
      cutoff,
      domain: [495, 570],
      ticks: [495, 510, 525, 540, 555, 570],
      selected: selected ? latest : null,
      compared,
    }),
  );
  api.focus.target('decision-age', () => {
    if (f.completed('decision-time-beat-2-focus-2', 1)) {
      api.math(
        ctx,
        '09{:}00-08{:}30=30\\,\\mathrm{min}=' +
          heartbeatAge(cutoff, latest.event) +
          '\\,\\mathrm{h}',
        960,
        913,
        54,
        C.green,
        'center',
      );
    } else {
      api.text(
        ctx,
        selected ? 'Age at 09:00 = 09:00 − 08:30' : 'Which ping sets the heartbeat age at 09:00?',
        960,
        915,
        43,
        C.yellow,
        'center',
      );
    }
  });
}

export default {
  id: 'decision-time',
  draw: drawDecisionTime,
  cues: [
    'decision-packets',
    'decision-filter',
    'decision-selected',
    'decision-time-beat-2-focus-2',
    'decision-noon',
  ],
};
