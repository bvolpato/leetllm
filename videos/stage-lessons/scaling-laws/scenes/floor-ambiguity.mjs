// Scene 16: floor-ambiguity: "How far can you trust two points?"
// Two exact observed anchors (1, 3.0) and (100, 2.5) fitted identically by alpha=0.1 and alpha=0.2,
// diverging to 1.985 vs 2.222 (0.237 nat gap) at C = 10^6, exposing floor/exponent entanglement.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  anchorFit,
  cinemaAtmosphere,
  fmt,
  playCue,
  plotPlane,
  sampleCurve,
} from '../parts.mjs';

export default function floorAmbiguity(s, c) {
  const title = heroTitle(['How far can you', 'trust two points?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.amber,
  });

  const fitA = anchorFit(0.1);
  const fitB = anchorFit(0.2);

  const anchorSpan = s.value(0); // sl-floor-ambiguity-0: 0 -> 2 (C=1..100)
  const extrapSpan = s.value(0); // sl-floor-ambiguity-1: 2 -> 6 (C=100..1e6)
  const probeVis = s.value(0); // sl-floor-ambiguity-2: highlight separation region at C=10^4

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const maxLogC = Math.max(0.08, 2 * anchorSpan.value + 4 * extrapSpan.value);
    const ext = extrapSpan.value;
    const pv = probeVis.value;

    const plane = plotPlane({
      left: -740,
      right: 650,
      top: -215,
      bottom: 240,
      xDomain: [0, 6],
      yDomain: [1.5, 3.12],
      xTicks: [0, 1, 2, 3, 4, 5, 6].map((e) => ({ v: e, label: `10^${e}` })),
      yTicks: [1.6, 2.0, 2.5, 3.0].map((v) => ({ v, label: fmt(v, 1) })),
      xLabel: 'Compute C (log₁₀ scale)',
      yLabel: 'Loss (nats)',
      opacity: alpha,
    });
    nodes.push(plane.node);

    // Draw both exact-anchor curves
    const ptsA = sampleCurve(plane, (x) => fitA.predict(10 ** x), 0, maxLogC, 80);
    const ptsB = sampleCurve(plane, (x) => fitB.predict(10 ** x), 0, maxLogC, 80);
    nodes.push(
      glowingTrail(ptsA, { color: ROLE.params, width: 4.5, glow: 11, opacity: alpha }),
      glowingTrail(ptsB, { color: ROLE.tokens, width: 4.5, glow: 11, opacity: alpha }),
    );

    // Exact observed anchor dots at (1, 3.0) and (100, 2.5)
    for (const [lx, lv, lbl] of [
      [0, 3.0, '(1, 3.0)'],
      [2, 2.5, '(100, 2.5)'],
    ]) {
      const [sx, sy] = plane.toScreen(lx, lv);
      nodes.push(
        glowDot(sx, sy, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }),
        txt(lbl, sx + 18, sy - 30, 28, ROLE.compute, 'mono', 'left')
          .glow(6, ROLE.compute)
          .opacity(alpha),
      );
    }

    // Forecast endpoints at C = 10^6 once extrapolated
    if (ext > 0.85) {
      const fa = Math.min(1, (ext - 0.85) / 0.15) * alpha;
      const yA = fitA.predict(1e6);
      const yB = fitB.predict(1e6);
      const [xA, syA] = plane.toScreen(6, yA);
      const [xB, syB] = plane.toScreen(6, yB);

      nodes.push(
        line([xA, syA], [xB, syB], { stroke: ROLE.cap, width: 4 }).opacity(fa),
        glowDot(xA, syA, { radius: 10, color: ROLE.params, glow: 14, opacity: fa }),
        glowDot(xB, syB, { radius: 10, color: ROLE.tokens, glow: 14, opacity: fa }),
        txt(fmt(yA, 3), xA + 22, syA, 32, ROLE.params, 'mono', 'left')
          .glow(6, ROLE.params)
          .opacity(fa),
        txt(fmt(yB, 3), xB + 22, syB, 32, ROLE.tokens, 'mono', 'left')
          .glow(6, ROLE.tokens)
          .opacity(fa),
        txt(
          `α = 0.1  ·  E = ${fmt(fitA.e, 3)}`,
          -420,
          355,
          28,
          ROLE.params,
          'mono',
          'center',
        ).opacity(fa),
        txt(
          `α = 0.2  ·  E = ${fmt(fitB.e, 3)}`,
          420,
          355,
          28,
          ROLE.tokens,
          'mono',
          'center',
        ).opacity(fa),
      );
    }

    // Beat 2: Mark the intermediate separation probe at C = 10^4
    if (pv > 0.05) {
      const px = plane.toX(4);
      const syA4 = plane.toY(fitA.predict(1e4));
      const syB4 = plane.toY(fitB.predict(1e4));
      nodes.push(
        line([px, syA4], [px, syB4], { stroke: ROLE.optimal, width: 4.5 }).opacity(pv * alpha),
        glowDot(px, (syA4 + syB4) / 2, {
          radius: 9,
          color: ROLE.optimal,
          glow: 14,
          opacity: pv * alpha,
        }),
        txt(
          'Measure next here (10⁴)',
          px,
          plane.bounds.top - 34,
          28,
          ROLE.optimal,
          'mono',
          'center',
        )
          .glow(6, ROLE.optimal)
          .opacity(pv * alpha),
        txt(
          `0.237 nat gap measures assumption choice, not run variance`,
          0,
          410,
          28,
          ROLE.amber,
          'sans',
          'center',
        )
          .glow(6, ROLE.amber)
          .opacity(pv * alpha),
      );
    }

    return nodes;
  });

  const eq = glowTex('L(C) = E + K C^{-\\alpha}', {
    x: 500,
    y: -365,
    size: 40,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.amber, ROLE.tokens), title, stageLayer, eq);

  playCue(s, c, 'sl-floor-ambiguity-0', (d) => s.play(anchorSpan.to(1, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'sl-floor-ambiguity-1', (d) => s.play(extrapSpan.to(1, { duration: d })), {
    dur: 1.8,
  });
  playCue(s, c, 'sl-floor-ambiguity-2', (d) => s.play(probeVis.to(1, { duration: d })), {
    dur: 0.9,
  });
}
