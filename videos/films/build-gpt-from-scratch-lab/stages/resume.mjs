import { ended, spoken } from '../construction.mjs';
import { tile } from '../prompt.mjs';

const starts = [4, 1, 9, 6];
export function drawResume(ctx, scene, state, api) {
  const { C } = api;
  const consumed = Math.floor(2 * spoken(state, 'consume-draws', 0));
  const restored = spoken(state, 'restore-cursor', 1);
  const x = (i) => 687 + 256 * i;
  api.text(ctx, 'Example window starts from one sampler', 163, 287, 39, C.ink);
  starts.forEach((v, i) => tile(ctx, api, v, x(i), 346, i < consumed ? C.muted : C.blue, 206));
  api.focus.target('cursor', () => {
    api.arrow(ctx, x(consumed), 580, x(consumed), 478, C.yellow, 6);
    api.text(ctx, 'Next draw', x(consumed), 642, 35, C.yellow, 'center');
  });
  api.text(ctx, 'Reload initial seed', 180, 776, 38, C.muted);
  api.text(ctx, 'Reload saved state', 180, 920, 38, C.ink);
  api.focus.target('fork', () => {
    for (const trackY of [832, 977]) {
      api.line(ctx, x(0), trackY, x(starts.length - 1), trackY, C.muted, 3);
      starts.forEach((_, i) => api.circle(ctx, x(i), trackY, 6, C.muted));
    }
    if (state.beat > 0) {
      tile(ctx, api, starts[0], x(0), 706, C.pink, 140);
      tile(
        ctx,
        api,
        ended(state, 'restored-draw', 1) ? starts[consumed] : '?',
        x(0) + (x(consumed) - x(0)) * restored,
        851,
        C.blue,
        140,
      );
    }
  });
  api.text(
    ctx,
    'Each value is a window start. The lab saves its training and validation generators separately.',
    960,
    1024,
    29,
    C.muted,
    'center',
  );
}
export default {
  id: 'resume',
  draw: drawResume,
  cues: ['consume-draws', 'restore-cursor', 'restored-draw'],
};
