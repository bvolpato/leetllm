import { featureFrame, lagRoute } from '../model.mjs';
import {
  drawFeatureConstructionArrow,
  drawFeatureConstructionBox,
  drawFeatureConstructionHead,
  drawFeatureConstructionL,
  drawFeatureConstructionNote,
  drawFeatureConstructionStage,
  drawFeatureConstructionText,
} from '../defaults.mjs';
export function drawStoreAndFreshness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = featureFrame(state),
    currentBeat = f.b,
    progress = f.p,
    show = (id, beat) => f.started(id, beat),
    done = (id, beat) => f.completed(id, beat),
    prog = (id, beat) => f.progress(id, beat);
  drawFeatureConstructionStage(ctx, api, 'store-and-freshness-operation', () => {
    if (currentBeat === 0) {
      drawFeatureConstructionHead(
        ctx,
        api,
        'Historical replay and current retrieval require different evidence',
      );
      drawFeatureConstructionBox(
        ctx,
        api,
        'registry: definitions + versions',
        960,
        365,
        850,
        80,
        themeColors.yellow,
      );
      const updated = done('feature-store-overwrite', 0);
      for (const [i, label] of [
        'offline: versioned history',
        'online: latest per entity',
      ].entries()) {
        const x = 460 + i * 1000;
        drawFeatureConstructionBox(
          ctx,
          api,
          label,
          x,
          550,
          760,
          95,
          i ? themeColors.pink : themeColors.blue,
          31,
        );
        drawFeatureConstructionArrow(
          ctx,
          api,
          960 + (i ? 180 : -180),
          410,
          x,
          490,
          i ? themeColors.pink : themeColors.blue,
        );
      }
      drawFeatureConstructionText(
        ctx,
        api,
        'J-204 latest backlog   ' + (updated ? 30 : 18),
        1450,
        730,
        32,
        themeColors.pink,
        'center',
      );
      drawFeatureConstructionText(
        ctx,
        api,
        'J-204 source at 09:00   18',
        470,
        730,
        32,
        themeColors.blue,
        'center',
      );
      if (show('feature-store-generation', 0))
        drawFeatureConstructionText(
          ctx,
          api,
          'verify generation + backend capabilities and migration status',
          960,
          900,
          31,
          themeColors.yellow,
          'center',
        );
      drawFeatureConstructionNote(
        ctx,
        api,
        'Replay needs the serving capture or versioned source history.',
      );
    } else if (currentBeat === 1) {
      drawFeatureConstructionHead(ctx, api, 'Feature age differs from feed freshness');
      const pos = prog('feature-store-watermark', 1);
      drawFeatureConstructionL(ctx, api, 270, 590, 1650, 590, themeColors.muted, 3);
      drawFeatureConstructionText(
        ctx,
        api,
        'heartbeat event 08:00',
        400,
        470,
        32,
        themeColors.blue,
        'center',
      );
      drawFeatureConstructionText(
        ctx,
        api,
        'prediction 10:00',
        1500,
        470,
        32,
        themeColors.yellow,
        'center',
      );
      api.circle(ctx, 400, 590, 15, themeColors.blue);
      api.circle(ctx, 1500, 590, 15, themeColors.yellow);
      const x = 700 + 800 * pos;
      api.circle(ctx, x, 590, 15, themeColors.cyan);
      drawFeatureConstructionText(
        ctx,
        api,
        'feed watermark',
        x,
        700,
        29,
        themeColors.cyan,
        'center',
      );
      drawFeatureConstructionText(
        ctx,
        api,
        done('feature-store-watermark', 1)
          ? 'heartbeat age 2 h · feed can still be fully caught up'
          : 'Feature-age calculation pending',
        960,
        870,
        36,
        done('feature-store-watermark', 1) ? themeColors.green : themeColors.muted,
        'center',
      );
      drawFeatureConstructionNote(
        ctx,
        api,
        'Check nulls, unknown categories, lag and parity separately.',
      );
    } else {
      drawFeatureConstructionHead(ctx, api, 'Supplied lag policy · exact boundaries');
      const plot = api.teaching.axes({
        x: 270,
        y: 500,
        width: 1300,
        height: 170,
        xDomain: [0, 60],
        yDomain: [0, 1],
        xTicks: [0, 15, 45, 60],
        yTicks: [],
        xLabel: 'valid numeric lag · minutes',
        fontSize: 25,
      });
      for (const [a, z, c] of [
        [0, 15, themeColors.green],
        [15, 45, themeColors.yellow],
        [45, 60, themeColors.pink],
      ]) {
        const q = plot.point(a, 0),
          r = plot.point(z, 0);
        api.rect(ctx, q.x, 540, r.x - q.x, 80, c);
      }
      drawFeatureConstructionText(ctx, api, 'lag ≤ 15   normal', 430, 400, 32, themeColors.green, 'center');
      drawFeatureConstructionText(
        ctx,
        api,
        '15 < lag ≤ 45   fallback',
        960,
        400,
        32,
        themeColors.yellow,
        'center',
      );
      drawFeatureConstructionText(
        ctx,
        api,
        'lag > 45   abstain',
        1460,
        400,
        32,
        themeColors.pink,
        'center',
      );
      const beyond = show('feature-lag-over45', 2),
        lag = beyond ? 45.1 : 45,
        q = plot.point(lag, 0),
        ready = done(beyond ? 'feature-lag-over45' : 'feature-lag-route', 2);
      api.circle(ctx, q.x, 760, 15, themeColors.cyan);
      drawFeatureConstructionText(
        ctx,
        api,
        lag + ' min → ' + (ready ? lagRoute(lag) : '?'),
        960,
        840,
        37,
        themeColors.cyan,
        'center',
      );
      if (done('feature-lag-invalid', 2))
        drawFeatureConstructionText(
          ctx,
          api,
          'Boolean, nonnumeric, negative or nonfinite lag → abstain',
          960,
          955,
          30,
          themeColors.pink,
          'center',
        );
      drawFeatureConstructionNote(
        ctx,
        api,
        'Fallback needs trustworthy independent inputs; this fixture sends no production alert.',
      );
    }
  });
}
export default {
  id: 'store-and-freshness',
  draw: drawStoreAndFreshness,
  cues: [
    'store-and-freshness-0',
    'feature-store-overwrite',
    'feature-store-generation',
    'store-and-freshness-1',
    'feature-store-watermark',
    'store-and-freshness-2',
    'feature-lag-route',
    'feature-lag-invalid',
    'feature-lag-over45',
  ],
};
