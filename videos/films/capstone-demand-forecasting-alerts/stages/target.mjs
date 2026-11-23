import { lossDomain } from '../fixtures.mjs';
import { capacityBreakdown, capacityCurve, capacityLoss, sampleModel } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawTarget(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('target', state);
  {
    if (!modelState.b) {
      const requested = api.focus.target('requested-volume', () =>
        teaching.bars({
          x: 270,
          y: 420,
          width: 570,
          height: 350,
          values: [180],
          labels: ['Requested volume'],
          max: 200,
          color: themeColors.cyan,
          fontSize: 29,
          showValues: true,
        }),
      );
      api.focus.target('completed-volume', () =>
        teaching.bars({
          x: 1080,
          y: 420,
          width: 570,
          height: 350,
          values: [150],
          labels: ['Completed shipments'],
          max: 200,
          color: themeColors.blue,
          fontSize: 29,
          showValues: true,
        }),
      );
      api.focus.target('completed-volume', () => {
        api.line(ctx, 1080, 507.5, 1650, 507.5, themeColors.yellow, 3);
        text(ctx, api, 'Capacity limit: 150', 1365, 355, 30, themeColors.yellow, 'center');
      });
      text(
        ctx,
        api,
        'Supplied example · completed shipments can hide unserved demand',
        960,
        925,
        28,
        themeColors.muted,
        'center',
      );
      return;
    }
    const plot = teaching.axes({
      x: 260,
      y: 390,
      width: 1130,
      height: 400,
      xDomain: [80, 260],
      yDomain: lossDomain,
      xTicks: [100, 160, 240],
      yTicks: [0, 70, 140, 210],
      xLabel: 'capacity choice',
      yLabel: 'expected loss units',
      fontSize: 26,
    });
    const curve = capacityCurve();
    api.focus.target('loss-curve', () =>
      teaching.curve({
        plot,
        points: curve,
        color: themeColors.cyan,
        width: 5,
        progress: modelState.b ? 1 : modelState.p,
      }),
    );
    const a = modelState.b ? Math.round(api.lerp(100, 160, modelState.p)) : 100;
    api.focus.target('capacity-choice', () =>
      teaching.scatter({
        plot,
        points: [
          {
            x: a,
            y: capacityLoss(a),
            color: themeColors.yellow,
            radius: 14,
          },
        ],
      }),
    );
    api.focus.target('capacity-choice', () =>
      text(
        ctx,
        api,
        `Capacity ${a.toFixed(0)} · loss ${capacityLoss(a).toFixed(1)}`,
        960,
        285,
        34,
        themeColors.yellow,
        'center',
      ),
    );
    text(ctx, api, 'Weighted shortage / spare', 1460, 380, 25, themeColors.ink);
    capacityBreakdown(a).forEach((v, i) => {
      api.focus.target('cost-assumptions', () =>
        text(
          ctx,
          api,
          `${v.demand} parcels · ${(v.probability * 100).toFixed(0)}%`,
          1460,
          460 + i * 120,
          27,
          themeColors.cyan,
        ),
      );
      api.focus.target('cost-assumptions', () =>
        text(
          ctx,
          api,
          v.shortage ? `${v.shortage.toFixed(0)} short × 3` : `${v.spare.toFixed(0)} spare × 1`,
          1460,
          500 + i * 120,
          25,
          v.shortage ? themeColors.pink : themeColors.blue,
        ),
      );
      api.focus.target('cost-assumptions', () =>
        text(
          ctx,
          api,
          `Weighted loss ${v.contribution.toFixed(1)}`,
          1460,
          537 + i * 120,
          24,
          themeColors.yellow,
        ),
      );
    });
    api.focus.target('cost-quantile', () =>
      equation(ctx, api, String.raw`\tau=\frac{C_u}{C_u+C_o}=\frac3{3+1}=0.75`),
    );
  }
}
export default {
  id: 'target',
  draw: drawTarget,
  cues: ['target-b1-1', 'target-b1-2', 'target-b2-1', 'target-b2-2', 'target-b2-3'],
};
