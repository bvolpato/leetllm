import { robustUnit } from '../arithmetic.mjs';
import { cell, geometryText, heading, vector } from '../defaults.mjs';
export function drawScalarScales(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z),
    cue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'before' ? 0 : c?.phase === 'after' ? 1 : (c?.progress ?? cueProgress());
    };
  {
    heading(ctx, api, 'Inner-product fixture · q=[1,1] · codes A[102,0], B[0,127]');
    if (currentBeat < 2) {
      const q = currentBeat === 0 ? 0 : cue('restore-scales');
      [
        ['A', 102, 8.031496, themeColors.blue],
        ['B', 127, 1, themeColors.pink],
      ].forEach(([name, raw, scaled, col], i) => {
        const y = 440 + i * 260;
        geometryText(ctx, api, name, 200, y + 40, 38, col);
        cell(ctx, api, i === 0 ? 'scale 10/127' : 'scale 1/127', 400, y, 390, 95, col);
        geometryText(
          ctx,
          api,
          'raw code dot = ' + raw,
          1150,
          y + 35,
          33,
          themeColors.muted,
          'center',
        );
        api.focus.target('scale-aware-scores', () =>
          geometryText(
            ctx,
            api,
            q > 0.7 ? 'q × scale × code = ' + scaled.toFixed(3) : 'scale-aware score ?',
            1150,
            y + 145,
            38,
            q > 0.7 ? col : themeColors.muted,
            'center',
          ),
        );
      });
      geometryText(
        ctx,
        api,
        currentBeat === 0
          ? 'True floating scores: A 8, B 1; keep each coordinate’s scale'
          : q > 0.7
            ? 'Unscaled winner B → scale-aware winner A'
            : 'Restore the coordinate scales before choosing a winner',
        960,
        1030,
        32,
        themeColors.yellow,
        'center',
      );
    } else {
      const a = api.teaching.axes({
        x: 260,
        y: 390,
        width: 900,
        height: 490,
        xDomain: [-0.15, 1.3],
        yDomain: [-0.15, 1.3],
        xTicks: [],
        yTicks: [],
        equalUnits: true,
        xLabel: 'unit coordinate0',
        yLabel: 'unit coordinate1',
      });
      vector(ctx, api, a, [1, 0], themeColors.blue);
      vector(ctx, api, a, [0, 1], themeColors.pink);
      vector(ctx, api, a, robustUnit([1, 1]), themeColors.cyan, cueProgress());
      geometryText(
        ctx,
        api,
        'Reconstructed norms differ',
        1480,
        440,
        35,
        themeColors.muted,
        'center',
      );
      geometryText(ctx, api, 'Â=[8.031,0] · B̂=[0,1]', 1480, 580, 29, themeColors.muted, 'center');
      geometryText(ctx, api, 'cos(q,Â)=cos(q,B̂)=1/√2', 1480, 730, 31, themeColors.yellow, 'center');
      geometryText(
        ctx,
        api,
        'Inner product and cosine are different objectives',
        960,
        1030,
        32,
        themeColors.ink,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'scalar-scales',
  draw: drawScalarScales,
  cues: ['restore-scales'],
};
