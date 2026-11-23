import { cueAt } from '../cue-clock.mjs';
import { cleanRelease, releaseSheet } from '../release-sheet.mjs';

const candidate = { checks: cleanRelease, final_action: 'merge_release' };
const waiting = { ...cleanRelease, security_scan_clear: undefined };
const observed = { ...cleanRelease, security_scan_clear: false };

export function drawTypedObservationHandoff(ctx, scene, state, api) {
  api.focus.target('typed-observation-handoff-mechanism', () => {
    const { C } = api;
    const requested = cueAt(state, 'tool-request', 1, 0, 0.15).done;
    const authorized = cueAt(state, 'tool-authorize', 1, 0.2, 0.4).done;
    const sent = cueAt(state, 'tool-send', 1, 0.41, 0.49).done;
    const reply = cueAt(state, 'tool-reply', 2, 0, 0.16).done;
    const filled = cueAt(state, 'tool-fill', 2, 0.16, 0.28).done;
    const decided = cueAt(state, 'tool-decision', 2, 0.29, 0.48).done;
    releaseSheet(ctx, api, {
      facts: filled ? observed : waiting,
      record: candidate,
      scanMarked: true,
      showPolicy: decided,
    });
    if (requested) {
      api.text(ctx, 'get_security_scan(run_id="ci-1482")', 180, 924, 36, C.cyan, 'left', 'mono');
      const status = reply
        ? 'Reply: scan clear = False'
        : sent
          ? 'Sent to scan service'
          : authorized
            ? 'Arguments and permission checked'
            : 'Proposed request';
      api.text(ctx, status, 1750, 924, 36, reply ? C.yellow : C.ink, 'right');
    } else {
      api.text(
        ctx,
        'Run ci-1482   ·   Where can we get the missing result?',
        960,
        929,
        42,
        C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'typed-observation-handoff',
  draw: drawTypedObservationHandoff,
  cues: [
    'tool-missing',
    'tool-request',
    'tool-authorize',
    'tool-send',
    'tool-reply',
    'tool-fill',
    'tool-decision',
  ],
};
