import { cell } from '../fixtures.mjs';
import { cueStarted, lstmJoinFrame, spokenProgress } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawLstm(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.12, 0.86),
    F = components.fade;
  {
    const joined = lstmJoinFrame(state);
    const a = api.focus.target('old-cell', () =>
        card(ctx, api, 'old cell 0.855', 180, 365, 300, themeColors.blue),
      ),
      f = api.focus.target('forget-gate', () =>
        card(ctx, api, 'keep 0.98', 650, 365, 270, themeColors.blue),
      ),
      n = api.focus.target('cell-candidate', () =>
        card(ctx, api, 'candidate 0.10', 180, 650, 300, themeColors.pink),
      ),
      i = api.focus.target('input-gate', () =>
        card(ctx, api, 'write 0.02', 650, 650, 270, themeColors.pink),
      ),
      z = api.focus.target('next-cell', () =>
        components.card({
          label:
            currentBeat === 0
              ? `cell ≈ ${cell.toFixed(3)}`
              : joined.count === 2
                ? `cell ≈ ${joined.sum.toFixed(4)}`
                : joined.count === 1
                  ? `subtotal ${joined.sum.toFixed(4)}`
                  : 'sum pending',
          x: 1230,
          y: 500,
          width: 410,
          height: 94,
          fill: themeColors.panel,
          stroke: themeColors.green,
          textColor: themeColors.green,
          fontSize: 36,
          padding: 16,
          labelOpacity: currentBeat === 0 ? phaseForBeat(1) : 1,
        }),
      );
    api.connect(ctx, a, f, {
      color: themeColors.blue,
    });
    api.connect(ctx, n, i, {
      color: themeColors.pink,
    });
    const r1 = api.connect(ctx, f, z, {
        color: themeColors.blue,
      }),
      r2 = api.connect(ctx, i, z, {
        color: themeColors.pink,
      });
    const packetOpacity = 1 - api.phase(joined.progress, 0.84, 0.98);
    if (packetOpacity > 0.01) {
      ctx.save();
      ctx.globalAlpha *= packetOpacity;
      components.particle({
        points: [r1.from, r1.to],
        progress: Math.min(joined.progress, 0.86),
        radius: 8,
        fill: themeColors.blue,
      });
      components.particle({
        points: [r2.from, r2.to],
        progress: Math.min(joined.progress, 0.86),
        radius: 8,
        fill: themeColors.pink,
      });
      ctx.restore();
    }
    if (currentBeat > 0) {
      if (joined.retainedReady)
        api.focus.target('lstm-retained-term', () =>
          math(
            ctx,
            api,
            `0.98\\times0.855=${joined.terms[0].toFixed(4)}`,
            785,
            520,
            30,
            themeColors.blue,
            'center',
          ),
        );
      if (joined.writtenReady)
        api.focus.target('lstm-written-term', () =>
          math(
            ctx,
            api,
            `0.02\\times0.10=${joined.terms[1].toFixed(4)}`,
            785,
            795,
            30,
            themeColors.pink,
            'center',
          ),
        );
      if (joined.retainedReady && joined.writtenReady)
        api.focus.target('lstm-cell-arithmetic', () =>
          math(
            ctx,
            api,
            `${joined.terms[0].toFixed(4)}+${joined.terms[1].toFixed(4)}=${joined.count === 2 ? joined.sum.toFixed(4) : '?'}`,
            1435,
            645,
            30,
            themeColors.green,
            'center',
          ),
        );
    }
    api.focus.target('lstm-addition-rule', () =>
      math(
        ctx,
        api,
        String.raw`c_t=f_tc_{t-1}+i_t\tilde c_t`,
        960,
        850,
        50,
        themeColors.green,
        'center',
      ),
    );
    const outputGateVisible = currentBeat > 2 || cueStarted(state, 'exposed-hidden-state-b3-1');
    if (outputGateVisible) {
      const gateProgress = currentBeat > 2 ? 1 : spokenProgress(state, 'exposed-hidden-state-b3-1');
      const gate = api.lerp(0.8, 0.1, gateProgress);
      text(ctx, api, `output gate ${gate.toFixed(2)}`, 1435, 700, 36, themeColors.yellow, 'center');
      api.focus.target('exposed-hidden-state', () =>
        text(
          ctx,
          api,
          `hidden ≈ ${(gate * Math.tanh(cell)).toFixed(3)}`,
          1435,
          775,
          36,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'lstm',
  draw: drawLstm,
  cues: [
    'forget-gate-b1-1',
    'input-gate-b1-2',
    'lstm-retained-term',
    'lstm-written-term',
    'next-cell-b2-1',
    'exposed-hidden-state-b3-1',
  ],
};
