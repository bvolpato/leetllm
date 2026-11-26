// Act 2: Two-Dial Gradient Vector (3D Loss Surface + Coordinate Probes), Contour Geometry,
// Gradient Descent Update Step, Step-Size Limits, and Stability & Unit Scaling.
import {
  Node,
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  group,
  line,
  line3d,
  point3d,
  rect,
  scalarField,
  surface,
} from 'vizmatic/stage';
import { cinematic3d, orbitScene } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  aura,
  cinemaGrid,
  cueTo,
  derivativeLoss,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  latencyExample,
  livingDrift,
  makePlot2d,
  markDecor,
  polyPath,
  pulseCue,
  twoWeightSurfaceZ,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. gradient-vector: Two dials, two separate questions (3D Loss Valley + Probes!)
// Cues: prompt-probe, partial-sensitivity, queue-probe, queue-partial-cue,
//       prompt-slope, queue-slope, combine-gradient
// ---------------------------------------------------------------------------
export function gradientVector(s, c) {
  const probeMode = s.value(0); // 0=prompt slice, 1=queue slice, 2=combined gradient
  const promptOffset = s.value(0);
  const queueOffset = s.value(0);
  const promptAns = s.value(0);
  const queueAns = s.value(0);
  const combineP = s.value(0);
  const drift = s.value(0);

  s.add(aura(260, 0, 560, '#2a588a2c', '#151e3d12'));
  s.add(aura(-520, 80, 420, '#ffd1661c', '#18142a10'));

  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.0,
    distance: 14.4,
    unit: 130,
    ambient: 0.4,
    shine: 0.42,
    brightness: 1.15,
    fog: 0.08,
    focus: [0, 0, 0.85],
  }).at(260, 20);

  const HALF = 2.4;
  const mapWp = (u) => 2.0 + u * 0.45;
  const mapWq = (v) => 2.0 + v * 0.65;
  const invU = (wp) => (wp - 2.0) / 0.45;
  const invV = (wq) => (wq - 2.0) / 0.65;

  const lossSurf = surface((u, v) => twoWeightSurfaceZ(mapWp(u), mapWq(v)), {
    x: [-HALF, HALF],
    y: [-HALF, HALF],
    resolution: [44, 44],
    colors: ['#0a2e38', '#155e75', '#2a588a', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'],
    mesh: '#80ecff',
    meshOpacity: 0.16,
    meshWidth: 0.55,
    opacity: 0.88,
  });

  // Coordinate slice curve along prompt weight w_p (holding w_q = 2)
  const promptSlice = curve3d((u) => [u, 0, twoWeightSurfaceZ(mapWp(u), 2.0) + 0.09], -HALF, HALF, {
    samples: 44,
    color: COSMOS.blue,
    width: 4.2,
    glow: 10,
    blend: 'screen',
    onTop: true,
  });

  // Coordinate slice curve along queue weight w_q (holding w_p = 2)
  const queueSlice = curve3d((v) => [0, v, twoWeightSurfaceZ(2.0, mapWq(v)) + 0.09], -HALF, HALF, {
    samples: 44,
    color: COSMOS.cyan,
    width: 4.2,
    glow: 10,
    blend: 'screen',
    onTop: true,
  });

  // Current base point (w_p=2, w_q=2) -> (u=0, v=0), L=1
  const baseZ = twoWeightSurfaceZ(2.0, 2.0);
  const basePt = point3d([0, 0, baseZ + 0.14], {
    color: '#ffffff',
    radius: 8.5,
    glow: 15,
    blend: 'screen',
    onTop: true,
  });

  // Live probe particle sliding along whichever coordinate is being probed
  const probePt = point3d(
    () => {
      const wp = 2.0 + promptOffset.value * 0.45;
      const wq = 2.0 + queueOffset.value * 0.65;
      return [invU(wp), invV(wq), twoWeightSurfaceZ(wp, wq) + 0.16];
    },
    { color: COSMOS.gold, radius: 8, glow: 15, blend: 'screen', onTop: true },
  );

  // Glowing 3D partial vectors + combined steepest-ascent gradient arrow on tangent plane!
  const vecPrompt3d = line3d(
    [0, 0, baseZ + 0.14],
    () => [1.35 * Math.max(0.05, promptAns.value), 0, baseZ + 0.14 + 0.55 * promptAns.value],
    { color: COSMOS.blue, width: 5.5, glow: 12, blend: 'screen', onTop: true },
  );
  const vecQueue3d = line3d(
    [0, 0, baseZ + 0.14],
    () => [0, 0.85 * Math.max(0.05, queueAns.value), baseZ + 0.14 + 0.28 * queueAns.value],
    { color: COSMOS.cyan, width: 5.5, glow: 12, blend: 'screen', onTop: true },
  );
  const vecGrad3d = line3d(
    [0, 0, baseZ + 0.14],
    () => [1.35 * combineP.value, 0.85 * combineP.value, baseZ + 0.14 + 0.85 * combineP.value],
    { color: COSMOS.gold, width: 6.8, glow: 16, blend: 'screen', onTop: true },
  );

  view3d.add(
    lossSurf,
    promptSlice,
    queueSlice,
    basePt,
    probePt,
    vecPrompt3d,
    vecQueue3d,
    vecGrad3d,
  );

  const gradEq = glowTex(String.raw`\nabla L(2, 2) = \begin{bmatrix} 4 \\ 2 \end{bmatrix}`, {
    x: -600,
    y: 270,
    size: 46,
    color: COSMOS.gold,
    glow: 10,
  });

  const leftHud = dynamic(() => {
    const pA = promptAns.value;
    const qA = queueAns.value;
    const cp = combineP.value;
    const pNudge = promptOffset.value;
    const qNudge = queueOffset.value;

    const nodes = [
      txt('Partial', -845, -400, 58, COSMOS.ink, 'serif', 'left'),
      txt('Derivatives', -845, -332, 58, COSMOS.gold, 'serif', 'left').glow(8, COSMOS.gold),
      txt('Start: w = (2, 2)   ·   L = 1.00', -845, -245, 28, COSMOS.muted, 'mono', 'left'),
      // Prompt partial readout
      glassPlate(-565, -125, 560, 128, {
        stroke: pNudge > 0.1 || pA > 0.2 ? COSMOS.blue : '#2c3d66',
        glow: pNudge > 0.1 ? 10 : 4,
      }),
      txt('PROMPT DIAL  (queue frozen)', -815, -158, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        pA > 0.4 ? '∂L / ∂w_p = 4' : 'Δw_p = +0.01 → ΔL ≈ +0.04',
        -815,
        -100,
        28,
        pA > 0.4 ? COSMOS.blue : COSMOS.ink,
        'mono',
        'left',
      ).glow(pA > 0.4 ? 8 : 0, COSMOS.blue),
      // Queue partial readout
      glassPlate(-565, 35, 560, 128, {
        stroke: qNudge > 0.1 || qA > 0.2 ? COSMOS.cyan : '#2c3d66',
        glow: qNudge > 0.1 ? 10 : 4,
      }),
      txt('QUEUE DIAL  (prompt frozen)', -815, 2, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        qA > 0.4
          ? '∂L / ∂w_q = 2'
          : qNudge > 0.05
            ? 'Δw_q = +0.01 → ΔL ≈ +0.02'
            : 'waiting for queue probe',
        -815,
        60,
        28,
        qA > 0.4 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ).glow(qA > 0.4 ? 8 : 0, COSMOS.cyan),
    ];

    if (cp > 0.1) {
      nodes.push(
        txt('COMBINED GRADIENT VECTOR', -845, 162, 26, COSMOS.gold, 'mono', 'left').opacity(cp),
        txt(
          'Learning rate will scale the step',
          -845,
          382,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(cp),
      );
    }

    return group(...nodes);
  });

  s.add(view3d, leftHud);
  livingDrift(s, c, drift, 1);
  orbitScene(s, c, view3d, { theta: -0.35, phi: 0.94, distance: 13.9 });

  // Beat 0: probe prompt dial
  cueTo(s, c, 'prompt-probe', promptOffset, 1, { dur: 0.85 });
  cueTo(s, c, 'partial-sensitivity', promptAns, 1, { dur: 0.45 });

  // Beat 1: reset prompt, probe queue dial
  cueTo(s, c, 'queue-probe', promptOffset, 0, { dur: 0.35 });
  c.on('queue-probe', () => {
    s.play(queueOffset.to(1, { duration: 0.85 }));
    s.play(probeMode.to(1, { duration: 0.35 }));
  });
  cueTo(s, c, 'queue-partial-cue', queueAns, 1, { dur: 0.45 });

  // Beat 2: assemble gradient vector (4, 2)
  cueTo(s, c, 'prompt-slope', queueOffset, 0, { dur: 0.3 });
  pulseCue(s, c, 'queue-slope', probeMode, 2, { dur: 0.35 });
  cueTo(s, c, 'combine-gradient', combineP, 1, { dur: 0.7 });
  c.show('combine-gradient', gradEq);
}

// ---------------------------------------------------------------------------
// 7. gradient-geometry: Read a contour like a map
// Cues: equal-loss, coordinate-sensitivity, assemble-direction,
//       normal-direction, reverse-gradient, prompt-moves-more
// ---------------------------------------------------------------------------
export function gradientGeometry(s, c) {
  const contourVis = s.value(0.2);
  const startDotVis = s.value(0);
  const upGradP = s.value(0);
  const normalVis = s.value(0);
  const stepP = s.value(0);
  const lossVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.4, seed: 53 }));

  const plotLeft = -760;
  const plotRight = 180;
  const plotTop = -340;
  const plotBottom = 310;
  const xMin = 0.8;
  const xMax = 2.8;
  const yMin = 0.5;
  const yMax = 2.7;
  const X = (wp) => plotLeft + ((wp - xMin) / (xMax - xMin)) * (plotRight - plotLeft);
  const Y = (wq) => plotBottom - ((wq - yMin) / (yMax - yMin)) * (plotBottom - plotTop);

  // Luminous scalarField loss heat map
  const lossHeat = scalarField(
    (wp, wq) => {
      const l = (2 * wp + wq - 5) ** 2;
      return Math.min(4.5, l);
    },
    {
      x: [xMin, xMax],
      y: [yMin, yMax],
      domain: [0, 4.5],
      colors: ['#092b28aa', '#134d5e92', '#1d36707c', '#4a2b7868', '#8a2d5a58', '#ffd16648'],
      width: plotRight - plotLeft,
      height: plotBottom - plotTop,
      resolution: [64, 48],
    },
  )
    .at((plotLeft + plotRight) / 2, (plotTop + plotBottom) / 2)
    .set('blend', 'screen');

  const liveMap = dynamic(() => {
    const cv = contourVis.value;
    const ug = upGradP.value;
    const nv = normalVis.value;
    const sp = stepP.value;
    const lv = lossVis.value;

    const wStart = [2.0, 2.0];
    const wEnd = [1.68, 1.84];
    const wCur = [wStart[0] + (wEnd[0] - wStart[0]) * sp, wStart[1] + (wEnd[1] - wStart[1]) * sp];
    const curState = latencyExample(wCur, [2, 1], 5);

    // Draw exact contour lines 2*wp + wq = 5 + offset for L in {0, 0.04, 1, 2.25, 4}
    const contourOffsets = [
      { off: 0, label: 'L = 0', col: COSMOS.emerald, w: 4.5 },
      { off: 1, label: 'L = 1', col: COSMOS.cyan, w: 3.4 },
      { off: -1, label: 'L = 1', col: COSMOS.cyan, w: 2.2 },
      { off: 1.5, label: 'L = 2.25', col: COSMOS.violet, w: 2.0 },
      { off: -1.5, label: 'L = 2.25', col: COSMOS.violet, w: 2.0 },
      { off: 2, label: 'L = 4', col: COSMOS.rose, w: 1.8 },
    ];

    const contourNodes = [];
    for (const ct of contourOffsets) {
      // Intersect 2*wp + wq = 5 + ct.off with box [xMin, xMax] x [yMin, yMax]
      const cVal = 5 + ct.off;
      const pts = [];
      for (const wp of [xMin, xMax]) {
        const wq = cVal - 2 * wp;
        if (wq >= yMin - 1e-6 && wq <= yMax + 1e-6) pts.push([wp, wq]);
      }
      for (const wq of [yMin, yMax]) {
        const wp = (cVal - wq) / 2;
        if (wp > xMin + 1e-6 && wp < xMax - 1e-6) pts.push([wp, wq]);
      }
      if (pts.length >= 2) {
        const pA = pts[0];
        const pB = pts[1];
        contourNodes.push(
          line([X(pA[0]), Y(pA[1])], [X(pB[0]), Y(pB[1])], {
            stroke: ct.col,
            width: ct.w,
          })
            .glow(ct.off === 0 || ct.off === 1 ? 10 : 4, ct.col)
            .opacity(cv),
        );
      }
    }

    const sx = X(wStart[0]);
    const sy = Y(wStart[1]);

    // Scale vector lengths cleanly in screen space (1 unit in wp = 470px, 1 unit in wq = 295px)
    // True geometric normal in parameter space is parallel to (4, 2) -> (dx=0.32, dy=0.16)
    const upTipX = X(2.0 + 0.32 * ug);
    const upTipY = Y(2.0 + 0.16 * ug);
    const dnTipX = X(wCur[0]);
    const dnTipY = Y(wCur[1]);

    const nodes = [
      rect(plotRight - plotLeft, plotBottom - plotTop, {
        fill: null,
        stroke: '#3a4f7c',
        width: 2.2,
        radius: 12,
      }).at((plotLeft + plotRight) / 2, (plotTop + plotBottom) / 2),
      markDecor(group(...contourNodes)),
      // Axis labels & crisp color-coded legend cleanly above map (zero stroke crossings)
      txt(
        'prompt weight w_p',
        (plotLeft + plotRight) / 2,
        plotBottom + 54,
        28,
        COSMOS.muted,
        'sans',
      ),
      txt('w_q', plotLeft - 44, plotTop + 20, 28, COSMOS.muted, 'mono', 'right'),
      txt('● L = 0 valley', plotLeft + 10, plotTop - 36, 26, COSMOS.emerald, 'mono', 'left').glow(
        6,
        COSMOS.emerald,
      ),
      txt('● L = 1 contour', plotLeft + 295, plotTop - 36, 26, COSMOS.cyan, 'mono', 'left'),
      txt('● start (2, 2)', plotLeft + 610, plotTop - 36, 26, COSMOS.gold, 'mono', 'left'),
    ];

    // Right-angle square marker where gradient crosses L=1 contour
    if (nv > 0.1) {
      // Tangent unit along contour in screen space vs normal unit
      const tx = X(2.0 - 0.05) - sx;
      const ty = Y(2.0 + 0.1) - sy;
      const tLen = Math.hypot(tx, ty);
      const ux = (tx / tLen) * 24;
      const uy = (ty / tLen) * 24;
      const nx = -uy;
      const ny = ux;
      nodes.push(
        new Node(
          polyPath([
            [sx + ux, sy + uy],
            [sx + ux + nx, sy + uy + ny],
            [sx + nx, sy + ny],
          ]),
        )
          .stroke(COSMOS.cyan, 2.8, nv)
          .glow(8, COSMOS.cyan),
      );
    }

    // Uphill gradient arrow (gold)
    if (ug > 0.05) {
      nodes.push(
        arrow([sx, sy], [upTipX, upTipY], { stroke: COSMOS.gold, width: 5.5, tip: 15 }).glow(
          12,
          COSMOS.gold,
        ),
      );
    }

    // Downhill reversed step arrow (emerald)
    if (sp > 0.05) {
      nodes.push(
        arrow([sx, sy], [dnTipX, dnTipY], { stroke: COSMOS.emerald, width: 5.8, tip: 15 }).glow(
          12,
          COSMOS.emerald,
        ),
        dot(10, COSMOS.emerald).at(dnTipX, dnTipY).glow(14, COSMOS.emerald),
        dot(4, '#ffffff').at(dnTipX, dnTipY),
      );
    }

    // Start anchor (2, 2)
    nodes.push(
      dot(11, COSMOS.gold)
        .at(sx, sy)
        .glow(14, COSMOS.gold)
        .opacity(0.4 + 0.6 * startDotVis.value),
      dot(4.5, '#ffffff').at(sx, sy),
    );

    // Right info column
    const rx = 550;
    nodes.push(
      glassPlate(rx, -10, 560, 620, { stroke: '#3c5080', glow: 6 }),
      txt('CONTOUR GEOMETRY', rx, -268, 26, COSMOS.cyan, 'mono'),
      txt('Start: w = (2.00, 2.00)', rx, -206, 30, COSMOS.ink, 'mono'),
      txt('Start loss: L = 1.00', rx, -152, 28, COSMOS.cyan, 'mono'),
      line([rx - 230, -106], [rx + 230, -106], { stroke: '#2c3d66', width: 1.6 }),
      txt('Uphill gradient  ∇L = (4, 2)', rx, -54, 30, COSMOS.gold, 'mono').opacity(
        0.25 + 0.75 * ug,
      ),
      txt('Perpendicular to equal-loss contour', rx, 4, 26, COSMOS.muted, 'sans').opacity(
        0.2 + 0.8 * nv,
      ),
      line([rx - 230, 52], [rx + 230, 52], { stroke: '#2c3d66', width: 1.6 }),
      txt('Downhill step  η = 0.08', rx, 106, 30, COSMOS.emerald, 'mono').opacity(0.2 + 0.8 * sp),
      txt(`w_new = (${fmt(wCur[0], 2)}, ${fmt(wCur[1], 2)})`, rx, 172, 36, COSMOS.emerald, 'mono')
        .glow(sp > 0.5 ? 8 : 0, COSMOS.emerald)
        .opacity(0.2 + 0.8 * sp),
      lv > 0.35
        ? txt(`Recomputed loss = ${fmt(curState.loss, 2)}`, rx, 244, 34, COSMOS.gold, 'mono')
            .glow(10, COSMOS.gold)
            .opacity(Math.min(1, (lv - 0.35) / 0.35))
        : group(),
    );

    return group(...nodes);
  });

  s.add(lossHeat, liveMap);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'equal-loss', contourVis, 1, { dur: 0.7 });
  cueTo(s, c, 'coordinate-sensitivity', startDotVis, 1, { dur: 0.5 });

  cueTo(s, c, 'assemble-direction', upGradP, 1, { dur: 0.8 });
  cueTo(s, c, 'normal-direction', normalVis, 1, { dur: 0.5 });

  cueTo(s, c, 'reverse-gradient', stepP, 1, { dur: 1.0 });
  cueTo(s, c, 'prompt-moves-more', lossVis, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 8. update-step: Choose the distance yourself
// Cues: descent-equation-b1-1, updated-weight-b2-1, downhill-path-b3-1,
//       descent-calculation-b3-2, step-choice-0-b1-1, rate-one-question
// ---------------------------------------------------------------------------
export function updateStep(s, c) {
  const stepP = s.value(0); // 0 -> w=3.0, 1 -> w=2.6
  const receiptVis = s.value(0);
  const askRateOne = s.value(0);
  const eqPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.44, seed: 61 }));
  s.add(aura(-360, 0, 500, '#2a588a24', '#151e3d12'));
  s.add(aura(460, 0, 440, '#6ee7b71e', '#15243010'));

  const plot = makePlot2d({
    left: -820,
    right: 60,
    top: -275,
    bottom: 270,
    xDomain: [2.0, 3.3],
    yDomain: [0, 2.2],
    xTicks: [2.0, 2.5, 2.6, 3.0],
    yTicks: [0, 0.5, 1.0, 1.5, 2.0],
    xLabel: 'weight w',
    yLabel: 'loss L(w) = (2w − 5)²',
  });

  const eqRule = glowTex(String.raw`w_{\mathrm{new}} = w - \eta\,\frac{dL}{dw}`, {
    x: 495,
    y: -270,
    size: 46,
    color: COSMOS.gold,
    glow: 8,
  });

  const liveScene = dynamic(() => {
    const sp = stepP.value;
    const rv = receiptVis.value;
    const q1 = askRateOne.value;
    const wCur = 3.0 - 0.4 * sp;
    const lCur = derivativeLoss(wCur);
    const predCur = 2 * wCur;
    const pts = plot.sampleCurve(derivativeLoss, { from: 2.05, to: 3.24, samples: 120 });

    const x3 = plot.X(3.0);
    const y3 = plot.Y(1.0);
    const xc = plot.X(wCur);
    const yc = plot.Y(lCur);

    const nodes = [
      plot.axes,
      new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.5, 0.92).glow(10, COSMOS.cyan),
      // Original marker at (3, 1)
      circle(11, { fill: COSMOS.bg, stroke: COSMOS.rose, width: 3.5 }).at(x3, y3),
      txt('w = 3, L = 1', x3 - 10, y3 - 38, 26, COSMOS.rose, 'mono', 'right'),
      // Uphill tangent cue arrow at w=3
      arrow([x3, y3], [plot.X(3.18), plot.Y(1.72)], {
        stroke: COSMOS.gold,
        width: 3.5,
        tip: 12,
      }).opacity(0.75),
      txt('+4 uphill', plot.X(2.88), plot.Y(1.78), 26, COSMOS.gold, 'mono'),
    ];

    if (sp > 0.04) {
      // Glowing arc of descent along parabola
      const trailPts = plot.sampleCurve(derivativeLoss, { from: wCur, to: 3.0, samples: 40 });
      if (trailPts.length >= 2) {
        nodes.push(
          new Node(polyPath(trailPts)).stroke(COSMOS.emerald, 6, 0.95).glow(12, COSMOS.emerald),
        );
      }
      nodes.push(
        dot(11, COSMOS.emerald).at(xc, yc).glow(14, COSMOS.emerald),
        dot(4.5, '#ffffff').at(xc, yc),
      );
    }

    // Right calculation stack (strictly withholds 2.6 until beat 1!)
    const rx = 495;
    nodes.push(
      glassPlate(rx, 85, 590, 520, { stroke: '#3c5080', glow: 6 }),
      txt('w = 3.0    ·    dL/dw = +4', rx, -122, 30, COSMOS.ink, 'mono'),
      txt('Learning rate  η = 0.1', rx, -62, 30, COSMOS.cyan, 'mono'),
      line([rx - 230, -18], [rx + 230, -18], { stroke: '#2c3d66', width: 1.6 }),
    );

    if (sp < 0.05) {
      nodes.push(
        txt('Subtract  η × (dL/dw) = ?', rx, 44, 34, COSMOS.gold, 'mono').glow(
          8 + 4 * eqPulse.value,
          COSMOS.gold,
        ),
        txt('Work out w_new before the dot moves', rx, 118, 28, COSMOS.muted, 'sans'),
      );
    } else if (q1 < 0.3) {
      nodes.push(
        txt('3.0 − 0.1 × 4 = 2.6', rx, 42, 40, COSMOS.emerald, 'mono').glow(10, COSMOS.emerald),
        txt(
          rv > 0.2 ? `ŷ = 2 × 2.6 = ${fmt(predCur, 1)} s` : 'Re-run forward pass...',
          rx,
          122,
          32,
          COSMOS.cyan,
          'mono',
        ),
        txt(
          rv > 0.6 ? `L(2.6) = (0.2)² = 0.04 s²` : 'Recomputing loss...',
          rx,
          192,
          32,
          COSMOS.gold,
          'mono',
        ).glow(rv > 0.6 ? 10 : 0, COSMOS.gold),
        txt('Measured improvement receipt', rx, 266, 28, COSMOS.muted, 'sans').opacity(rv),
      );
    } else {
      nodes.push(
        txt('η = 0.1  →  w = 2.6,  L = 0.04', rx, 36, 30, COSMOS.emerald, 'mono'),
        line([rx - 230, 88], [rx + 230, 88], { stroke: '#2c3d66', width: 1.6 }),
        txt('NOW TRY  η = 1.0  FROM w = 3', rx, 146, 30, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
        txt('Will its new loss be smaller than 1?', rx, 220, 30, COSMOS.rose, 'serif').glow(
          8,
          COSMOS.rose,
        ),
        txt('w_next = 3 − 1.0 × 4 = ?', rx, 282, 32, COSMOS.muted, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene, eqRule);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'descent-equation-b1-1', eqPulse, 1, { dur: 0.5 });

  // Prediction withheld in beat 0: move only starts on beat 1 updated-weight-b2-1
  cueTo(s, c, 'updated-weight-b2-1', stepP, 1, { dur: 0.85 });

  cueTo(s, c, 'downhill-path-b3-1', receiptVis, 0.5, { dur: 0.45 });
  cueTo(s, c, 'descent-calculation-b3-2', receiptVis, 1, { dur: 0.45 });

  pulseCue(s, c, 'step-choice-0-b1-1', eqPulse, 0.4, { dur: 0.3 });
  cueTo(s, c, 'rate-one-question', askRateOne, 1, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 9. step-size-limits: Where will the longer step land?
// Cues: step-choice-2-b1-2*, step-overshoot-loss, exact-rate-question,
//       step-choice-1-b2-1, changing-tangent-b3-1
// ---------------------------------------------------------------------------
export function stepSizeLimits(s, c) {
  const overshootP = s.value(0); // 0 -> w=3, 1 -> w=-1 (loss 49)
  const showLoss49 = s.value(0);
  const askExact = s.value(0);
  const exactStepP = s.value(0); // 0 -> 1 reveals w=2.5 (η=1/8)
  const tangentSweep = s.value(0); // sweeps tangent along curve
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.rose, opacity: 0.44, seed: 71 }));
  s.add(aura(-360, 0, 500, '#ff6b8b1e', '#1a122610'));
  s.add(aura(460, 0, 440, '#6ee7b71e', '#12242810'));

  // Wide parabola plot showing overshoot all the way to w=-1, L=49
  const widePlot = makePlot2d({
    left: -820,
    right: -40,
    top: -275,
    bottom: 270,
    xDomain: [-1.4, 3.6],
    yDomain: [0, 54],
    xTicks: [-1, 0, 1, 2, 3],
    yTicks: [0, 10, 25, 49],
    xLabel: 'weight w',
    yLabel: 'loss L(w) = (2w − 5)²',
  });

  // Close-up valley inset on right
  const insetPlot = makePlot2d({
    left: 160,
    right: 810,
    top: -275,
    bottom: 145,
    xDomain: [2.2, 3.25],
    yDomain: [0, 1.8],
    xTicks: [2.5, 2.6, 3.0],
    yTicks: [0, 0.5, 1.0, 1.5],
    xLabel: 'close-up around minimum w* = 2.5',
    yLabel: 'L(w)',
  });

  const liveScene = dynamic(() => {
    const ov = overshootP.value;
    const l49 = showLoss49.value;
    const ax = askExact.value;
    const ex = exactStepP.value;
    const ts = tangentSweep.value;

    const widePts = widePlot.sampleCurve(derivativeLoss, { from: -1.2, to: 3.5, samples: 140 });
    const insetPts = insetPlot.sampleCurve(derivativeLoss, { from: 2.25, to: 3.2, samples: 100 });

    const wOver = 3.0 - 4.0 * ov;
    const lOver = derivativeLoss(wOver);
    const wExact = 3.0 - 0.5 * ex;
    const lExact = derivativeLoss(wExact);

    const nodes = [
      txt('SAME GRADIENT (+4), DIFFERENT STEP SIZES', -820, -395, 26, COSMOS.gold, 'mono', 'left'),
      widePlot.axes,
      new Node(polyPath(widePts)).stroke(COSMOS.cyan, 4.2, 0.9).glow(8, COSMOS.cyan),
      // Start (3, 1) and small step (2.6, 0.04) kept visible
      dot(9, COSMOS.gold).at(widePlot.X(3.0), widePlot.Y(1.0)).glow(10, COSMOS.gold),
      dot(8, COSMOS.emerald).at(widePlot.X(2.6), widePlot.Y(0.04)).glow(8, COSMOS.emerald),
      // Close-up plot
      insetPlot.axes,
      new Node(polyPath(insetPts)).stroke(COSMOS.cyan, 4.2, 0.9).glow(8, COSMOS.cyan),
      dot(9, COSMOS.gold).at(insetPlot.X(3.0), insetPlot.Y(1.0)).glow(10, COSMOS.gold),
      dot(9, COSMOS.emerald).at(insetPlot.X(2.6), insetPlot.Y(0.04)).glow(10, COSMOS.emerald),
      txt('η = 0.1', insetPlot.X(2.4), insetPlot.Y(0.78), 26, COSMOS.emerald, 'mono'),
    ];

    // Rate 1.0 overshoot jump across wide parabola
    if (ov > 0.04) {
      nodes.push(
        arrow(
          [widePlot.X(3.0), widePlot.Y(1.0)],
          [widePlot.X(wOver), widePlot.Y(Math.min(52, lOver))],
          { stroke: COSMOS.rose, width: 4.5, tip: 14 },
        ).glow(12, COSMOS.rose),
        dot(11, COSMOS.rose)
          .at(widePlot.X(wOver), widePlot.Y(Math.min(52, lOver)))
          .glow(14, COSMOS.rose),
      );
      if (l49 > 0.3) {
        nodes.push(
          txt(
            'η = 1.0  →  w = −1,  L = 49',
            widePlot.X(0.55),
            widePlot.Y(45),
            28,
            COSMOS.rose,
            'mono',
            'left',
          )
            .glow(10, COSMOS.rose)
            .opacity(l49),
        );
      }
    }

    // Distance bracket 0.5 in close-up when asking exact rate (high in open sky above bowl)
    if (ax > 0.2) {
      const by = insetPlot.Y(1.42);
      nodes.push(
        line([insetPlot.X(2.5), by], [insetPlot.X(3.0), by], {
          stroke: COSMOS.gold,
          width: 3.4,
        }).glow(8, COSMOS.gold),
        line([insetPlot.X(2.5), by - 8], [insetPlot.X(2.5), by + 8], {
          stroke: COSMOS.gold,
          width: 2.6,
        }),
        line([insetPlot.X(3.0), by - 8], [insetPlot.X(3.0), by + 8], {
          stroke: COSMOS.gold,
          width: 2.6,
        }),
        txt('distance = 0.5', insetPlot.X(2.75), by - 36, 26, COSMOS.gold, 'mono'),
      );
    }

    // Exact 1/8 landing at w = 2.5
    if (ex > 0.05) {
      nodes.push(
        arrow([insetPlot.X(3.0), insetPlot.Y(1.0)], [insetPlot.X(wExact), insetPlot.Y(lExact)], {
          stroke: COSMOS.emerald,
          width: 4.8,
          tip: 14,
        }).glow(12, COSMOS.emerald),
        dot(11, COSMOS.emerald)
          .at(insetPlot.X(wExact), insetPlot.Y(lExact))
          .glow(14, COSMOS.emerald),
        dot(4.5, '#ffffff').at(insetPlot.X(wExact), insetPlot.Y(lExact)),
      );
    }

    // Sweeping tangent line along parabola in beat 2 (strictly clipped inside plot box)
    if (ts > 0.02) {
      const tw = 3.0 - 0.62 * ts;
      const tl = derivativeLoss(tw);
      const tSlope = 4 * (2 * tw - 5);
      const dw = 0.15;
      const wA = Math.max(2.26, tw - dw);
      const wB = Math.min(3.18, tw + dw);
      const yA = Math.max(0.06, Math.min(1.72, tl + tSlope * (wA - tw)));
      const yB = Math.max(0.06, Math.min(1.72, tl + tSlope * (wB - tw)));
      nodes.push(
        line([insetPlot.X(wA), insetPlot.Y(yA)], [insetPlot.X(wB), insetPlot.Y(yB)], {
          stroke: COSMOS.blue,
          width: 4.5,
        }).glow(10, COSMOS.blue),
        dot(9, COSMOS.blue).at(insetPlot.X(tw), insetPlot.Y(tl)).glow(12, COSMOS.blue),
        txt(`slope at w = ${fmt(tw, 2)} is ${fmt(tSlope, 2)}`, 485, 290, 30, COSMOS.blue, 'mono'),
      );
    } else if (ex > 0.5) {
      nodes.push(
        txt('η = 1/8 = 0.125  →  w = 2.5,  L = 0', 485, 290, 32, COSMOS.emerald, 'mono').glow(
          10,
          COSMOS.emerald,
        ),
      );
    } else if (ax > 0.3) {
      nodes.push(
        txt('What rate × 4 moves exactly 0.5?', 485, 290, 32, COSMOS.gold, 'serif').glow(
          8,
          COSMOS.gold,
        ),
      );
    } else {
      nodes.push(txt('Rate 1.0 jumps past the minimum', 485, 290, 30, COSMOS.rose, 'sans'));
    }

    nodes.push(
      txt(
        'The derivative is local: once you step away, the curve can turn',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  // Beat 0: caption_boundary on step-choice-2-b1-2 -> starts strictly at cue
  cueTo(s, c, 'step-choice-2-b1-2', overshootP, 1, { dur: 0.9 });
  cueTo(s, c, 'step-overshoot-loss', showLoss49, 1, { dur: 0.45 });
  cueTo(s, c, 'exact-rate-question', askExact, 1, { dur: 0.45 });

  // Beat 1: reveal exact 1/8 landing
  cueTo(s, c, 'step-choice-1-b2-1', exactStepP, 1, { dur: 0.85 });

  // Beat 2: changing tangent sweep
  cueTo(s, c, 'changing-tangent-b3-1', tangentSweep, 1, { dur: 1.6 });
}

// ---------------------------------------------------------------------------
// 10. stable-scale: What happens on the next step?
// Cues: stable-scale-b1, stable-iterate, stable-boundary*, stable-outside*,
//       stable-scale-b2, stable-scale-b3, units-gradient, units-bound
// ---------------------------------------------------------------------------
export function stableScale(s, c) {
  const stageMode = s.value(0); // 0=trajectories, 1=1/x^2 bound, 2=unit scaling
  const run1P = s.value(0); // η=0.1
  const run2P = s.value(0); // η=0.25
  const run3P = s.value(0); // η=0.26
  const boundReveal = s.value(0);
  const gradReveal = s.value(0);
  const limitReveal = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 79 }));
  s.add(aura(0, 0, 560, '#2a588a22', '#151e3d10'));

  const trajPlot = makePlot2d({
    left: -740,
    right: 520,
    top: -270,
    bottom: 225,
    xDomain: [0, 6],
    yDomain: [-1.05, 1.05],
    xTicks: [0, 1, 2, 3, 4, 5, 6],
    yTicks: [-1, -0.5, 0, 0.5, 1],
    xLabel: 'update step k',
    yLabel: 'signed offset  d_k = w_k − 2.5',
    showZeroY: true,
  });

  const eqStep = glowTex(String.raw`d_{k+1} = (1 - 8\eta)\,d_k`, {
    x: 0,
    y: 375,
    size: 44,
    color: COSMOS.gold,
    glow: 8,
  });

  // Phase 0: 6-step signed displacement trajectories for η=0.1, 0.25, 0.26
  const viewTraj = guardedDynamic(
    () => fadeOut(Math.min(1, stageMode.value)),
    (vis) => {
      const runs = [
        { rate: 0.1, col: COSMOS.emerald, p: run1P.value, label: 'η = 0.10  (× 0.20)' },
        { rate: 0.25, col: COSMOS.gold, p: run2P.value, label: 'η = 0.25  (× −1.00)' },
        { rate: 0.26, col: COSMOS.rose, p: run3P.value, label: 'η = 0.26  (× −1.08)' },
      ];
      const nodes = [
        txt('CONVERGENCE BOUNDARY  (x = 2)', -740, -370, 26, COSMOS.cyan, 'mono', 'left'),
        trajPlot.axes,
      ];

      runs.forEach((r, idx) => {
        const steps = Math.floor(6 * r.p + 1e-6);
        if (r.p > 0.02) {
          const pts = [];
          for (let k = 0; k <= steps; k++) {
            const dk = 0.5 * (1 - 8 * r.rate) ** k;
            pts.push([trajPlot.X(k), trajPlot.Y(Math.max(-1.05, Math.min(1.05, dk)))]);
          }
          if (pts.length >= 2) {
            nodes.push(new Node(polyPath(pts)).stroke(r.col, 4.2, 0.92).glow(10, r.col));
          }
          for (const [px, py] of pts) {
            nodes.push(dot(7.5, r.col).at(px, py).glow(10, r.col));
          }
        }
        nodes.push(
          txt(r.label, 560, -140 + idx * 105, 28, r.col, 'mono', 'left')
            .glow(r.p > 0.2 ? 6 : 0, r.col)
            .opacity(r.p > 0.02 ? 1 : 0.3),
        );
      });

      return group(...nodes).opacity(vis);
    },
  );

  // Phase 1: General stability boundary 0 < η < 1/x²
  const boundPlot = makePlot2d({
    left: -720,
    right: 680,
    top: -260,
    bottom: 215,
    xDomain: [1, 10],
    yDomain: [0, 1.05],
    xTicks: [1, 2, 4, 6, 8, 10],
    yTicks: [0, 0.25, 0.5, 1.0],
    xLabel: 'fixed nonzero feature x',
    yLabel: 'max stable learning rate  1 / x²',
  });

  const eqBound = glowTex(
    String.raw`0 < \eta < \frac{1}{x^2}, \qquad d_{k+1} = (1 - 2x^2\eta)\,d_k`,
    { x: 0, y: 375, size: 42, color: COSMOS.gold, glow: 8 },
  );

  const viewBound = guardedDynamic(
    () => {
      const m = stageMode.value;
      if (m <= 0.5) return 0;
      if (m < 1.5) return fadeIn(m);
      return fadeOut(m - 1);
    },
    (vis) => {
      const br = boundReveal.value;
      const pts = boundPlot.sampleCurve((x) => 1 / (x * x), {
        from: 1,
        to: 1 + 9 * Math.max(0.05, br),
        samples: 140,
      });
      const nodes = [
        txt('EXACT STABILITY BOUNDARY', -720, -365, 26, COSMOS.cyan, 'mono', 'left'),
        boundPlot.axes,
        pts.length >= 2
          ? new Node(polyPath(pts)).stroke(COSMOS.cyan, 5, 0.95).glow(12, COSMOS.cyan)
          : group(),
        dot(10, COSMOS.gold).at(boundPlot.X(2), boundPlot.Y(0.25)).glow(14, COSMOS.gold),
        txt(
          'x = 2  →  η < 0.25',
          boundPlot.X(2) + 24,
          boundPlot.Y(0.25) - 30,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          'Double x and the stable learning-rate ceiling drops by 4×',
          0,
          -318,
          30,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // Phase 2: Feature units comparison (2 blocks vs 200 raw tokens)
  const viewUnits = guardedDynamic(
    () => fadeIn(Math.max(0, stageMode.value - 1)),
    (vis) => {
      const gr = gradReveal.value > 0.4;
      const lr = limitReveal.value > 0.4;
      const rows = [
        {
          y: -120,
          tag: '100-TOKEN BLOCKS',
          expr: '2 × 3.00 = 6 s',
          grad: 'gradient = 4',
          bound: '0 < η < 0.25',
          col: COSMOS.cyan,
        },
        {
          y: 135,
          tag: 'RAW TOKENS',
          expr: '200 × 0.03 = 6 s',
          grad: gr ? 'gradient = 400' : 'gradient = ?',
          bound: lr ? '0 < η < 0.000025' : '0 < η < ?',
          col: COSMOS.gold,
        },
      ];
      const nodes = [
        txt('UNIT SCALING CHANGES CURVATURE BY 10,000×', 0, -345, 32, COSMOS.gold, 'mono').glow(
          8,
          COSMOS.gold,
        ),
      ];
      for (const r of rows) {
        nodes.push(
          glassPlate(0, r.y, 1520, 175, { stroke: r.col, glow: 8 }),
          txt(r.tag, -700, r.y - 38, 26, r.col, 'mono', 'left'),
          txt(r.expr, -700, r.y + 24, 42, COSMOS.ink, 'mono', 'left'),
          txt(r.grad, 90, r.y - 10, 38, COSMOS.rose, 'mono', 'left').glow(8, COSMOS.rose),
          txt(r.bound, 90, r.y + 46, 32, COSMOS.emerald, 'mono', 'left'),
        );
      }
      nodes.push(
        txt(
          'Same 200-token request, same 6 s prediction, 10,000× tighter stable rate',
          0,
          345,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(viewTraj, eqStep, viewBound, viewUnits);
  livingDrift(s, c, drift, 1);

  // Beat 0: iterate -> boundary (caption_boundary) -> outside (caption_boundary)
  pulseCue(s, c, 'stable-scale-b1', run1P, 0.15, { dur: 0.35 });
  cueTo(s, c, 'stable-iterate', run1P, 1, { dur: 1.0 });
  cueTo(s, c, 'stable-boundary', run2P, 1, { dur: 0.9 });
  cueTo(s, c, 'stable-outside', run3P, 1, { dur: 0.9 });

  // Beat 1: transition to 1/x² stability curve (non-overlapping equation swap!)
  cueTo(s, c, 'stable-scale-b2', stageMode, 1, { dur: 0.55 });
  c.hide('stable-scale-b2', eqStep);
  const b2Offset = Math.max(0.1, c.cue('stable-scale-b2').start - c.start + 0.38);
  c.at(b2Offset, () => s.add(eqBound));
  c.on('stable-scale-b2', () => s.play(boundReveal.to(1, { duration: 1.4 })));

  // Beat 2: transition to raw tokens scaling comparison
  cueTo(s, c, 'stable-scale-b3', stageMode, 2, { dur: 0.65 });
  c.hide('stable-scale-b3', eqBound);
  cueTo(s, c, 'units-gradient', gradReveal, 1, { dur: 0.4 });
  cueTo(s, c, 'units-bound', limitReveal, 1, { dur: 0.4 });
}
