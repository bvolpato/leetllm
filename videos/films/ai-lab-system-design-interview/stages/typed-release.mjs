import { systemExtensionFrame } from '../construction.mjs';
import { card, text } from '../defaults.mjs';

export function drawTypedRelease(ctx, scene, state, api) {
  const { C, focus } = api;
  const packet = systemExtensionFrame(scene.id, state);
  const { next, altered, denied, leaks, echo } = packet;

  focus.target('packet-scores', () => {
    text(ctx, api, next ? 'Candidate C3' : 'Candidate C2', 150, 295, 53, C.ink);
    text(ctx, api, 'Evaluator tuple', 820, 382, 38, C.blue, 'center');
    text(ctx, api, 'Host minimum', 1485, 382, 38, C.yellow, 'center');
    for (const [i, [label, score, supplied, host]] of [
      ['Retrieval recall', packet.recall, packet.minima.recall, packet.minima.recall],
      ['Citation faithfulness', packet.faithfulness, echo, packet.minima.faithfulness],
    ].entries()) {
      const y = 450 + i * 163;
      text(ctx, api, label, 150, y + 51, 37, C.ink);
      card(
        ctx,
        api,
        '(' + score.toFixed(2) + ',   ' + supplied.toFixed(2) + ')',
        580,
        y,
        480,
        altered && i ? C.pink : C.blue,
        84,
        42,
      );
      api.line(ctx, 1100, y + 42, 1300, y + 42, C.muted, 3);
      text(ctx, api, host.toFixed(2), 1485, y + 59, 49, C.yellow, 'center');
    }
    text(ctx, api, 'Observed, echoed minimum', 820, 760, 29, C.muted, 'center');
  });
  focus.target('packet-outcome', () => {
    api.line(ctx, 150, 812, 1760, 812, C.muted, 2);
    const leakField =
      'Permission leaks   ' +
      (leaks === null ? 'missing' : typeof leaks === 'boolean' ? 'False' : '0');
    text(ctx, api, leakField, 150, 903, 38, C.ink);
    const verdict = next
      ? packet.launchAllowed
        ? 'Local checks pass'
        : 'Hold for a measured count'
      : altered && denied
        ? 'Hold · policy mismatch'
        : 'Check against host policy';
    text(ctx, api, verdict, 1760, 954, 46, next && packet.launchAllowed ? C.green : C.ink, 'right');
  });
}

export default {
  id: 'typed-release',
  draw: drawTypedRelease,
  cues: [
    'packet-read',
    'packet-owner',
    'packet-edit',
    'packet-deny',
    'packet-fresh',
    'packet-bool',
    'packet-zero',
  ],
};
