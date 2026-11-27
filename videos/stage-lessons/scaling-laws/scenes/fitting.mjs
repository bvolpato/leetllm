// Scene 13: fitting: "Where would you run the next experiment?"
// Full-stage glowing proxy loss profile: 9 proxy dots on ND=100 -> fitted curve ->
// extrapolated ND=400 curve -> forecast (1.90) vs held-out observation (2.02) -> +0.12 residual.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, loss, playCue, plotPlane, sampleCurve } from '../parts.mjs';

const PROXY_RUNS = [2, 4, 6, 8, 10, 14, 20, 30, 40].map((n, i) => ({
  n,
  l: loss(n, 100 / n) + 0.025 * Math.sin(i * 3),
}));

export default function fitting(s, c) {
  const title = heroTitle(['Where would you run', 'the next experiment?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.params,
  });

  const forecast = loss(25, 16); // 1.90
  const observed = 2.02;

  const dotsProg = s.value(0); // fitting-b1-1
  const fitSweep = s.value(0); // fitting-b2-1
  const bigSweep = s.value(0); // fitting-forecast
  const showForecastPt = s.value(0); // AFTER fitting-forecast
  const showObs = s.value(0); // AFTER fitting-observed
  const showResid = s.value(0); // AFTER fitting-residual
  const holdoutPulse = s.value(0); // fitting-b3-1

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const dp = dotsProg.value;
    const fs = fitSweep.value;
    const bs = bigSweep.value;
    const sf = showForecastPt.value;
    const so = showObs.value;
    const sr = showResid.value;

    const plane = plotPlane({
      left: -740,
      right: 680,
      top: -215,
      bottom: 245,
      xDomain: [2, 40],
      yDomain: [1.7, 3.12],
      xTicks: [10, 20, 30, 40],
      yTicks: [1.9, 2.3, 2.7, 3.0],
      xLabel: 'Parameter units N',
      yLabel: 'Loss (nats / token)',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Proxy run dots on ND = 100
    const dotCount = Math.max(
      1,
      Math.min(PROXY_RUNS.length, Math.round(1 + dp * (PROXY_RUNS.length - 1))),
    );
    for (let i = 0; i < dotCount; i++) {
      const r = PROXY_RUNS[i];
      const [sx, sy] = plane.toScreen(r.n, r.l);
      nodes.push(glowDot(sx, sy, { radius: 8.5, color: ROLE.params, glow: 12, opacity: alpha }));
    }

    // Small-budget fitted curve ND = 100
    if (fs > 0.02) {
      const pts100 = sampleCurve(plane, (x) => loss(x, 100 / x), 2, 2 + 38 * fs, 72);
      nodes.push(
        glowingTrail(pts100, { color: ROLE.params, width: 4.2, glow: 10, opacity: alpha }),
      );
      if (fs > 0.6) {
        nodes.push(
          txt('Fit: N·D = 100', 180, -255, 28, ROLE.params, 'mono', 'right')
            .glow(5, ROLE.params)
            .opacity(fs * alpha),
        );
      }
    }

    // Larger-budget forecast curve ND = 400
    if (bs > 0.02) {
      const pts400 = sampleCurve(plane, (x) => loss(x, 400 / x), 2, 2 + 38 * bs, 72);
      nodes.push(
        glowingTrail(pts400, { color: ROLE.tokens, width: 4.6, glow: 12, opacity: alpha }),
      );
      if (bs > 0.6) {
        nodes.push(
          txt('Extrapolation: N·D = 400', 680, -255, 28, ROLE.tokens, 'mono', 'right')
            .glow(6, ROLE.tokens)
            .opacity(bs * alpha),
        );
      }
    }

    const [fx, fy] = plane.toScreen(25, forecast);
    const [ox, oy] = plane.toScreen(25, observed);

    if (sf > 0.05) {
      nodes.push(
        glowDot(fx, fy, { radius: 10, color: ROLE.tokens, glow: 16, opacity: sf * alpha }),
        txt(
          `Forecast ${fmt(forecast, 2)} (25×16)`,
          fx + 22,
          fy + 38,
          28,
          ROLE.tokens,
          'mono',
          'left',
        )
          .glow(6, ROLE.tokens)
          .opacity(sf * alpha),
      );
    }

    if (so > 0.05) {
      nodes.push(
        line([fx, fy], [ox, oy], { stroke: ROLE.compute, width: 4.2 }).opacity(so * alpha),
        glowDot(ox, oy, {
          radius: 10 + 2 * holdoutPulse.value,
          color: ROLE.compute,
          glow: 16,
          opacity: so * alpha,
        }),
        txt(`Observed ${fmt(observed, 2)}`, ox - 24, oy - 30, 30, ROLE.compute, 'mono', 'right')
          .glow(7, ROLE.compute)
          .opacity(so * alpha),
      );
    }

    const footer =
      sr > 0.5
        ? `Observed − forecast = +${fmt(observed - forecast, 2)} nats/token  ·  challenge extrapolation with held-out runs`
        : bs > 0.2
          ? 'Larger budget N × D = 400  ·  testing the fitted curve out of sample'
          : 'Illustrative proxy runs at matched cosine schedules  (N × D = 100)';
    nodes.push(
      txt(footer, 0, 385, 28, sr > 0.5 ? ROLE.compute : COSMOS.muted, 'sans', 'center')
        .glow(sr > 0.5 ? 7 : 0, ROLE.compute)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.compute), title, stageLayer);

  playCue(s, c, 'fitting-b1-1', (d) => s.play(dotsProg.to(1, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'fitting-b2-1', (d) => s.play(fitSweep.to(1, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'fitting-forecast', (d) => s.play(bigSweep.to(1, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'fitting-forecast', (d) => s.play(showForecastPt.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'fitting-observed', (d) => s.play(showObs.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fitting-residual', (d) => s.play(showResid.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fitting-b3-1', (d) => s.play(holdoutPulse.to(1, { duration: d })), { dur: 0.6 });
}
