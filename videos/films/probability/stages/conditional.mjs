import { mix, phase, smooth } from '../arithmetic.mjs';
import { queuePackets } from '../fixtures.mjs';
import { conditionalSnapshot } from '../model.mjs';
import { box, cell, countReceipt, focus, packet, route, text } from '../defaults.mjs';
export function drawConditional(ctx, scene, state, api) {
  const snap = conditionalSnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues),
    q = snap.reverse;
  const removed = queuePackets.filter((row) => !row.abusive).toReversed();
  const removeOrder = new Map(removed.map((row, i) => [row.index, i]));
  focus(api, 'eligible-population', () => {
    api.rect(ctx, 225, 320, 1555, 515, api.C.panel, undefined, 10);
    for (const row of queuePackets) {
      const at = cell(row);
      const removal = phase(q, 0, 0.82),
        leave = row.abusive
          ? 0
          : smooth(
              phase(
                removal,
                removeOrder.get(row.index) / removed.length,
                (removeOrder.get(row.index) + 0.85) / removed.length,
              ),
            );
      if (leave < 1)
        packet(
          ctx,
          api,
          row,
          leave === 0
            ? at
            : route(
                at,
                {
                  x: 1390,
                  y: 715,
                },
                leave,
                true,
              ),
        );
    }
    const passedY = mix(790, 850, snap.select);
    box(
      ctx,
      api,
      '5 abusive passed',
      280,
      q > 0 ? mix(passedY, 735, smooth(phase(q, 0.84, 1))) : passedY,
      540,
      55,
      api.C.red,
      29,
    );
    if (q < 1) box(ctx, api, '9,405 clean passed', 1100, passedY, 590, 55, api.C.muted, 29);
    text(
      ctx,
      api,
      q === 1
        ? 'Eligible: 100 abusive rows'
        : q > 0
          ? 'Selecting the abusive population…'
          : snap.select === 1
            ? 'Eligible: 590 flagged rows'
            : 'Eligible: all 10,000 rows',
      960,
      280,
      35,
      api.C.cyan,
    );
  });
  focus(api, 'conditional-fraction', () => {
    const line =
      q > 0
        ? q === 1
          ? 'P(flag | abuse) = 95 / 100 = 95%'
          : 'Reversing the selected population…'
        : snap.resultReady
          ? 'P(abuse | flag) = 95 / 590 ≈ 16.1%'
          : 'P(abuse | flag) = ?';
    countReceipt(ctx, api, line, 'Same intersection: 95 abusive AND flagged', 975);
  });
}
export default {
  id: 'conditional',
  draw: drawConditional,
  cues: ['select-flagged', 'conditional-result', 'reverse-condition'],
};
