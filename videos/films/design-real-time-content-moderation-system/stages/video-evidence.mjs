import { selectedLuminance } from '../model.mjs';

const levels = [10, 11, 12, 13, 15, 16, 82, 84, 85, 86, 18, 19];
const fps = 4;
const cuts = selectedLuminance(levels, fps).filter((i) => i % fps !== 0);
export function drawVideoEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.progress(id) === 1;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, String(s), x, y, size, color, align);
  const regular = state.beat > 0 || done('video-regular');
  const extras = cuts.filter((_, i) => state.beat > 1 || done(i ? 'video-drop' : 'video-rise'));
  focus.target('video-strip', () => {
    label('Frames at 4 per second', 145, 271, 41);
    api.line(ctx, 145, 340, 1765, 340, C.muted, 3);
    api.line(ctx, 145, 617, 1765, 617, C.muted, 3);
    levels.forEach((value, i) => {
      const x = 150 + i * 136;
      const keep = (regular && i % fps === 0) || extras.includes(i);
      const fill = 'rgb(' + [value, value, value].join(',') + ')';
      label(i, x + 56, 395, 32, C.ink, 'center');
      api.rect(ctx, x, 425, 111, 100, fill, keep ? C.cyan : C.muted, 0);
      label(value, x + 56, 581, 30, C.ink, 'center');
      if (keep) {
        api.line(ctx, x + 56, 620, x + 56, 665, C.cyan, 4);
        label(i / fps + ' s', x + 56, 712, 27, C.cyan, 'center');
      }
    });
  });
  focus.target('video-pair', () => {
    if (state.beat === 0) {
      label('Each tile shows the frame’s average brightness.', 145, 856, 35);
      if (focus.visible('video-ask'))
        label('Which two adjacent changes are greater than 30?', 145, 955, 42, C.yellow);
    } else if (state.beat === 1) {
      label('Change in brightness   /   select when |change| > 30', 145, 844, 38);
      extras.forEach((i, n) => {
        const difference = Math.abs(levels[i] - levels[i - 1]);
        label(
          'Frame ' + i + '    |' + levels[i] + ' − ' + levels[i - 1] + '| = ' + difference,
          145 + n * 810,
          952,
          39,
          C.cyan,
        );
      });
    } else {
      label('Two different frames', 145, 863, 39);
      for (let j = 0; j < 2; j++) {
        const x = 635 + 275 * j;
        const shades = j ? ['#dddddd', '#333333'] : ['#333333', '#dddddd'];
        shades.forEach((shade, k) => api.rect(ctx, x + k * 85, 779, 85, 120, shade, undefined, 0));
      }
      if (done('video-limit')) label('Same mean   /   change = 0', 1180, 863, 36, C.yellow);
      if (focus.visible('video-live'))
        label('A live decision can still stop the next segment.', 145, 982, 34, C.ink);
    }
  });
}
export default {
  id: 'video-evidence',
  draw: drawVideoEvidence,
  cues: [
    'video-all',
    'video-regular',
    'video-ask',
    'video-rise',
    'video-drop',
    'video-limit',
    'video-live',
  ],
};
