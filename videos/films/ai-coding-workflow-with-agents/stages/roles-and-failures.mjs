import { clamp } from '../arithmetic.mjs';
import { arrow, box, focusTarget, heading, instructionText, line } from '../defaults.mjs';
export function drawRolesAndFailures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const q = (id, a = 0.12, z = 0.8) => {
    const cue = state.cues?.[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : api.phase(progress, a, z);
  };
  const on = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'How would a second verifier find the duplicate?');
      focusTarget(ctx, api, 'roles-evidence', () => {
        const labels = [
          'Explorer: call path',
          'Worker: patch',
          'Verifier: behavior',
          'Reviewer: risks',
        ];
        labels.forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            160 + i * 440,
            395,
            390,
            100,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
            28,
          ),
        );
        box(ctx, api, 'Worker check: response.ok', 220, 665, 650, 100, themeColors.muted, 32);
        box(
          ctx,
          api,
          on('roles-fresh', 0.6)
            ? 'Fresh check: retry / new / stored count'
            : 'What did the handler store?',
          1030,
          665,
          710,
          100,
          themeColors.yellow,
          29,
        );
      });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'How does the next attempt use the first result?');
      focusTarget(ctx, api, 'roles-ownership', () => {
        const feedback = q('roles-feedback', 0.1, 0.35);
        box(ctx, api, 'Evaluated trial 1', 170, 375, 460, 95, themeColors.blue, 32);
        box(ctx, api, 'Stored verbal feedback', 730, 375, 490, 95, themeColors.yellow, 30);
        box(ctx, api, 'Trial 2', 1350, 375, 400, 95, themeColors.cyan, 34);
        if (feedback > 0) {
          arrow(ctx, api, 660, 422, 700, 422, themeColors.yellow);
          arrow(ctx, api, 1250, 422, 1320, 422, themeColors.yellow);
        }
        box(ctx, api, 'Worker A', 220, 650, 430, 90, themeColors.blue, 33);
        box(ctx, api, 'Shared DB / port / fixture', 710, 825, 820, 90, themeColors.pink, 32);
        box(ctx, api, 'Worker B', 1230, 650, 430, 90, themeColors.cyan, 33);
        line(ctx, api, 435, 765, 435, 870, themeColors.muted);
        arrow(ctx, api, 435, 870, 680, 870, themeColors.muted);
        line(ctx, api, 1445, 765, 1445, 800, themeColors.muted);
        instructionText(
          ctx,
          api,
          'Give each worker its own test database, or schedule their runs in turn.',
          960,
          990,
          31,
          themeColors.yellow,
        );
      });
    } else {
      heading(ctx, api, 'A test log contains a credential');
      focusTarget(ctx, api, 'roles-incident', () => {
        const revoked = on('roles-revoke', 0.4);
        box(ctx, api, 'Log artifact: TOKEN [fixture]', 220, 420, 780, 100, themeColors.pink, 36);
        box(
          ctx,
          api,
          revoked ? 'Credential revoked' : 'Credential exposed',
          1200,
          420,
          520,
          100,
          revoked ? themeColors.green : themeColors.pink,
          34,
        );
        box(ctx, api, 'Restrict artifact access', 220, 705, 780, 100, themeColors.yellow, 34);
        box(ctx, api, 'Repair capture before rerun', 1110, 705, 650, 100, themeColors.cyan, 31);
        instructionText(
          ctx,
          api,
          'Preserve the incident evidence while restricting access to the log.',
          960,
          970,
          30,
          themeColors.muted,
        );
      });
    }
    return;
  }
  return;
}
export default {
  id: 'roles-and-failures',
  draw: drawRolesAndFailures,
  cues: [
    'roles-and-failures-step-1',
    'roles-fresh',
    'roles-and-failures-step-2',
    'roles-feedback',
    'roles-and-failures-step-3',
    'roles-revoke',
  ],
};
