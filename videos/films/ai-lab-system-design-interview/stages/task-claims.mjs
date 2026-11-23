import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header, receipt } from '../defaults.mjs';
export function drawTaskClaims(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('task-claims', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-task-claims-mechanism', () => {
    header(ctx, api, 'Task T47 · attempt W1 · stored state');
    if (currentBeat === 0) {
      const rows = [
        ['queued', 'provisioning / canceled'],
        ['provisioning', 'running / failed / canceled'],
        ['running', 'blocked / review / failed / canceled'],
        ['blocked', 'running / review / failed / canceled'],
        ['review', 'running / complete / canceled'],
      ];
      rows.forEach(([k, v], i) => {
        chapterText(ctx, api, k, 230, 420 + i * 88, 30, themeColors.blue);
        chapterText(ctx, api, v, 740, 420 + i * 88, 29, themeColors.cyan);
      });
      chapterText(
        ctx,
        api,
        'failed / canceled / complete → terminal',
        960,
        925,
        34,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      chapterCard(
        ctx,
        api,
        'Stored: ' + modelState.stored,
        550,
        360,
        850,
        themeColors.blue,
        105,
        36,
      );
      chapterCard(
        ctx,
        api,
        'W1 expects running',
        170,
        570,
        690,
        modelState.staleClaim ? themeColors.pink : themeColors.yellow,
      );
      chapterCard(
        ctx,
        api,
        'W2 expects blocked',
        1060,
        570,
        690,
        modelState.claimed ? themeColors.green : themeColors.yellow,
      );
      if (modelState.staleClaim)
        chapterText(
          ctx,
          api,
          'W1 loses expected-state check',
          510,
          745,
          28,
          themeColors.pink,
          'center',
        );
      if (modelState.claimed)
        chapterText(
          ctx,
          api,
          'W2 claims blocked → running',
          1405,
          745,
          28,
          themeColors.green,
          'center',
        );
    } else {
      receipt(
        ctx,
        api,
        [
          ['attempt', 'W1'],
          ['checkout', 'scoped worktree'],
          ['lease', 'worker owns expected state'],
          ['tool event', 'E7 → commit c42'],
          ['sandbox', 'time / network / disk bounds'],
          ['new work after terminal', 'new attempt W2'],
        ],
        220,
        395,
        1460,
      );
    }
    footer(ctx, api, 'Legal edges do not persist or claim the stored attempt');
  });
}
export default {
  id: 'task-claims',
  draw: drawTaskClaims,
  cues: [
    'sd-task-claims-0-operation',
    'sd-task-claims-0-result',
    'sd-task-claims-1-operation',
    'sd-task-claims-1-result',
    'sd-task-claims-2-operation',
    'sd-task-claims-2-result',
  ],
};
