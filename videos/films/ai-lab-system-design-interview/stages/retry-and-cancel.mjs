import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, dot, footer, header, line, receipt } from '../defaults.mjs';
export function drawRetryAndCancel(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('retry-and-cancel', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-retry-and-cancel-mechanism', () => {
    header(ctx, api, 'Task T47 · attempt W1 · create commit');
    if (currentBeat < 2) {
      const fields =
        currentBeat === 0
          ? [
              ['Repository read', 'automatic'],
              ['Create commit', 'reconcile or review'],
              ['verified receiver', 'required for automatic write'],
            ]
          : [
              ['receiver flag', 'string "True"'],
              ['actual Boolean True?', 'NO'],
              ['retry mode', modelState.mode],
              ['mutation receipt', 'still uncertain'],
            ];
      receipt(ctx, api, fields, 230, 430, 1450);
    } else {
      const events = [
        ['write sent', 0.02],
        ['cancel intent', 0.14],
        ['late commit c42', 0.5],
        ['sandbox exit', 1],
      ];
      line(ctx, api, 240, 480, 1670, 480, themeColors.muted, 4);
      events.forEach(([label, at], i) => {
        const x = 240 + i * 470;
        if (progress >= at || (i === 3 && modelState.exit)) {
          dot(
            ctx,
            api,
            x,
            480,
            i === 2 ? themeColors.blue : i === 3 ? themeColors.green : themeColors.yellow,
          );
          chapterText(ctx, api, label, x, 410 + (i % 2) * 150, 28, themeColors.ink, 'center');
        }
      });
      chapterCard(
        ctx,
        api,
        'Original W1 receipt · ' + (modelState.receipt ? 'accepted commit c42' : 'reply pending'),
        300,
        720,
        1320,
        modelState.receipt ? themeColors.blue : themeColors.yellow,
        105,
        34,
      );
      if (modelState.exit)
        chapterText(
          ctx,
          api,
          'Execution stopped · c42 remains an external fact',
          960,
          905,
          33,
          themeColors.green,
          'center',
        );
    }
    footer(
      ctx,
      api,
      'Cancellation stops future work; it cannot erase an already accepted external write',
    );
  });
}
export default {
  id: 'retry-and-cancel',
  draw: drawRetryAndCancel,
  cues: [
    'sd-retry-and-cancel-0-operation',
    'sd-retry-and-cancel-0-result',
    'sd-retry-and-cancel-1-operation',
    'sd-retry-and-cancel-1-result',
    'sd-retry-and-cancel-2-operation',
    'sd-retry-and-cancel-2-result',
  ],
};
