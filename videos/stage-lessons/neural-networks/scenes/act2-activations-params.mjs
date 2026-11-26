// Act 2 (Scenes 7-13): Bounded Activations (Sigmoid/Tanh), Smooth Gates (ReLU/GELU/SiLU),
// Activation Slope Products & SwiGLU, 9-Parameter Graph, Dense Parameter Scale, Batched Shapes, Transpose Bug.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PARAMETERS,
  REQUESTS,
  REQUEST_IDS,
  ROLE,
  activations,
  beatTo,
  cinemaGrid,
  cueTo,
  decorAura,
  denseParameterCount,
  fadeIn,
  fadeOut,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  requestForward,
  rule,
  transposeExample,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 7. bounded: A curve also controls a learning signal
// Cues: bounded-sweep, tail-slope
// ---------------------------------------------------------------------------
export function bounded(s, c) {
  const swP = s.value(0);
  const tlP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 7 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#a78bfa14'));

  const headline = heroTitle(['Sigmoid & Tanh:', 'Saturation in the Tails'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'LOCAL SLOPE MULTIPLIES THE BACKWARD SIGNAL',
  });

  const live = dynamic(() => {
    const sw = swP.value;
    const tl = tlP.value;
    const zNow = mix(-0.2, 4.2, sw);
    const sigY = activations.sigmoid.value(zNow);
    const sigD = activations.sigmoid.derivative(zNow);
    const tanY = activations.tanh.value(zNow);
    const tanD = activations.tanh.derivative(zNow);
    const nodes = [];

    const drawCurvePanel = (x0, x1, title, fn, col, yNow, dNow, maxSlope) => {
      const gy0 = 165;
      const gy1 = -165;
      const xOf = (z) => mix(x0, x1, (z + 5) / 10);
      const yOf = (y) => mix(gy0, gy1, (y + 1.15) / 2.3);
      const pts = [];
      for (let i = 0; i <= 50; i += 1) {
        const z = mix(-5, 5, i / 50);
        pts.push([xOf(z), yOf(fn(z))]);
      }
      const px = xOf(zNow);
      const py = yOf(yNow);
      return group(
        txt(title, (x0 + x1) / 2, -210, 28, col, 'mono'),
        rule(x0, yOf(0), x1, yOf(0), '#3b4e78', 2.4),
        rule(xOf(0), gy0, xOf(0), gy1, '#3b4e78', 2.4),
        glowingTrail(pts, { color: col, width: 4.2, glow: 10 }),
        glowDot(px, py, { radius: 12, color: ROLE.lit, glow: 12 }),
        txt(
          `z = ${zNow.toFixed(1)}   slope = ${dNow.toFixed(3)}`,
          (x0 + x1) / 2,
          225,
          30,
          col,
          'mono',
        ),
        txt(maxSlope, (x0 + x1) / 2, 275, 26, tl > 0.2 ? ROLE.lit : COSMOS.muted, 'mono'),
      );
    };

    nodes.push(
      drawCurvePanel(
        -800,
        -80,
        'SIGMOID  σ(z) ∈ (0, 1)',
        activations.sigmoid.value,
        ROLE.dark,
        sigY,
        sigD,
        'Peak slope = 0.25 at z = 0',
      ),
      drawCurvePanel(
        80,
        800,
        'TANH  tanh(z) ∈ (−1, 1)',
        activations.tanh.value,
        ROLE.gate,
        tanY,
        tanD,
        'Peak slope = 1.00 at z = 0',
      ),
      txt(
        tl > 0.2
          ? 'In the tails both slopes approach 0 → deep products weaken the gradient!'
          : 'Sweep z from center into the tails and watch each tangent flatten',
        0,
        340,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'bounded-sweep', swP, 1, { dur: 1.2 });
  cueTo(s, c, 'tail-slope', tlP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 8. smooth: Hard and smooth gates (ReLU, GELU, SiLU)
// Cues: relu-crossing, smooth-negative
// ---------------------------------------------------------------------------
export function smooth(s, c) {
  const relP = s.value(0);
  const smP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 8 }));
  s.add(decorAura(-220, 20, 520, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Hard ReLU Corner vs', 'Smooth GELU & SiLU'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'COMPARE NEGATIVE BRANCH AT z = −1',
  });

  const live = dynamic(() => {
    const rl = relP.value;
    const sm = smP.value;
    const zProbe = sm > 0.25 ? -1 : mix(-2.2, 1.8, rl);
    const nodes = [];

    // Left plot: ReLU, GELU, SiLU on [-3, 3]
    const gx0 = -800;
    const gx1 = 60;
    const gy0 = 215;
    const gy1 = -195;
    const xOf = (z) => mix(gx0, gx1, (z + 3) / 6);
    const yOf = (y) => mix(gy0, gy1, (y + 0.6) / 3.6);

    nodes.push(
      rule(gx0, yOf(0), gx1, yOf(0), '#3b4e78', 2.6),
      rule(xOf(0), gy0, xOf(0), gy1, '#3b4e78', 2.6),
      txt('−1', xOf(-1), yOf(0) + 56, 26, COSMOS.muted, 'mono'),
      txt('0', xOf(0) + 18, yOf(0) + 56, 26, COSMOS.muted, 'mono'),
      txt('+2', xOf(2), yOf(0) + 56, 26, COSMOS.muted, 'mono'),
    );

    const samplePts = (fn) => {
      const pts = [];
      for (let i = 0; i <= 60; i += 1) {
        const z = mix(-3, 3, i / 60);
        pts.push([xOf(z), yOf(fn(z))]);
      }
      return pts;
    };

    nodes.push(
      glowingTrail(samplePts(activations.ReLU.value), { color: ROLE.lit, width: 4.5, glow: 10 }),
      glowingTrail(samplePts(activations.GELU.value), {
        color: ROLE.dark,
        width: 3.8,
        glow: 9,
        opacity: mix(0.3, 1, sm),
      }),
      glowingTrail(samplePts(activations.SiLU.value), {
        color: ROLE.grad,
        width: 3.8,
        glow: 9,
        opacity: mix(0.3, 1, sm),
      }),
      glowDot(xOf(zProbe), yOf(activations.ReLU.value(zProbe)), {
        radius: 12,
        color: ROLE.lit,
        glow: 12,
      }),
    );

    // Right: Slopes readout at z = -1
    const rx = 160;
    const gD = activations.GELU.derivative(-1);
    const sD = activations.SiLU.derivative(-1);
    nodes.push(
      txt('SLOPES AT z = −1', rx, -175, 28, COSMOS.muted, 'mono', 'left'),
      txt('ReLU:  val = 0.00   slope = 0.000', rx, -85, 30, ROLE.lit, 'mono', 'left'),
      txt(
        `GELU:  val = ${activations.GELU.value(-1).toFixed(2)}  slope = ${gD.toFixed(3)}`,
        rx,
        10,
        30,
        ROLE.dark,
        'mono',
        'left',
      ).opacity(mix(0.45, 1, sm)),
      txt(
        `SiLU:  val = ${activations.SiLU.value(-1).toFixed(2)}  slope = +${sD.toFixed(3)}`,
        rx,
        105,
        30,
        ROLE.grad,
        'mono',
        'left',
      ).opacity(mix(0.45, 1, sm)),
      txt(
        sm > 0.2
          ? 'Smooth gates dip < 0; slopes can be −, 0, or +'
          : 'ReLU corner jumps slope 0 → 1 (backward = 0)',
        rx,
        220,
        28,
        COSMOS.ink,
        'serif',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'relu-crossing', relP, 1, { dur: 1.0 });
  cueTo(s, c, 'smooth-negative', smP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 9. activation-products: What passes through a gate? (Depth decay + Signs + SwiGLU)
// Cues: activation-products-beat-0, activation-products-beat-1,
//       activation-signed-products, activation-products-beat-2,
//       activation-products-beat-3, nn-swiglu-activation*, match-coordinates,
//       swiglu-product-values*, nn-swiglu-output*
// ---------------------------------------------------------------------------
export function activationProducts(s, c) {
  const b0P = s.value(0);
  const beat1P = s.value(0);
  const b1P = s.value(0);
  const sgnP = s.value(0);
  const beat2P = s.value(0);
  const b2P = s.value(0);
  const beat3P = s.value(0);
  const b3P = s.value(0);
  const actP = s.value(0);
  const matP = s.value(0);
  const prdP = s.value(0);
  const outP = s.value(0);
  const drift = s.value(0);

  const u = [1, -2];
  const v = [3, -1];
  const act = u.map(activations.SiLU.value);
  const prod = act.map((a, i) => a * v[i]);
  const readout = 0.5 * prod[0] - prod[1];

  s.add(cinemaGrid({ accent: ROLE.gate, seed: 9 }));
  s.add(decorAura(0, 20, 560, '#a78bfa1a', '#5ce1e614'));

  const headline = heroTitle(['Slope Products,', 'Signs & SwiGLU Gating'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gate,
    eyebrow: 'CHAIN RULE MULTIPLIERS  ·  SwiGLU(x) = (SiLU(xW) ⊙ xV) W_out',
  });

  // View 1 (Beat 0): 6 repeated peak slopes (0.25^6 vs 1^6)
  const view1 = guardedDynamic(
    () => fadeOut(beat1P.value),
    (vis) => {
      const k = Math.max(1, Math.round(b0P.value * 6));
      const nodes = [
        txt('UNIT SIGNAL THROUGH 6 PEAK SLOPES', -760, -195, 28, ROLE.dark, 'mono', 'left'),
      ];
      for (let i = 0; i <= 6; i += 1) {
        const cx = -660 + i * 220;
        const sigVal = 0.25 ** i;
        const show = i <= k;
        nodes.push(
          txt(`L${i}`, cx, -120, 26, COSMOS.muted, 'mono'),
          glowBar(cx - 32, -45, 64, 34, ROLE.dark, { glow: 7, opacity: show ? 1 : 0.2 }),
          txt('1.00', cx, 10, 26, ROLE.dark, 'mono').opacity(show ? 1 : 0.2),
          glowBar(cx - 32, 95, Math.max(8, 64 * sigVal), 34, ROLE.grad, {
            glow: 9,
            opacity: show ? 1 : 0.2,
          }),
          txt(
            sigVal >= 0.01 ? sigVal.toFixed(3) : sigVal.toExponential(1),
            cx,
            150,
            26,
            ROLE.grad,
            'mono',
          ).opacity(show ? 1 : 0.2),
        );
      }
      nodes.push(
        txt(
          'Top: tanh peak (1^6 = 1)    ·    Bottom: sigmoid peak (0.25^6 ≈ 0.00024!)',
          0,
          275,
          30,
          ROLE.lit,
          'mono',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Incoming sensitivity -2 at z = -1 across ReLU / GELU / SiLU
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(beat1P.value), fadeOut(beat2P.value)),
    (vis) => {
      const b1 = b1P.value;
      const sg = sgnP.value;
      const rows = [
        { name: 'ReLU', d: 0, col: ROLE.lit },
        { name: 'GELU', d: activations.GELU.derivative(-1), col: ROLE.dark },
        { name: 'SiLU', d: activations.SiLU.derivative(-1), col: ROLE.grad },
      ];
      const nodes = [txt('INCOMING SENSITIVITY −2  AT  z = −1', 0, -200, 30, COSMOS.ink, 'mono')];
      rows.forEach((r, i) => {
        const y = -95 + i * 105;
        nodes.push(
          txt(r.name, -640, y, 32, r.col, 'mono', 'left'),
          numCell('−2', -340, y, { w: 130, stroke: COSMOS.muted }),
          txt(`×  ${r.d.toFixed(4)}`, -110, y, 32, ROLE.dark, 'mono'),
          txt('=', 95, y, 32, COSMOS.muted, 'mono'),
          numCell(b1 > 0.2 ? (-2 * r.d).toFixed(4) : '?', 340, y, {
            w: 220,
            stroke: r.col,
            textColor: r.col,
            glow: b1 > 0.2 ? 10 : 0,
          }),
          txt(
            r.d === 0 ? 'blocked' : r.d < 0 ? 'sign flips +' : 'keeps −',
            540,
            y,
            28,
            r.col,
            'sans',
            'left',
          ),
        );
      });
      nodes.push(
        txt(
          sg > 0.2
            ? 'Weight gradient = (∂L/∂z) · x_j  →  a negative feature flips sign again!'
            : 'Multiply incoming sensitivity by each gate local slope',
          0,
          260,
          30,
          ROLE.dark,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beats 2-3): SwiGLU dual projections u=[1,-2], v=[3,-1] -> readout 0.858
  const view3 = guardedDynamic(
    () => fadeIn(beat2P.value),
    (vis) => {
      const ac = actP.value;
      const mt = matP.value;
      const pr = prdP.value;
      const ot = outP.value;
      return group(
        txt('SwiGLU DUAL PROJECTIONS', 0, -210, 28, ROLE.gate, 'mono'),
        txt('Projection u = xW = [1, −2]', -450, -135, 30, ROLE.dark, 'mono'),
        numCell(ac > 0.2 ? `[${act[0].toFixed(3)}, ${act[1].toFixed(3)}]` : 'SiLU(u)', -450, -50, {
          w: 440,
          h: 68,
          size: 32,
          stroke: ROLE.dark,
          textColor: ROLE.dark,
          glow: ac > 0.2 ? 10 : 0,
        }),
        txt('⊙', 0, -50, 48, ROLE.lit, 'mono'),
        txt('Projection v = xV = [3, −1]', 450, -135, 30, ROLE.gate, 'mono'),
        numCell('[3, −1]', 450, -50, {
          w: 360,
          h: 68,
          size: 32,
          stroke: ROLE.gate,
          textColor: ROLE.gate,
          glow: mt > 0.2 ? 10 : 0,
        }),
        txt(
          pr > 0.2
            ? `Elementwise product  r = [${prod[0].toFixed(3)},  +${prod[1].toFixed(3)}]   (both positive!)`
            : mt > 0.2
              ? 'Pair coordinate 1 (×3) and coordinate 2 (×−1)...'
              : 'Two separate projections multiply coordinate-by-coordinate',
          0,
          95,
          30,
          pr > 0.2 ? ROLE.lit : COSMOS.muted,
          'mono',
        ),
        txt(
          ot > 0.2 ? `0.5·r₁ − r₂ = ${readout.toFixed(2)}` : '0.5·r₁ − r₂ = ?',
          0,
          215,
          38,
          ot > 0.2 ? ROLE.good : COSMOS.dim,
          'mono',
        ).glow(ot > 0.2 ? 11 : 0, ROLE.good),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'activation-products-beat-0', b0P, 1, { dur: 1.0 });
  beatTo(s, c, 1, beat1P, 1, { dur: 0.8 });
  cueTo(s, c, 'activation-products-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'activation-signed-products', sgnP, 1, { dur: 0.7 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'activation-products-beat-2', b2P, 1, { dur: 0.7 });
  beatTo(s, c, 3, beat3P, 1, { dur: 0.7 });
  cueTo(s, c, 'activation-products-beat-3', b3P, 1, { dur: 0.65 });
  cueTo(s, c, 'nn-swiglu-activation', actP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'match-coordinates', matP, 1, { dur: 0.65 });
  cueTo(s, c, 'swiglu-product-values', prdP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'nn-swiglu-output', outP, 1, { dur: 0.7, after: true });
}

// ---------------------------------------------------------------------------
// 10. parameters: Nine adjustable values
// Cues: count-connections, six-weights, count-biases, nine-parameters
// ---------------------------------------------------------------------------
export function parameters(s, c) {
  const c1P = s.value(0);
  const w6P = s.value(0);
  const bP = s.value(0);
  const n9P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 10 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Nine Adjustable', 'Parameters'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'DENSE LAYER FORMULA:  (IN × OUT) + OUT',
  });

  const live = dynamic(() => {
    const c1 = c1P.value;
    const w6 = w6P.value;
    const bs = bP.value;
    const n9 = n9P.value;
    const nodes = [];

    const inNodes = [
      [-560, -105, 'x₁'],
      [-560, 105, 'x₂'],
    ];
    const hidNodes = [
      [-60, -105, 'h₁'],
      [-60, 105, 'h₂'],
    ];
    const outNode = [440, 0, 'z₂'];

    // 4 Layer-1 edges + 2 Layer-2 edges = 6 weights
    inNodes.forEach(([x0, y0]) => {
      hidNodes.forEach(([x1, y1]) => {
        nodes.push(
          line([x0 + 48, y0], [x1 - 48, y1], {
            stroke: c1 > 0.2 ? ROLE.dark : '#3b4e78',
            width: c1 > 0.2 ? 4 : 2.5,
          }).glow(c1 > 0.2 ? 8 : 0, ROLE.dark),
        );
      });
    });
    hidNodes.forEach(([x0, y0]) => {
      nodes.push(
        line([x0 + 48, y0], [outNode[0] - 48, outNode[1]], {
          stroke: w6 > 0.2 ? ROLE.lit : '#3b4e78',
          width: w6 > 0.2 ? 4 : 2.5,
        }).glow(w6 > 0.2 ? 9 : 0, ROLE.lit),
      );
    });

    // Draw neurons (with coral bias halos on computed units)
    inNodes.forEach(([x, y, lb]) => {
      nodes.push(
        circle(44, { fill: '#10182b', stroke: COSMOS.muted, width: 2.5 }).at(x, y),
        txt(lb, x, y + 2, 32, COSMOS.ink, 'mono'),
      );
    });
    hidNodes.forEach(([x, y, lb], idx) => {
      nodes.push(
        circle(46, {
          fill: '#101c33',
          stroke: bs > 0.2 ? ROLE.grad : ROLE.dark,
          width: bs > 0.2 ? 4 : 2.8,
        })
          .at(x, y)
          .glow(bs > 0.2 ? 12 : 4, bs > 0.2 ? ROLE.grad : ROLE.dark),
        txt(lb, x, y + 2, 32, COSMOS.ink, 'mono'),
        txt(`+b₁${idx + 1}`, x, y - 68, 26, ROLE.grad, 'mono').opacity(mix(0.3, 1, bs)),
      );
    });
    nodes.push(
      circle(48, {
        fill: '#221c0e',
        stroke: bs > 0.2 ? ROLE.grad : ROLE.lit,
        width: bs > 0.2 ? 4 : 3,
      })
        .at(outNode[0], outNode[1])
        .glow(bs > 0.2 ? 12 : 6, bs > 0.2 ? ROLE.grad : ROLE.lit),
      txt(outNode[2], outNode[0], outNode[1] + 2, 32, ROLE.lit, 'mono'),
      txt('+b₂', outNode[0], outNode[1] - 70, 26, ROLE.grad, 'mono').opacity(mix(0.3, 1, bs)),
    );

    // Right tally
    nodes.push(
      txt('PARAMETER TALLY', 700, -185, 26, COSMOS.muted, 'mono'),
      txt('W₁:  2×2 = 4', 700, -100, 30, ROLE.dark, 'mono'),
      txt('W₂:  2×1 = 2', 700, -35, 30, ROLE.lit, 'mono').opacity(mix(0.45, 1, w6)),
      txt('Biases: 2+1 = 3', 700, 30, 30, ROLE.grad, 'mono').opacity(mix(0.45, 1, bs)),
      txt(
        n9 > 0.2 ? 'TOTAL = 9' : w6 > 0.2 ? 'Weights = 6' : 'Count edges...',
        700,
        125,
        38,
        n9 > 0.2 ? ROLE.good : ROLE.lit,
        'mono',
      ).glow(n9 > 0.2 ? 11 : 0, ROLE.good),
      txt(
        'Input features are data; only connection weights and unit biases are learned',
        0,
        305,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'count-connections', c1P, 1, { dur: 0.7 });
  cueTo(s, c, 'six-weights', w6P, 1, { dur: 0.7 });
  cueTo(s, c, 'count-biases', bP, 1, { dur: 0.75 });
  cueTo(s, c, 'nine-parameters', n9P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 11. parameter-scale: Where are the parameters in an image classifier?
// Cues: parameter-scale-beat-0, parameter-scale-beat-1, nn-dense-first,
//       nn-dense-second, nn-dense-third, dense-count-values*, parameter-scale-beat-2
// ---------------------------------------------------------------------------
export function parameterScale(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const l1P = s.value(0);
  const l2P = s.value(0);
  const l3P = s.value(0);
  const totP = s.value(0);
  const convP = s.value(0);
  const drift = s.value(0);

  const n1 = 784 * 256 + 256; // 200,960
  const n2 = 256 * 128 + 128; // 32,896
  const n3 = 128 * 10 + 10; // 1,290
  const total = denseParameterCount([784, 256, 128, 10]); // 235,146

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 11 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Dense Parameter Explosion', 'on a 28 × 28 Image'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: '784 → 256 → 128 → 10  VS  SHARED SLIDING FILTER',
  });

  const live = dynamic(() => {
    const l1 = l1P.value;
    const l2 = l2P.value;
    const l3 = l3P.value;
    const tt = totP.value;
    const cv = convP.value;
    const barX = -320;
    const maxW = 1020;
    const nodes = [];

    const layers = [
      { name: '784 → 256', count: n1, y: -135, col: ROLE.dark, p: l1 },
      { name: '256 → 128', count: n2, y: -25, col: ROLE.gate, p: l2 },
      { name: '128 → 10', count: n3, y: 85, col: ROLE.lit, p: l3 },
    ];

    layers.forEach((L) => {
      const w = Math.max(12, (L.count / n1) * maxW * Math.max(0.08, L.p));
      nodes.push(
        txt(L.name, -800, L.y, 32, L.col, 'mono', 'left'),
        glowBar(barX, L.y, w, 46, L.col, { glow: 9, opacity: mix(0.35, 1, L.p) }),
        txt(
          L.p > 0.2 ? L.count.toLocaleString() : '?',
          barX + w + 26,
          L.y,
          30,
          L.col,
          'mono',
          'left',
        ),
      );
    });

    nodes.push(
      txt(
        tt > 0.2
          ? `TOTAL DENSE PARAMETERS:  ${total.toLocaleString()}   (85.5% in Layer 1 alone!)`
          : 'Layer 1 connects every one of 784 pixels to every one of 256 hidden units',
        0,
        205,
        34,
        tt > 0.2 ? ROLE.lit : COSMOS.muted,
        'mono',
      ).glow(tt > 0.2 ? 9 : 0, ROLE.lit),
      txt(
        cv > 0.2
          ? 'Convolution slides one small shared kernel across pixels instead of re-learning per position!'
          : 'Adding more requests adds activations & compute, NOT parameter count',
        0,
        305,
        29,
        cv > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'parameter-scale-beat-0', b0P, 1, { dur: 0.6 });
  cueTo(s, c, 'parameter-scale-beat-1', b1P, 1, { dur: 0.6 });
  cueTo(s, c, 'nn-dense-first', l1P, 1, { dur: 0.8 });
  cueTo(s, c, 'nn-dense-second', l2P, 1, { dur: 0.7 });
  cueTo(s, c, 'nn-dense-third', l3P, 1, { dur: 0.7 });
  cueTo(s, c, 'dense-count-values', totP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'parameter-scale-beat-2', convP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 12. batch: One parameter set serves a batch
// Cues: batch-hidden, batch-output
// ---------------------------------------------------------------------------
export function batch(s, c) {
  const hidP = s.value(0);
  const outP = s.value(0);
  const drift = s.value(0);

  const rows = REQUESTS.map((x) => requestForward(x));

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 12 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#6ee7b714'));

  const headline = heroTitle(['Batched Matrix Multiply', 'Shares All 9 Parameters'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'X (4, 2)  @  W₁ᵀ (2, 2)  →  H (4, 2)  →  P (4, 1)',
  });

  const live = dynamic(() => {
    const hd = hidP.value;
    const ot = outP.value;
    const nodes = [
      txt('REQUEST', -740, -200, 26, COSMOS.muted, 'mono'),
      txt('INPUT X (4, 2)', -390, -200, 26, ROLE.dark, 'mono'),
      txt('HIDDEN H (4, 2)', 110, -200, 26, ROLE.lit, 'mono'),
      txt('SCORE P (4, 1)', 610, -200, 26, ROLE.good, 'mono'),
      rule(-820, -162, 820, -162, '#2a3759', 2),
    ];

    rows.forEach((r, i) => {
      const y = -95 + i * 95;
      nodes.push(
        txt(REQUEST_IDS[i], -740, y, 28, COSMOS.ink, 'mono'),
        numCell(`[${r.x[0]}, ${r.x[1]}]`, -390, y, {
          w: 220,
          h: 62,
          stroke: ROLE.dark,
          textColor: ROLE.dark,
        }),
        numCell(hd > 0.2 ? `[${r.h[0].toFixed(1)}, ${r.h[1].toFixed(1)}]` : '[?, ?]', 110, y, {
          w: 250,
          h: 62,
          stroke: hd > 0.2 ? ROLE.lit : '#2b3b60',
          textColor: hd > 0.2 ? ROLE.lit : COSMOS.dim,
          glow: hd > 0.2 ? 8 : 0,
        }),
        numCell(ot > 0.2 ? r.score.toFixed(3) : '?', 610, y, {
          w: 190,
          h: 62,
          stroke: ot > 0.2 ? ROLE.good : '#2b3b60',
          textColor: ot > 0.2 ? ROLE.good : COSMOS.dim,
          glow: ot > 0.2 ? 10 : 0,
        }),
      );
    });

    nodes.push(
      txt(
        'Every row keeps its order; broadcasting reuses the bias vector across the batch',
        0,
        315,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'batch-hidden', hidP, 1, { dur: 0.85 });
  cueTo(s, c, 'batch-output', outP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 13. transpose: A valid shape can hide the wrong multiply
// Cues: transpose-question, transpose-answer*
// ---------------------------------------------------------------------------
export function transpose(s, c) {
  const qP = s.value(0);
  const aP = s.value(0);
  const drift = s.value(0);

  const ex = transposeExample([2, 5]); // right=[0.1, 3.2], wrong=[1.1, 2.8]

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 13 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1a', '#6ee7b714'));

  const headline = heroTitle(['Silent Square-Matrix', 'Transpose Bug'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'BOTH PRODUCE SHAPE (2,)  ·  ONLY ONE MATCHES THE NEURON ROWS',
  });

  const live = dynamic(() => {
    const an = aP.value;
    return group(
      // Left: Correct x @ W1^T
      txt('TRANSPOSED:  x @ W₁ᵀ  (ROW PER NEURON)', -440, -195, 28, ROLE.good, 'mono'),
      txt('h₁ = 2(0.3) + 5(−0.1)', -440, -95, 30, COSMOS.ink, 'mono'),
      txt('h₂ = 2(0.1) + 5(0.6)', -440, -25, 30, COSMOS.ink, 'mono'),
      numCell(
        an > 0.2 ? `[${ex.right[0].toFixed(1)},  ${ex.right[1].toFixed(1)}]` : '[?,  ?]',
        -440,
        95,
        {
          w: 290,
          h: 82,
          size: 38,
          stroke: an > 0.2 ? ROLE.good : '#2b3b60',
          textColor: an > 0.2 ? ROLE.good : COSMOS.dim,
          glow: an > 0.2 ? 12 : 0,
        },
      ),
      txt(
        an > 0.2 ? 'MATCHES HAND TRACE!' : 'Shape: (2,)',
        -440,
        195,
        28,
        an > 0.2 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      rule(0, -205, 0, 225, '#2a3759', 2),

      // Right: Wrong x @ W1 (forgets transpose, still legal shape!)
      txt('UNTRANSPOSED:  x @ W₁  (SILENT BUG)', 440, -195, 28, ROLE.grad, 'mono'),
      txt('h₁ = 2(0.3) + 5(0.1)', 440, -95, 30, COSMOS.ink, 'mono'),
      txt('h₂ = 2(−0.1) + 5(0.6)', 440, -25, 30, COSMOS.ink, 'mono'),
      numCell(
        an > 0.2 ? `[${ex.wrong[0].toFixed(1)},  ${ex.wrong[1].toFixed(1)}]` : '[?,  ?]',
        440,
        95,
        {
          w: 290,
          h: 82,
          size: 38,
          stroke: an > 0.2 ? ROLE.grad : '#2b3b60',
          textColor: an > 0.2 ? ROLE.grad : COSMOS.dim,
          glow: an > 0.2 ? 12 : 0,
        },
      ),
      txt(
        an > 0.2 ? 'WRONG NUMBERS, LEGAL SHAPE!' : 'Shape: (2,)',
        440,
        195,
        28,
        an > 0.2 ? ROLE.grad : COSMOS.muted,
        'mono',
      ),

      txt(
        an > 0.2
          ? 'Always verify a non-symmetric sample by hand; shape checks alone miss W₁ vs W₁ᵀ!'
          : 'Will x @ W₁ᵀ and x @ W₁ produce the same hidden values?',
        0,
        310,
        30,
        an > 0.2 ? ROLE.lit : COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'transpose-question', qP, 1, { dur: 0.7 });
  cueTo(s, c, 'transpose-answer', aP, 1, { dur: 0.75, after: true });
}
