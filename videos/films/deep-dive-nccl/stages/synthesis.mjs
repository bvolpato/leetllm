import { cueProgress, heard } from '../construction.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  const inspected = cueProgress(state, 1, 'synth-open') > 0;
  const failed = heard(state, 1, 'synth-oom');
  focus.target('synth-log', () => {
    const headers = [
      [430, 'Earlier rank log'],
      [1010, 'Step 8'],
      [1520, 'Later peer report'],
    ];
    for (const [x, label] of headers) api.text(ctx, label, x, 310, 35, C.ink, 'center');
    for (let rank = 0; rank < 4; rank++) {
      const y = 422 + rank * 126;
      const missing = rank === 2;
      const visible = !missing || inspected;
      api.text(
        ctx,
        'R' + rank,
        137,
        y + 12,
        42,
        missing && inspected ? C.yellow : C.ink,
        'center',
        'mono',
      );
      api.line(ctx, 693, y, 785, y, C.muted, 3);
      api.line(ctx, 1200, y, 1312, y, C.muted, 3);
      const records = [
        [
          430,
          495,
          missing
            ? failed
              ? 'Allocation failed'
              : inspected
                ? 'Allocate buffer'
                : '?'
            : 'Buffer allocated',
        ],
        [1010, 345, missing ? (failed ? 'Never entered' : '·') : 'Entered'],
        [1520, 360, missing ? '·' : 'Timeout'],
      ];
      for (const [i, [x, width, label]] of records.entries()) {
        const color =
          missing && failed && i === 0 ? C.pink : !missing && i === 2 ? C.yellow : C.muted;
        api.rect(ctx, x - width / 2, y - 42, width, 84, C.panel, color, 8);
        api.text(ctx, label, x, y + 13, 36, visible ? color : C.muted, 'center');
      }
    }
    const note = failed
      ? 'Rank 2 stopped before the group call.'
      : 'Which earlier rank log would you open?';
    api.text(ctx, note, 960, 977, 43, failed ? C.pink : C.ink, 'center');
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['synth-peers', 'synth-question', 'synth-open', 'synth-oom', 'synth-first'],
};
