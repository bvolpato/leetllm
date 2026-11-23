import { sampleModel, seatbeltStartup } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawSeatbelt(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('seatbelt', state),
    { b: currentBeat, q } = modelState;
  {
    text(ctx, api, 'macOS · intended policy', 170, 290, 39, themeColors.blue);
    const lines = [
      ['Source writes', 'ALLOW', themeColors.green],
      ['System runtime reads', 'ALLOW', themeColors.green],
      ['Home credentials', 'DENY', themeColors.pink],
      ['Unapproved network egress', 'DENY', themeColors.pink],
      ['Unneeded Mach services', 'DENY', themeColors.pink],
    ];
    lines.forEach(([name, result, color], i) => {
      const y = 375 + i * 135;
      api.focus.target('platform-operations', () =>
        card(ctx, api, name, 150, y, 740, themeColors.blue, 90, 32),
      );
      if (currentBeat || i <= Math.floor(q * 4))
        api.focus.target('platform-outcomes', () =>
          card(ctx, api, result, 970, y, 260, color, 90, 32),
        );
    });
    if (currentBeat) {
      const f = seatbeltStartup(true, 'error');
      text(ctx, api, 'Profile load example', 1555, 355, 29, themeColors.yellow, 'center');
      const required = api.focus.target('required-profile', () =>
        card(ctx, api, 'Protection required', 1335, 410, 440, themeColors.yellow, 90, 28),
      );
      const failed = api.focus.reveal('seatbelt-b2-1', () => {
        const shape = api.focus.target('profile-setup-error', () =>
          card(ctx, api, 'Profile load: FAILED', 1335, 580, 440, themeColors.pink, 90, 28),
        );
        teaching.transfer({
          source: {
            shape: required,
            opacity: 1,
          },
          target: {
            shape,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.pink,
        });
        return shape;
      });
      api.focus.reveal('seatbelt-launch-block', () => {
        const gate = api.focus.target('blocked-worker-launch', () =>
          card(
            ctx,
            api,
            f.launch ? 'LAUNCH' : 'LAUNCH BLOCKED',
            1335,
            750,
            440,
            themeColors.pink,
            90,
            29,
          ),
        );
        teaching.transfer({
          source: {
            shape: failed,
            opacity: 1,
          },
          target: {
            shape: gate,
            opacity: 1,
          },
          progress: 1,
          color: themeColors.pink,
        });
        api.focus.target('blocked-worker-launch', () =>
          text(
            ctx,
            api,
            `${f.workersStarted} worker processes started`,
            1555,
            925,
            27,
            themeColors.pink,
            'center',
          ),
        );
      });
    }
  }
}
export default {
  id: 'seatbelt',
  draw: drawSeatbelt,
  cues: ['seatbelt-b1-1', 'seatbelt-b2-1', 'seatbelt-launch-block'],
};
