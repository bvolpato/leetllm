import { clamp, mix } from '../arithmetic.mjs';
import { graphWalkState } from '../construction.mjs';
import { drawCaption, drawReference, drawText, drawTransfer, withFocus } from '../defaults.mjs';
export function drawGraph(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat;
  withFocus(ctx, api, 'graph-state', () => {
    const m = graphWalkState(state),
      nodes = {
        0: drawReference(ctx, api, 0, 300, 340, themeColors.green),
        2: drawReference(
          ctx,
          api,
          2,
          1260,
          340,
          m.discovered.includes(2) ? themeColors.green : themeColors.blue,
        ),
        3: drawReference(
          ctx,
          api,
          3,
          830,
          625,
          m.discovered.includes(3) ? themeColors.green : themeColors.blue,
        ),
      };
    drawTransfer(ctx, api, nodes[0], nodes[2], themeColors.cyan);
    drawTransfer(ctx, api, nodes[0], nodes[3], themeColors.cyan);
    drawTransfer(
      ctx,
      api,
      nodes[2],
      nodes[3],
      m.duplicate > 0 ? themeColors.yellow : themeColors.muted,
      m.duplicate,
    );
    drawTransfer(
      ctx,
      api,
      nodes[3],
      nodes[0],
      m.cycle > 0 ? themeColors.pink : themeColors.muted,
      m.cycle,
    );
    drawText(ctx, api, 'Pending queue', 180, 875, 29, themeColors.cyan);
    drawText(ctx, api, 'Active expansion', 180, 475, 25, themeColors.yellow);
    api.rect(ctx, 282, 502, 266, 114, 'transparent', themeColors.yellow, 3);
    if (m.cycle > 0) {
      const claim = clamp(m.cycle / 0.45);
      drawReference(ctx, api, 3, mix(820, 300, claim), mix(815, 520, claim), themeColors.yellow);
    } else if (m.duplicate > 0) {
      const claim = clamp(m.duplicate / 0.45);
      drawReference(ctx, api, 2, mix(520, 300, claim), mix(815, 520, claim), themeColors.yellow);
    } else
      drawReference(
        ctx,
        api,
        0,
        mix(520, 300, m.claim),
        mix(815, 520, m.claim),
        themeColors.yellow,
      );
    if (m.enqueue2 > 0 && m.enqueue2 < 1) {
      const p = m.enqueue2,
        x = p < 0.25 ? mix(1260, 1600, p / 0.25) : p < 0.6 ? 1600 : mix(1600, 520, (p - 0.6) / 0.4),
        y = p < 0.25 ? 450 : p < 0.6 ? mix(450, 815, (p - 0.25) / 0.35) : 815;
      drawReference(ctx, api, 2, x, y, themeColors.yellow);
    } else if (m.enqueue2 >= 1 && m.duplicate === 0)
      drawReference(ctx, api, 2, 520, 815, themeColors.cyan);
    if (m.enqueue3 > 0 && m.cycle === 0)
      drawReference(
        ctx,
        api,
        3,
        mix(830, 820, m.enqueue3),
        mix(725, 815, m.enqueue3),
        themeColors.cyan,
      );
    drawText(
      ctx,
      api,
      'Discovered: ' + m.discovered.map((id) => 'M' + id).join(', '),
      960,
      970,
      32,
      themeColors.green,
      'center',
    );
    if (m.duplicate >= 0.98)
      drawCaption(ctx, api, 'Already discovered: skip another enqueue', themeColors.yellow, 1020);
  });
}
export default {
  id: 'graph',
  draw: drawGraph,
  cues: ['graph-discover', 'graph-duplicate', 'graph-cycle'],
};
