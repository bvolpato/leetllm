import { clamp } from '../arithmetic.mjs';
import { arrow, box, focusTarget, footer, heading, instructionText, line } from '../defaults.mjs';
export function drawRunnerPolicy(ctx, scene, state, api) {
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
      heading(ctx, api, 'Separate checkout state can still share repository state');
      focusTarget(ctx, api, 'runner-worktree', () => {
        for (let i = 0; i < 2; i++) {
          const x = 190 + i * 1000;
          api.rect(ctx, x, 390, 600, 300, themeColors.panel, themeColors.blue, 10);
          instructionText(
            ctx,
            api,
            'Worktree ' + String.fromCharCode(65 + i),
            x + 300,
            445,
            34,
            themeColors.blue,
          );
          ['Working files', 'Own index', 'Own HEAD'].forEach((v, j) =>
            box(ctx, api, v, x + 40, 485 + j * 58, 520, 48, themeColors.cyan, 25),
          );
        }
        box(
          ctx,
          api,
          'Shared objects · most refs · config',
          565,
          825,
          790,
          95,
          themeColors.yellow,
          34,
        );
        const share = q('runner-shared', 0.3, 0.7);
        if (share > 0) {
          line(ctx, api, 490, 720, 490, 872, themeColors.yellow);
          arrow(ctx, api, 490, 872, 540, 872, themeColors.yellow);
          line(ctx, api, 1490, 720, 1490, 872, themeColors.yellow);
          arrow(ctx, api, 1490, 872, 1380, 872, themeColors.yellow);
        }
        instructionText(
          ctx,
          api,
          'A branch identifies a commit; it does not restrict a process',
          960,
          975,
          31,
          themeColors.pink,
        );
      });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Billing invariant: one key → one persistent invoice');
      focusTarget(ctx, api, 'runner-egress', () => {
        api.rect(ctx, 180, 350, 1010, 590, themeColors.panel, themeColors.green, 12);
        instructionText(ctx, api, 'Configured runner boundary', 685, 405, 34, themeColors.green);
        box(ctx, api, 'Source + fixtures', 260, 475, 780, 90, themeColors.blue, 34);
        box(ctx, api, 'Named checks + disposable outputs', 260, 640, 780, 90, themeColors.cyan, 31);
        ['Production token', 'Host home / socket', 'Unrestricted egress'].forEach((v, i) => {
          const y = 430 + i * 190;
          box(
            ctx,
            api,
            v,
            1320,
            y,
            450,
            90,
            on('runner-deny', 0.15) ? themeColors.pink : themeColors.muted,
            30,
          );
          if (on('runner-deny', 0.15)) {
            line(ctx, api, 1220, y + 45, 1285, y + 45, themeColors.pink);
            line(ctx, api, 1248, y + 20, 1273, y + 70, themeColors.pink, 5);
            line(ctx, api, 1273, y + 20, 1248, y + 70, themeColors.pink, 5);
          }
        });
        instructionText(
          ctx,
          api,
          'A container alone does not deny outbound network requests',
          960,
          990,
          31,
          themeColors.yellow,
        );
      });
    } else {
      heading(ctx, api, 'A named command still executes project code and children');
      focusTarget(ctx, api, 'runner-command', () => {
        box(ctx, api, 'pnpm test', 170, 380, 400, 90, themeColors.blue, 36);
        box(ctx, api, 'Manifest script', 760, 380, 480, 90, themeColors.cyan, 34);
        box(ctx, api, 'Child process', 1370, 380, 400, 90, themeColors.yellow, 34);
        arrow(ctx, api, 600, 425, 730, 425, themeColors.cyan);
        arrow(ctx, api, 1270, 425, 1340, 425, themeColors.cyan);
        api.rect(ctx, 1280, 560, 540, 325, 'transparent', themeColors.green, 9);
        box(ctx, api, 'Same runner restrictions', 1320, 630, 460, 95, themeColors.green, 28);
        if (on('runner-children', 0.4)) arrow(ctx, api, 1570, 495, 1570, 600, themeColors.green);
        box(ctx, api, 'Issue / README / tool output', 190, 690, 850, 100, themeColors.muted, 33);
        instructionText(
          ctx,
          api,
          on('runner-untrusted', 0.8)
            ? 'Data cannot mint new command or external authority'
            : 'Inspect scripts, arguments, dependencies and actual tool effects',
          960,
          970,
          31,
          themeColors.yellow,
        );
      });
    }
    footer(
      ctx,
      api,
      'Filesystem, credentials, network, resources and lifetime need their own verified restrictions.',
    );
    return;
  }
  return;
}
export default {
  id: 'runner-policy',
  draw: drawRunnerPolicy,
  cues: [
    'runner-policy-step-1',
    'runner-shared',
    'runner-policy-step-2',
    'runner-deny',
    'runner-policy-step-3',
    'runner-children',
    'runner-untrusted',
  ],
};
