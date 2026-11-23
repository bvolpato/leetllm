import { bound } from '../arithmetic.mjs';
import { teacherForcingState } from '../model.mjs';
import { card, heading, target, text } from '../defaults.mjs';
export function drawTeacherForcing(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bound(state.beatP ?? 0),
    cues = state.cues;
  {
    const v = teacherForcingState(currentBeat, progress, cues),
      left = 310,
      stride = 340,
      width = 280;
    heading(ctx, api, 'Inputs keep the recorded history');
    const right = left + v.index * stride + width;
    target(ctx, api, 'teacher-prefix', () => {
      api.line(ctx, left, 340, right, 340, themeColors.cyan, 4);
      api.line(ctx, left, 340, left, 360, themeColors.cyan, 4);
      api.line(ctx, right, 340, right, 360, themeColors.cyan, 4);
      text(ctx, api, 'Visible prefix', (left + right) / 2, 315, 29, themeColors.cyan, 'center');
    });
    v.inputs.forEach((w, i) =>
      card(
        ctx,
        api,
        w,
        left + i * stride,
        390,
        width,
        100,
        currentBeat > 0 && i > v.index ? themeColors.muted : themeColors.cyan,
      ),
    );
    target(ctx, api, 'teacher-target-row', () =>
      v.targets.forEach((word, i) => {
        card(
          ctx,
          api,
          v.reveal ? word : '?',
          left + i * stride,
          740,
          width,
          100,
          v.scored[i] ? themeColors.green : themeColors.muted,
        );
        if (!v.scored[i])
          text(
            ctx,
            api,
            'loss ignored',
            left + i * stride + width / 2,
            905,
            27,
            themeColors.muted,
            'center',
          );
      }),
    );
    target(ctx, api, 'teacher-connection', () =>
      api.arrow(
        ctx,
        left + v.index * stride + width / 2,
        525,
        left + v.index * stride + width / 2,
        705,
        themeColors.yellow,
        5,
      ),
    );
    if (currentBeat > 0)
      target(ctx, api, 'teacher-future-gate', () => {
        const future = left + 3 * stride + width / 2,
          gate = 1300;
        api.line(ctx, future, 520, future, 600, themeColors.pink, 4);
        api.arrow(ctx, future, 600, gate + 20, 600, themeColors.pink, 4);
        if (v.blocked) api.line(ctx, gate, 555, gate, 645, themeColors.pink, 9);
        text(
          ctx,
          api,
          v.blocked ? 'Future read blocked' : 'Future read?',
          1465,
          685,
          26,
          themeColors.pink,
          'center',
        );
      });
    text(
      ctx,
      api,
      currentBeat === 2
        ? 'Loss selection changes supervision; the input prefix remains.'
        : 'Observed next-token targets',
      960,
      1015,
      32,
      themeColors.green,
      'center',
    );
  }
}
export default {
  id: 'teacher-forcing',
  draw: drawTeacherForcing,
  cues: [
    'teacher-shift',
    'teacher-first',
    'teacher-second',
    'teacher-third',
    'teacher-fourth',
    'teacher-prefix',
    'teacher-block',
    'teacher-loss-mask',
  ],
};
