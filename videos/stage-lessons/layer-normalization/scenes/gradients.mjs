// Scene 7: gradients: "Trace a change back through the fork"
// Glowing 2D probe cancellation vector plane paired with Pre-LN vs Post-LN Jacobian equations
// and backward gradient-flow ribbons. Shows how the additive identity I provides a direct route,
// yet an adversarial branch F(z) = -s_0 z can still cancel a probe back to [0, 0, 0, 0].
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
  branch,
  cinemaAtmosphere,
  coordPlane,
  direction,
  fmt,
  glowRing,
  glowVector,
  playBeat,
  playCue,
  scale,
} from '../parts.mjs';

export default function gradients(s, c) {
  const title = heroTitle(['Trace a change back', 'through the fork'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.stream,
  });

  const idGlow = s.value(0); // highlights additive identity vector I * v
  const branchCancel = s.value(0); // 0 -> 1 drives branch vector [-2, 2, 1, -1] back to origin
  const measureNote = s.value(0); // beat 2: measure actual gradients & updates across depth
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ig = idGlow.value;
    const bc = branchCancel.value;
    const mn = measureNote.value;

    // LEFT/CENTER: 2D equal-unit vector plane for probe components 1 and 2
    const plane = coordPlane({
      originX: -390,
      originY: 45,
      scaleX: 112,
      scaleY: 112,
      xMin: -3,
      xMax: 3,
      yMin: -3,
      yMax: 3,
      stepX: 1,
      stepY: 1,
      xTicks: [-2, 0, 2],
      yTicks: [-2, 0, 2],
      xLabel: 'probe component 1',
      yLabel: 'probe component 2',
      opacity: alpha,
    });
    nodes.push(plane.node);

    const origin = plane.toScreen(0, 0);
    const idTip = plane.toScreen(direction[0], direction[1]); // (2, -2)
    const curX = direction[0] + bc * branch[0];
    const curY = direction[1] + bc * branch[1];
    const sumTip = plane.toScreen(curX, curY);

    // Origin target ring
    nodes.push(
      glowRing(origin[0], origin[1], 16, ROLE.gold, {
        width: 2.2,
        glow: 6,
        fillOpacity: 0.08,
        opacity: (0.4 + 0.55 * bc) * alpha,
      }),
    );

    // Blue identity vector I * v from (0, 0) to (2, -2)
    nodes.push(
      glowVector(origin, idTip, {
        color: ROLE.stream,
        width: 5.5 + ig * 2,
        tipSize: 19,
        glow: 10 + ig * 6,
        opacity: alpha,
        dotRadius: 7,
      }),
    );

    // Adversarial canceling branch vector from (2, -2) back toward (0, 0)
    if (bc > 0.02) {
      nodes.push(
        glowVector(idTip, sumTip, {
          color: ROLE.alert,
          width: 4.5,
          tipSize: 17,
          glow: 12,
          opacity: alpha,
          dotRadius: 6,
        }),
      );
    }

    // Golden resultant photon tracking the tip sum
    nodes.push(
      glowDot(sumTip[0], sumTip[1], {
        radius: 10,
        color: ROLE.gold,
        glow: 16,
        opacity: alpha,
      }),
    );

    // Subtle backward-signal ribbon on right connecting the two Jacobian views
    const rx = 435;
    nodes.push(
      glowingTrail(
        [
          [rx - 260, -135],
          [rx + 260, -135],
        ],
        { color: ROLE.stream, width: 2.6, glow: 7, core: false, opacity: 0.68 * alpha },
      ),
    );

    // Right panel captions & live vector telemetry
    nodes.push(
      txt('Pre-LN: direct identity skip I', rx, -285, 30, ROLE.stream, 'sans', 'center')
        .glow(ig > 0.2 ? 7 : 0, ROLE.stream)
        .opacity(alpha),
      txt('Post-LN: outer norm wraps skip', rx, -58, 30, ROLE.rms, 'sans', 'center').opacity(alpha),
      txt(
        `F(z) = -s₀ z   ·   s₀ = √(2.5 + ε) ≈ ${fmt(scale, 3)}`,
        rx,
        130,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Identity   I · v = [2, -2, -1, 1]', rx, 200, 30, ROLE.stream, 'mono', 'center').opacity(
        alpha,
      ),
    );

    if (bc > 0.05) {
      nodes.push(
        txt('Branch   J_F J_LN v = [-2, 2, 1, -1]', rx, 258, 30, ROLE.alert, 'mono', 'center')
          .glow(6, ROLE.alert)
          .opacity(Math.min(1, bc * 2) * alpha),
      );
    }
    if (bc > 0.9) {
      nodes.push(
        txt('Total = [0, 0, 0, 0]   (exact cancellation)', rx, 320, 32, ROLE.gold, 'mono', 'center')
          .glow(9, ROLE.gold)
          .opacity(((bc - 0.9) / 0.1) * alpha),
      );
    }

    if (mn > 0.05) {
      nodes.push(
        txt(
          'Measure actual gradients & parameter updates at each depth',
          rx,
          392,
          28,
          ROLE.norm,
          'sans',
          'center',
        )
          .glow(5, ROLE.norm)
          .opacity(mn * alpha),
      );
    }

    return nodes;
  });

  const preEq = glowTex('J_{\\text{pre}} = I + J_F J_{\\text{LN}}', {
    x: 435,
    y: -210,
    size: 46,
    color: ROLE.stream,
  });
  const postEq = glowTex('J_{\\text{post}} = J_{\\text{LN}}(I + J_F)', {
    x: 435,
    y: 22,
    size: 44,
    color: ROLE.rms,
  });

  s.add(cinemaAtmosphere(ROLE.stream, ROLE.alert), title, mainLayer, preEq, postEq);

  // Beat 0: Emphasize additive identity route
  playCue(
    s,
    c,
    'gradients-identity-gradient-vector-b1-1',
    (d) => s.play(idGlow.to(1, { duration: d })),
    { dur: 0.65 },
  );

  // Beat 1: Adversarial branch cancels probe back to origin
  playCue(
    s,
    c,
    'gradients-branch-gradient-vector-b2-1',
    (d) => s.play(branchCancel.to(1, { duration: d })),
    { dur: 0.95 },
  );

  // Beat 2: Diagnostic measurement guidance
  playBeat(s, c, 2, (d) => s.play(measureNote.to(1, { duration: d })), { offset: 0.3, dur: 0.6 });
}
