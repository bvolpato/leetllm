// Scene 6: loss: "What does the height of a loss curve mean?"
// Twin glowing square-root penalty curves (2/sqrt(N) on left, 2/sqrt(D) on right) built
// term-by-term with MathJax glowTex, then sliding coupled gold beads along N*D = 100.
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
  cinemaAtmosphere,
  fmt,
  loss,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
} from '../parts.mjs';

export default function lossScene(s, c) {
  const title = heroTitle(['What does the height', 'of a loss curve mean?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tokens,
  });

  const introGlow = s.value(0); // sl-loss-0
  const floorVis = s.value(0); // sl-loss-1
  const capSweep = s.value(0); // loss-capacity
  const dataSweep = s.value(0); // loss-data
  const slideT = s.value(0); // sl-loss-2: N slides 5 -> 10, D falls 20 -> 10
  const showBeads = s.value(0);
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const cs = capSweep.value;
    const ds = dataSweep.value;
    const st = slideT.value;
    const sb = showBeads.value;
    const nVal = 5 + 5 * st;
    const dVal = 100 / nVal;

    const leftPlane = plotPlane({
      left: -790,
      right: -130,
      top: -120,
      bottom: 230,
      xDomain: [1, 40],
      yDomain: [0, 2.2],
      xTicks: [5, 10, 20, 40],
      yTicks: [0, 1, 2],
      xLabel: 'Parameters N',
      yLabel: 'Parameter penalty',
      opacity: alpha,
    });
    const rightPlane = plotPlane({
      left: 150,
      right: 810,
      top: -120,
      bottom: 230,
      xDomain: [1, 40],
      yDomain: [0, 2.2],
      xTicks: [5, 10, 20, 40],
      yTicks: [0, 1, 2],
      xLabel: 'Token presentations D',
      yLabel: 'Data penalty',
      opacity: alpha,
    });

    nodes.push(leftPlane.node, rightPlane.node);

    // Subtle preview framing before curves sweep
    if (floorVis.value < 0.1) {
      nodes.push(
        txt(
          'Same tokenizer & held-out text  ·  lower cross-entropy = higher log-probability',
          0,
          -255,
          28,
          introGlow.value > 0.3 ? ROLE.compute : COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    // Left curve: 2 / sqrt(N)
    if (cs > 0.02) {
      const ptsN = sampleCurve(leftPlane, (x) => 2 / Math.sqrt(x), 1, 1 + 39 * cs, 72);
      nodes.push(glowingTrail(ptsN, { color: ROLE.params, width: 4.5, glow: 11, opacity: alpha }));
    }
    // Right curve: 2 / sqrt(D)
    if (ds > 0.02) {
      const ptsD = sampleCurve(rightPlane, (x) => 2 / Math.sqrt(x), 1, 1 + 39 * ds, 72);
      nodes.push(glowingTrail(ptsD, { color: ROLE.tokens, width: 4.5, glow: 11, opacity: alpha }));
    }

    // Coupled sliding beads on fixed ND = 100
    if (sb > 0.02) {
      const pN = 2 / Math.sqrt(nVal);
      const pD = 2 / Math.sqrt(dVal);
      const [nx, ny] = leftPlane.toScreen(nVal, pN);
      const [dx, dy] = rightPlane.toScreen(dVal, pD);

      nodes.push(
        glowDot(nx, ny, { radius: 11, color: ROLE.compute, glow: 16, opacity: sb * alpha }),
        txt(
          `N = ${fmt(nVal, 1)}  ->  ${fmt(pN, 3)}`,
          nx + 24,
          ny - 36,
          28,
          ROLE.params,
          'mono',
          'left',
        )
          .glow(6, ROLE.params)
          .opacity(sb * alpha),
        glowDot(dx, dy, { radius: 11, color: ROLE.compute, glow: 16, opacity: sb * alpha }),
        txt(
          `D = ${fmt(dVal, 1)}  ->  ${fmt(pD, 3)}`,
          dx + 24,
          dy - 36,
          28,
          ROLE.tokens,
          'mono',
          'left',
        )
          .glow(6, ROLE.tokens)
          .opacity(sb * alpha),
        txt(
          `Fixed budget N·D = 100   ·   L = ${fmt(loss(nVal, dVal), 3)} nats`,
          0,
          380,
          34,
          ROLE.compute,
          'mono',
          'center',
        )
          .glow(8, ROLE.compute)
          .opacity(sb * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Hold one resource fixed to isolate the other shortage',
          0,
          380,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  const formulaEq = glowTex('L(N, D) = 1 + \\frac{2}{\\sqrt{N}} + \\frac{2}{\\sqrt{D}}', {
    x: 430,
    y: -355,
    size: 42,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, stageLayer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-loss-0', (d) => s.play(introGlow.to(1, { duration: d })), { dur: 0.7 });
  c.show('sl-loss-1', formulaEq);
  playCue(s, c, 'sl-loss-1', (d) => s.play(floorVis.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'loss-capacity', (d) => s.play(capSweep.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'loss-data', (d) => s.play(dataSweep.to(1, { duration: d })), { dur: 0.9 });
  playCue(
    s,
    c,
    'sl-loss-2',
    (d) => s.play(showBeads.to(1, { duration: Math.min(0.45, d) }), slideT.to(1, { duration: d })),
    { dur: 1.6 },
  );
}
