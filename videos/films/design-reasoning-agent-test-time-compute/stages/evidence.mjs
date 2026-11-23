import { advise } from '../arithmetic.mjs';
import { observation } from '../fixtures.mjs';
import { beatCue } from '../construction.mjs';
import { drawPolicy, drawReceipt } from '../receipt.mjs';

export function drawEvidence(ctx, scene, state, api) {
  const boundary = beatCue(state, 'evidence-move', 0, 0.62).done;
  const late = beatCue(state, 'evidence-late', 1, 0.65).done;
  const record = { ...observation, latency: boundary ? 300 : observation.latency };
  const now = late ? 131 : 110;
  const eligible = advise(record, now);
  const reveal = late
    ? beatCue(state, 'evidence-refresh', 2, 0.01).done
    : !boundary || beatCue(state, 'evidence-boundary', 1, 0.01).done;
  drawReceipt(ctx, api, { record, now });
  drawPolicy(ctx, api, {
    visible: true,
    latency: late ? null : record.latency,
    result: reveal
      ? eligible === 'REFRESH EVIDENCE'
        ? 'Withhold   /   refresh the metrics receipt'
        : record.latency + ' ms   /   ' + eligible
      : null,
    prompt: late ? 'Can this receipt still support rollback?' : 'Which side owns exactly 300 ms?',
  });
}

export default {
  id: 'evidence',
  draw: drawEvidence,
  cues: ['evidence-move', 'evidence-boundary', 'evidence-late', 'evidence-refresh'],
};
