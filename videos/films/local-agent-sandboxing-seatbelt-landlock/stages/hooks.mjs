import { hookSnapshot } from '../model.mjs';

function sampleTime(state) {
  if (!state.cues) return hookSnapshot(state.beat, state.beatP).time;
  const travel = (id, length) => (state.cues[id]?.progress ?? 0) * length;
  if (state.beat === 0) return travel('hooks-write', 1.2) + travel('hooks-exit', 1.8);
  if (state.beat === 1)
    return 3 + travel('hooks-checkout', 3) + travel('hooks-child', 1) + travel('hooks-owner', 1);
  return (
    travel('hooks-attempt', 1.2) +
    travel('hooks-replay-exit', 1.8) +
    travel('hooks-replay-checkout', 3) +
    travel('hooks-empty', 2)
  );
}

export default {
  id: 'hooks',
  cues: [
    'hooks-write',
    'hooks-exit',
    'hooks-checkout',
    'hooks-child',
    'hooks-owner',
    'hooks-attempt',
    'hooks-replay-exit',
    'hooks-replay-checkout',
    'hooks-empty',
  ],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const t = sampleTime(state);
    const replay = state.beat === 2;
    const x = (time) => 478 + time * 159;
    const lanes = [
      { name: 'Worker', start: 0, end: 3, color: C.blue },
      { name: 'Saved hook file', start: 1.2, end: 8, color: C.yellow },
      { name: 'Host checkout', start: 6, end: 8, color: C.cyan },
      { name: 'Host child', start: 7, end: 8, color: C.pink },
    ];
    const label = (s, x, y, size, color = C.ink, align = 'left') =>
      api.text(ctx, s, x, y, size, color, align);
    const band = (start, end, y, h, color) => {
      if (end > start) api.rect(ctx, x(start), y, x(end) - x(start), h, color, undefined, 3);
    };
    api.focus.target('hook-history', () => {
      label(
        replay ? 'Replay with read-only metadata' : 'Repository metadata is writable',
        135,
        262,
        42,
      );
      label('Worker starts', x(0), 348, 30, C.muted);
      label('Worker exits', x(3), 348, 30, C.muted, 'center');
      label('Checkout', x(6), 348, 30, C.muted, 'center');
      for (const tick of [0, 3, 6]) api.line(ctx, x(tick), 370, x(tick), 817, C.muted, 2);
      lanes.forEach(({ name, start, end, color }, i) => {
        const y = 420 + i * 116;
        label(name, 135, y + 26, 39, color);
        api.line(ctx, x(0), y + 15, x(8), y + 15, C.muted, 2);
        if (replay) band(start, end, y - 15, 7, C.muted);
        if (!replay || (i !== 1 && i !== 3)) band(start, Math.min(end, t), y + 1, 28, color);
        if (replay && i === 1 && t >= 1.2) {
          const cx = x(1.2);
          api.line(ctx, cx - 11, y + 3, cx + 11, y + 27, C.pink, 5);
          api.line(ctx, cx + 11, y + 3, cx - 11, y + 27, C.pink, 5);
          label('Write denied', cx + 23, y + 57, 29, C.pink);
        }
      });
      api.circle(ctx, x(t), 385, 10, C.yellow, C.bg, 2);
      if (replay) label('Thin gray traces record the first run.', 135, 890, 30, C.muted);
      else if (t >= 3) label('The file is still on disk.', x(3) + 20, 610, 31, C.yellow);
    });
    api.focus.target('hook-lifetime', () => {
      const caption = replay
        ? t >= 6
          ? 'Denied planting → later checkout has no planted hook'
          : t >= 1.2
            ? 'Write refused. The hook directory is still empty.'
            : 'Protected replay: Git metadata outside writable scope'
        : t >= 8
          ? 'Hook executes with the host user’s authority'
          : t >= 7
            ? 'Git has started a new child'
            : t >= 3
              ? 'Worker has ended; the file can outlive it'
              : 'Unsafe fixture: writable Git metadata';
      label(caption, 135, 988, 39, replay ? C.green : t >= 7 ? C.pink : C.yellow);
    });
  },
};
