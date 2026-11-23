import { guardCue, guardDone, streamTripwire } from '../model.mjs';

const marker = 'BLUE';
const reads = streamTripwire([...marker], marker);
const carryLimit = marker.length - 1;

export function paintCanaryStream(ctx, scene, state, api) {
  const { C, focus, text, rect, line } = api;
  const beat = state.beat ?? 0;
  const seen = [
    guardDone(state, 'canary-stream-b', 0, 0.5, 0.58),
    guardDone(state, 'canary-stream-l', 0, 0.59, 0.68),
    guardDone(state, 'canary-stream-u', 0, 0.69, 0.78),
    guardDone(state, 'canary-stream-join', 1, 0.05, 0.24),
  ].filter(Boolean).length;
  const read = seen > 0 ? reads[seen - 1] : undefined;
  const matched = read?.found ?? false;

  focus.target('canary-bytes', () => {
    text(ctx, 'Test marker', 155, 285, 32, C.muted);
    text(ctx, marker, 155, 383, 72, C.ink, 'left', 'mono');
  });
  focus.target('canary-chunks', () => {
    text(ctx, 'Private review buffer', 155, 554, 36, C.cyan);
    for (let i = 0; i < marker.length; i++) {
      const x = 155 + 150 * i;
      rect(ctx, x, 594, 128, 128, C.panel, i < seen ? C.cyan : C.muted, 5);
      if (i < seen) text(ctx, read.joined[i], x + 64, 685, 66, C.ink, 'center', 'mono');
    }
  });
  focus.target('canary-results', () => {
    text(ctx, 'Exact match', 1120, 554, 36, C.muted);
    text(ctx, matched ? 'Marker detected' : 'Waiting', 1120, 665, 54, matched ? C.green : C.muted);
  });
  focus.target('canary-overlap', () => {
    const sweep = guardCue(state, 'canary-stream-overlap', 1, 0.3, 0.56);
    if (sweep > 0) {
      const firstKeptCell = 305;
      const length = 150 * (carryLimit - 1) + 128;
      line(ctx, firstKeptCell, 740, firstKeptCell + length * sweep, 740, C.cyan, 6);
      text(ctx, 'Carry into the next check', 155, 828, 30, C.muted);
      text(ctx, reads.at(-1).carry, 155, 903, 51, C.cyan, 'left', 'mono');
      text(
        ctx,
        marker.length + ' letters  −  1  =  ' + carryLimit + ' letters',
        505,
        898,
        35,
        C.ink,
      );
    }
  });
  if (beat === 2 && guardCue(state, 'canary-stream-incident', 2, 0.28, 0.54) > 0)
    focus.target('canary-scope', () => {
      text(ctx, 'Confirmed credential exposure', 1120, 828, 30, C.muted);
      text(ctx, 'Revoke or rotate the credential.', 1120, 898, 35, C.yellow);
    });
}

export { paintCanaryStream as drawCanaryStream };
export default {
  id: 'canary-stream',
  draw: paintCanaryStream,
  cues: [
    'canary-stream-marker',
    'canary-stream-b',
    'canary-stream-l',
    'canary-stream-u',
    'canary-stream-join',
    'canary-stream-overlap',
    'canary-stream-incident',
  ],
};
