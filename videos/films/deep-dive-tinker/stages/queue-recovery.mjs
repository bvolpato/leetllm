import { tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawQueueRecovery(ctx, scene, state, api) {
  return paintQueueRecovery(ctx, scene, state, api);
}
function paintQueueRecovery(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('queue-recovery', state),
    currentBeat = modelState.b;
  return focus.target('tk-queue-recovery-trace', () => {
    if (currentBeat < 2) {
      drawExtendedText(
        ctx,
        api,
        'Trainer step ' + modelState.trainer + ' · bounded queue of 3 supplied groups',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      modelState.groups.forEach((group, i) => {
        const y = 370 + i * 155;
        drawExtendedCard(
          ctx,
          api,
          group.id + ' · sampled step ' + group.policy,
          170,
          y,
          630,
          105,
          themeColors.blue,
          31,
        );
        drawExtendedText(
          ctx,
          api,
          'lag = ' +
            modelState.trainer +
            ' − ' +
            group.policy +
            ' = ' +
            (modelState.trainer - group.policy),
          950,
          y + 65,
          32,
          themeColors.cyan,
        );
        drawExtendedCard(
          ctx,
          api,
          currentBeat === 1 && i === 1 ? 'outstanding · ID G2' : 'identifiable request',
          1370,
          y,
          350,
          105,
          currentBeat === 1 && i === 1 ? themeColors.yellow : themeColors.muted,
          27,
        );
      });
      if (modelState.deadline)
        drawExtendedCard(
          ctx,
          api,
          'Application deadline: stop replacement admission · G2 remains identifiable',
          170,
          855,
          1550,
          110,
          themeColors.pink,
          31,
        );
      else
        drawExtendedNote(
          ctx,
          api,
          'Capacity and policy lag are separate admission inputs; a deep queue can hide latency while aging samples.',
        );
      if (modelState.reconcile)
        drawExtendedText(
          ctx,
          api,
          'Completion / error reconciliation pending · no duplicate G2 replacement',
          960,
          1010,
          26,
          themeColors.yellow,
          'center',
        );
    } else {
      drawExtendedText(
        ctx,
        api,
        'Same local STARTED journal · two possible external histories',
        960,
        275,
        33,
        themeColors.yellow,
        'center',
      );
      drawExtendedCard(
        ctx,
        api,
        'operation key charge-42 · STARTED',
        480,
        355,
        960,
        105,
        themeColors.blue,
        31,
      );
      const a = drawExtendedCard(
          ctx,
          api,
          'Crash before destination effect\nEffects: 0',
          170,
          570,
          700,
          165,
          themeColors.yellow,
          32,
        ),
        z = drawExtendedCard(
          ctx,
          api,
          'Crash after destination effect\nEffects: 1',
          1050,
          570,
          700,
          165,
          themeColors.pink,
          32,
        );
      api.line(ctx, 960, 460, 960, 510, themeColors.muted, 3);
      api.line(ctx, 520, 510, 1400, 510, themeColors.muted, 3);
      api.line(ctx, 520, 510, 520, 570, themeColors.muted, 3);
      api.line(ctx, 1400, 510, 1400, 570, themeColors.muted, 3);
      if (modelState.externalLookup)
        drawExtendedCard(
          ctx,
          api,
          'Destination-supported status / idempotency must resolve charge-42',
          170,
          840,
          1580,
          110,
          themeColors.cyan,
          30,
        );
      drawExtendedNote(
        ctx,
        api,
        'A training sequence ID cannot make an unrelated external write replay-safe.',
      );
    }
  });
}
export default {
  id: 'queue-recovery',
  draw: drawQueueRecovery,
  cues: [
    'tk-queue-recovery-0-0',
    'tk-queue-recovery-0-1',
    'tk-queue-recovery-0-2',
    'tk-queue-recovery-0-3',
    'tk-queue-recovery-0-4',
    'tk-queue-recovery-1-0',
    'tk-queue-recovery-1-1',
    'tk-queue-recovery-1-2',
    'tk-queue-recovery-1-3',
    'tk-queue-recovery-2-0',
    'tk-queue-recovery-2-1',
    'tk-queue-recovery-2-2',
    'tk-queue-recovery-2-3',
  ],
};
