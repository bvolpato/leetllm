import { capacityEvent } from '../construction.mjs';
import { drawCapacityCard, drawCenteredText, drawFooter, drawLine } from '../defaults.mjs';
export function drawPhaseHandoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1,
    begun = (name, beat) => ev(name, beat) > 0;
  api.focus.target('phase-handoff-mechanism', () => {
    const p = ev('transfer', 1);
    drawCapacityCard(ctx, api, 'Prefill worker', 140, 365, 610, 150, themeColors.blue, 39);
    drawCapacityCard(ctx, api, 'Decode worker', 1170, 365, 610, 150, themeColors.green, 39);
    drawLine(ctx, api, 800, 440, 1120, 440, themeColors.muted, 4);
    if (begun('payload', 0)) {
      const xx = api.lerp(340, 1260, p);
      drawCapacityCard(ctx, api, 'same R1 KV\n2.50 GiB', xx, 650, 390, 120, themeColors.cyan, 33);
    }
    if (currentBeat === 0)
      drawCenteredText(
        ctx,
        api,
        'Placement changes; computed request state retains its identity',
        960,
        915,
        32,
        themeColors.yellow,
      );
    else if (currentBeat === 1) {
      drawCenteredText(ctx, api, '2.5 GiB ÷ 200 GiB/s × 1,000', 960, 875, 38, themeColors.yellow);
      if (done('transfer', 1))
        drawCenteredText(
          ctx,
          api,
          '12.5 ms one-way serialization floor',
          960,
          955,
          36,
          themeColors.cyan,
        );
    } else {
      const avoid = begun('loss', 2) ? 10 : 20,
        total = 15.5;
      drawCenteredText(
        ctx,
        api,
        'Transfer 12.5 + coordination ' + (done('coordination', 2) ? '3 = 15.5 ms' : '?'),
        960,
        850,
        36,
        themeColors.yellow,
      );
      if (done('saving', 2)) {
        if (avoid === 10 && !done('loss', 2))
          drawCenteredText(
            ctx,
            api,
            'Avoided 10 ms · compare with 15.5 ms',
            960,
            940,
            34,
            themeColors.yellow,
          );
        else
          drawCenteredText(
            ctx,
            api,
            'Avoided ' +
              avoid +
              ' ms → ' +
              (avoid > total ? 'save ' + (avoid - total) : 'add ' + (total - avoid)) +
              ' ms',
            960,
            940,
            38,
            avoid > total ? themeColors.green : themeColors.pink,
          );
      }
    }
    drawFooter(
      ctx,
      api,
      'Split the workers when the time saved exceeds transfer and coordination',
    );
  });
}
export default {
  id: 'phase-handoff',
  draw: drawPhaseHandoff,
  cues: [
    'ic-phase-handoff-payload',
    'ic-phase-handoff-transfer',
    'ic-phase-handoff-coordination',
    'ic-phase-handoff-saving',
    'ic-phase-handoff-loss',
  ],
};
