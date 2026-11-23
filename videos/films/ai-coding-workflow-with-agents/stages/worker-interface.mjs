import { clamp } from '../arithmetic.mjs';
import { arrow, box, focusTarget, heading, instructionText } from '../defaults.mjs';
export function drawWorkerInterface(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0);
  const q = (id, a = 0.12, z = 0.8) => {
    const cue = state.cues?.[id];
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : api.phase(progress2, a, z);
  };
  const on = (id, a = 0.2) => q(id, a, a + 0.01) > 0;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Who can approve the next step?');
      focusTarget(ctx, api, 'interface-owners', () => {
        const x = [160, 650, 1150, 1590],
          labels = ['Agent', 'Trusted host', 'Checks / review', 'Owner'];
        labels.forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            x[i],
            420,
            i === 3 ? 220 : 350,
            100,
            [themeColors.blue, themeColors.yellow, themeColors.cyan, themeColors.green][i],
            i === 2 ? 29 : 34,
          ),
        );
        for (let i = 0; i < 3; i++)
          arrow(ctx, api, x[i] + 370, 470, x[i + 1] - 25, 470, themeColors.muted);
        box(ctx, api, 'Read the billing route', 190, 665, 620, 95, themeColors.blue, 36);
        const host = on('worker-interface-step-1', 0.35),
          owner = on('interface-integration', 0.7);
        box(
          ctx,
          api,
          host ? 'Repository read allowed' : 'Awaiting host decision',
          1000,
          665,
          680,
          95,
          host ? themeColors.yellow : themeColors.muted,
          31,
        );
        if (owner)
          instructionText(
            ctx,
            api,
            'The integration owner decides whether to merge.',
            960,
            930,
            33,
            themeColors.green,
          );
      });
    } else {
      heading(ctx, api, 'Trace the actual route before selecting the edit');
      focusTarget(ctx, api, 'interface-callpath', () => {
        const progress = q('interface-route', 0.05, 0.25),
          labels = ['POST /billing', 'webhook handler', 'invoice storage'],
          xs = [180, 750, 1320];
        labels.forEach((v, i) =>
          box(
            ctx,
            api,
            v,
            xs[i],
            425,
            420,
            105,
            i === 2 ? themeColors.yellow : themeColors.blue,
            33,
          ),
        );
        for (let i = 0; i < 2; i++) {
          arrow(ctx, api, xs[i] + 445, 477, xs[i + 1] - 20, 477, themeColors.cyan);
          if (progress > i / 2)
            api.circle(
              ctx,
              xs[i] + 445 + (xs[i + 1] - 20 - xs[i] - 445) * clamp(progress * 2 - i),
              477,
              11,
              themeColors.cyan,
            );
        }
        box(
          ctx,
          api,
          'event key → persistent invoice',
          1010,
          695,
          710,
          100,
          themeColors.yellow,
          34,
        );
        box(ctx, api, 'Context-matching patch', 180, 695, 660, 100, themeColors.blue, 33);
        instructionText(
          ctx,
          api,
          'Match the code around the edit. Replay the event to check the result.',
          960,
          950,
          31,
          themeColors.muted,
        );
      });
    }
    return;
  }
  return;
}
export default {
  id: 'worker-interface',
  draw: drawWorkerInterface,
  cues: [
    'worker-interface-step-1',
    'interface-agent',
    'interface-integration',
    'worker-interface-step-2',
    'interface-route',
  ],
};
