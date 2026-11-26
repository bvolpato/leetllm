// Scene 11: deepnorm: "Where do the two DeepNorm scales act?"
// Signature 3D depth-scaling manifold (cinematic3d + orbitScene) plotting alpha=(2N)^(1/4) and
// beta=(8N)^(-1/4) paired with a 2-act swapVis left stage:
//   Act 1 (Beat 0): N=16 Post-LN residual scaling (alpha * x + branch -> LayerNorm).
//   Act 2 (Beat 1): Initialization-only weight shrinkage beta on FFN & Attn V/O (Q/K gain 1),
//     plus trained-write showing full +2 added at forward time with NO extra runtime beta!
import { curve3d, gridPlane3d, point3d, surface } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  deepNormTrace,
  fmt,
  lumBar,
  playBeat,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function deepnorm(s, c) {
  const dn = deepNormTrace(16); // alpha ≈ 2.378, beta ≈ 0.297

  const title = heroTitle(['Where do the two', 'DeepNorm scales act?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.amber,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const addBranchT = s.value(0); // beat 0: adds branch to alpha * skip
  const shrinkBetaT = s.value(0); // beat 1: shrinks init weight bar from 1 -> beta
  const trainedVis = s.value(0); // beat 1 trained-write cue: +2 enters sum directly

  // Right-side 3D DeepNorm depth-scaling surface & trajectories across log-depth
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 15.2,
    unit: 96,
    focus: [0, 0, 0.75],
  }).at(485, -35);

  const floor = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.4, 2.4],
    z: 0,
    step: 1,
    color: '#25355c',
    opacity: 0.45,
  });

  // Smooth glowing surface blending from beta (front y=-2) up to alpha (back y=+2) as depth grows
  const scaleSurf = surface(
    (u, v) => {
      const depth = Math.pow(10, ((u + 2.8) / 5.6) * 3); // 1 .. 1000 layers
      const alphaN = Math.pow(2 * depth, 0.25) * 0.46; // scaled cleanly into z=[0..3.1]
      const betaN = Math.pow(8 * depth, -0.25) * 1.4;
      const blend = (v + 2.4) / 4.8;
      return betaN * (1 - blend) + alphaN * blend;
    },
    {
      x: [-2.8, 2.8],
      y: [-2.4, 2.4],
      steps: 16,
      colors: [ROLE.rms, ROLE.stream, ROLE.amber, ROLE.gold],
      opacity: 0.72,
      wireframe: true,
      wireColor: '#7a95cf',
      wireOpacity: 0.28,
    },
  );

  const alphaCurve = curve3d(
    (u) => {
      const depth = Math.pow(10, ((u + 2.8) / 5.6) * 3);
      return [u, 2.4, Math.pow(2 * depth, 0.25) * 0.46 + 0.08];
    },
    -2.8,
    2.8,
    { color: ROLE.gold, width: 4.5, glow: 10 },
  );

  const betaCurve = curve3d(
    (u) => {
      const depth = Math.pow(10, ((u + 2.8) / 5.6) * 3);
      return [u, -2.4, Math.pow(8 * depth, -0.25) * 1.4 + 0.08];
    },
    -2.8,
    2.8,
    { color: ROLE.rms, width: 4.5, glow: 10 },
  );

  // N=16 highlight beacons on the 3D manifold
  const u16 = (Math.log10(16) / 3) * 5.6 - 2.8;
  const ptAlpha16 = point3d([u16, 2.4, Math.pow(32, 0.25) * 0.46 + 0.1], {
    color: ROLE.gold,
    radius: 7,
    glow: 14,
  });
  const ptBeta16 = point3d([u16, -2.4, Math.pow(128, -0.25) * 1.4 + 0.1], {
    color: ROLE.rms,
    radius: 7,
    glow: 14,
  });

  view3d.add(floor, scaleSurf, alphaCurve, betaCurve, ptAlpha16, ptBeta16);

  // ACT 1 (Left): N=16 Forward Residual Scaling (alpha * x + branch -> LN)
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const ab = addBranchT.value;
    const baseY = 175;
    const barScale = 9.4;

    nodes.push(
      txt(
        `16-layer decoder   ·   Post-LN   ·   α = ${fmt(dn.alpha, 3)}`,
        -835,
        -245,
        30,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(6, ROLE.gold)
        .opacity(alpha),
    );

    dn.skip.forEach((sv, i) => {
      const cx = -715 + i * 215;
      const sumVal = sv + ab * dn.branch[i];
      const skipH = Math.max(14, sv * barScale);
      const brH = ab > 0.05 ? Math.max(10, dn.branch[i] * barScale * ab) : 0;
      const topOfStack = baseY - skipH - (brH > 0 ? brH + 4 : 0);

      nodes.push(
        lumBar(cx, baseY - skipH / 2, 110, skipH, {
          color: ROLE.stream,
          fillOpacity: 0.4,
          strokeWidth: 2.5,
          glow: 9,
          opacity: alpha,
        }),
        txt(fmt(sv, 2), cx, topOfStack - 36, 26, ROLE.stream, 'mono', 'center').opacity(alpha),
      );
      if (brH > 0) {
        nodes.push(
          lumBar(cx, baseY - skipH - brH / 2 - 4, 110, brH, {
            color: ROLE.rms,
            fillOpacity: 0.55,
            strokeWidth: 2.4,
            glow: 9,
            opacity: ab * alpha,
          }),
          txt(`+${fmt(dn.branch[i], 2)}`, cx, baseY + 34, 26, ROLE.rms, 'mono', 'center').opacity(
            ab * alpha,
          ),
        );
      }
      nodes.push(
        txt(
          `f${i + 1}: ${fmt(sumVal, 2)}`,
          cx,
          baseY + 80,
          26,
          ROLE.gold,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        `LN(α·x + G(x)) = [${dn.output.map((v) => fmt(v, 2)).join(', ')}]`,
        -835,
        370,
        30,
        ROLE.norm,
        'mono',
        'left',
      )
        .glow(6, ROLE.norm)
        .opacity((0.35 + 0.65 * ab) * alpha),
    );

    return nodes;
  });

  // ACT 2 (Left): Initialization-only beta shrinkage + trained-write forward check
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const sb = shrinkBetaT.value;
    const tw = trainedVis.value;
    const barLeft = -820;
    const fullW = 540;
    const curW = fullW * (1 - sb + sb * dn.beta);

    nodes.push(
      txt(
        `Init-only gain  β = (8N)^(-1/4) ≈ ${fmt(dn.beta, 3)}`,
        barLeft,
        -225,
        32,
        ROLE.rms,
        'mono',
        'left',
      )
        .glow(7, ROLE.rms)
        .opacity(alpha),
      txt('FFN + Attention V / O weights', barLeft, -155, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha,
      ),
      // Ghost 1.0 init scale
      lumBar(barLeft + fullW / 2, -85, fullW, 64, {
        color: COSMOS.dim,
        fillOpacity: 0.1,
        strokeWidth: 1.8,
        glow: 2,
        opacity: 0.6 * alpha,
      }),
      // Shrunk beta scale
      lumBar(barLeft + curW / 2, -85, curW, 64, {
        color: ROLE.rms,
        fillOpacity: 0.48,
        strokeWidth: 2.8,
        glow: 11,
        opacity: alpha,
      }),
      txt(
        `β = ${fmt(1 - sb + sb * dn.beta, 3)}`,
        barLeft + fullW + 26,
        -85,
        30,
        ROLE.rms,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `Weight variance multiplier β² ≈ ${fmt(dn.beta ** 2, 4)}`,
        barLeft,
        -12,
        28,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'Attention Q / K weights keep gain = 1.0',
        barLeft,
        44,
        28,
        ROLE.write,
        'mono',
        'left',
      ).opacity(alpha),
    );

    if (tw > 0.05) {
      nodes.push(
        txt('Trained branch writes +2', barLeft, 265, 30, ROLE.gold, 'mono', 'left')
          .glow(7, ROLE.gold)
          .opacity(tw * alpha),
        txt('Add full +2 directly (no runtime β!)', barLeft, 314, 28, ROLE.norm, 'mono', 'left')
          .glow(5, ROLE.norm)
          .opacity(tw * alpha),
      );
    }

    nodes.push(
      txt(
        'Preserve init + warmup schedule  ·  encoder-decoder uses its own α, β',
        -835,
        390,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Right 3D captions
  const rightCaption = guardedDynamic(s.value(1), (alpha) => [
    txt('3D Depth Scaling: N = 1 .. 1000', 485, -350, 30, ROLE.gold, 'mono', 'center').opacity(
      alpha,
    ),
    txt(
      'α rises (gold)   ·   β shrinks (violet)',
      485,
      330,
      28,
      COSMOS.muted,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  const forwardEq = glowTex('x_{l+1} = \\operatorname{LN}(\\alpha x_l + G_l(x_l))', {
    x: -465,
    y: 165,
    size: 40,
    color: ROLE.norm,
  });

  s.add(cinemaAtmosphere(ROLE.amber, ROLE.rms), title, view3d, rightCaption, act1Layer, act2Layer);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.15, phi: 0.94, distance: 14.5 },
    { startOffset: 0.15, endMargin: 0.55 },
  );

  // Beat 0: Add branch onto alpha * skip
  playBeat(s, c, 0, (d) => s.play(addBranchT.to(1, { duration: d })), { offset: 1.6, dur: 1.2 });

  // Beat 1: Swap left panel to initialization beta view + show equation AFTER act1 fades out
  c.show(1, forwardEq, { lead: -0.35 });
  playBeat(s, c, 1, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.6 });
  playBeat(s, c, 1, (d) => s.play(shrinkBetaT.to(1, { duration: d })), { offset: 0.7, dur: 0.9 });
  playCue(s, c, 'trained-write', (d) => s.play(trainedVis.to(1, { duration: d })), { dur: 0.55 });
}
