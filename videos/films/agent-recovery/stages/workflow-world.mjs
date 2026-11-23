import { arrow, centerText, cueProgress, line, note, tag } from '../defaults.mjs';
export function drawWorkflowWorld(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('workflow-world-mechanism', () => {
    if (currentBeat === 1) {
      centerText(
        ctx,
        api,
        'Recorded results and completion gaps are different histories',
        960,
        280,
        34,
        themeColors.muted,
      );
      const recorded = cueProgress(ctx, api, 'activity-recorded'),
        gap = cueProgress(ctx, api, 'activity-gap');
      [
        ['recorded result', 430, true],
        ['completion gap', 735, false],
      ].forEach(([label, y, complete]) => {
        centerText(ctx, api, label, 345, y, 30, complete ? themeColors.blue : themeColors.pink);
        line(ctx, api, 600, y, 1590, y, themeColors.muted);
        [620, 1000, 1450].forEach((x, i) => {
          api.circle(
            ctx,
            x,
            y,
            17,
            i === 2 && !complete
              ? themeColors.panel
              : complete
                ? themeColors.green
                : themeColors.yellow,
          );
          centerText(
            ctx,
            api,
            ['scheduled', 'external effect', 'completion recorded'][i],
            x,
            y - 70,
            26,
            i === 2 && !complete ? themeColors.pink : themeColors.muted,
          );
        });
        if (complete && recorded) {
          const x = 1450 - 830 * recorded;
          api.circle(ctx, x, y + 65, 13, themeColors.blue);
          if (done('activity-recorded'))
            centerText(
              ctx,
              api,
              'replay recorded result · no new call',
              1100,
              y + 125,
              31,
              themeColors.green,
            );
        }
        if (!complete && gap) {
          arrow(ctx, api, 620, y + 70, 620 + 380 * gap, y + 70, themeColors.pink);
          if (done('activity-gap'))
            centerText(
              ctx,
              api,
              'Activity may run again · keep destination repeat safety',
              1100,
              y + 135,
              29,
              themeColors.pink,
            );
        }
      });
      note(
        ctx,
        api,
        'Event history restores deterministic workflow state; it does not grant exactly-once remote effects',
      );
    } else {
      const rewind = cueProgress(ctx, api, 'checkpoint-rewind');
      centerText(
        ctx,
        api,
        'The local cursor and remote effect have separate histories',
        960,
        285,
        35,
        themeColors.muted,
      );
      centerText(ctx, api, 'local workflow', 255, 430, 31, themeColors.blue);
      centerText(ctx, api, 'remote controller', 340, 700, 31, themeColors.green);
      line(ctx, api, done('reconcile-checkpoint') ? 915 : 550, 430, 1610, 430, themeColors.blue);
      line(ctx, api, 550, 700, 1185, 700, themeColors.green);
      const local = 1300 - 650 * rewind;
      api.circle(ctx, local, 430, 18, themeColors.yellow);
      centerText(
        ctx,
        api,
        rewind ? 'checkpoint restored' : 'dispatch completed; receipt missing',
        1100,
        365,
        31,
        themeColors.yellow,
      );
      tag(ctx, api, 'job-1 · queued', 1430, 700, themeColors.green, 430);
      line(ctx, api, 1300, 470, 1300, 650, themeColors.pink, 2);
      centerText(ctx, api, 'effect / local-receipt gap', 1060, 570, 30, themeColors.pink);
      if (done('reconcile-checkpoint')) {
        api.path(
          ctx,
          [
            {
              x: 1430,
              y: 650,
            },
            {
              x: 1750,
              y: 650,
            },
            {
              x: 1750,
              y: 950,
            },
            {
              x: local,
              y: 950,
            },
            {
              x: local,
              y: 480,
            },
          ],
          {
            color: themeColors.yellow,
            width: 3,
          },
        );
        tag(ctx, api, 'job-1 · observed queued', local, 430, themeColors.green, 470);
      }
      note(
        ctx,
        api,
        'Persistent workflow storage restores records; the remote ledger survives local cursor rewind',
      );
    }
  });
}
export default {
  id: 'workflow-world',
  draw: drawWorkflowWorld,
  cues: ['checkpoint-rewind', 'reconcile-checkpoint', 'activity-recorded', 'activity-gap'],
};
