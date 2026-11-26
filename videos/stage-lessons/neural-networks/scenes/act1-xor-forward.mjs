// Act 1 (Scenes 1-6): XOR Lamp Puzzle, Affine Layer Collapse, ReLU Hinges & 3D Tent Surface,
// Single-Neuron Scorer, 2-2-1 Forward Pass, Affine Symmetry Witness.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PARAMETERS,
  ROLE,
  affineWitness,
  cinemaGrid,
  cinematic3d,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  forward,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  orbitScene,
  point3d,
  requestForward,
  rule,
  sigmoid,
  surface,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. puzzle: When does this bulb light up? (XOR Geometry)
// Cues: first-switch, other-switch, both-switches, boundary-attempt,
//       cut-verdict*, join-lit, join-dark, midpoint*
// ---------------------------------------------------------------------------
export function puzzle(s, c) {
  const s1P = s.value(0);
  const s2P = s.value(0);
  const bothP = s.value(0);
  const cutP = s.value(0);
  const verdP = s.value(0);
  const litP = s.value(0);
  const drkP = s.value(0);
  const midP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 1 }));
  s.add(decorAura(-440, 20, 480, '#ffd16622', '#5ce1e614'));

  const headline = heroTitle(['Four Corners,', 'No Straight Cut'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'EXCLUSIVE-OR (XOR)  ·  SWITCHES A & B',
  });

  const live = dynamic(() => {
    const p1 = s1P.value;
    const p2 = s2P.value;
    const bt = bothP.value;
    const ct = cutP.value;
    const vd = verdP.value;
    const jl = litP.value;
    const jd = drkP.value;
    const md = midP.value;
    const nodes = [];

    // Left: Living switch bench & glowing bulb
    const swA = bt > 0.2 ? 1 : p1 > 0.2 ? 0 : 1;
    const swB = p2 > 0.2 ? 1 : 0;
    const isLit = (swA ^ swB) === 1;
    const bx = -500;
    const by = -65;

    nodes.push(
      txt('BENCH CIRCUIT', bx, -210, 28, COSMOS.muted, 'mono'),
      circle(88, {
        fill: isLit ? '#3a2d0a' : '#0f1628',
        stroke: isLit ? ROLE.lit : '#2f4168',
        width: 4,
      })
        .at(bx, by)
        .glow(isLit ? 20 : 0, ROLE.lit),
      txt(isLit ? 'LIT' : 'DARK', bx, by + 2, 38, isLit ? ROLE.lit : COSMOS.dim, 'mono'),
      glowBadge(`A = ${swA}`, bx - 125, 100, swA ? ROLE.lit : COSMOS.dim, {
        w: 185,
        h: 56,
        size: 30,
      }),
      glowBadge(`B = ${swB}`, bx + 125, 100, swB ? ROLE.lit : COSMOS.dim, {
        w: 185,
        h: 56,
        size: 30,
      }),
      txt(
        md > 0.2
          ? 'Midpoint (0.5, 0.5) must lie on BOTH sides at once!'
          : vd > 0.2
            ? 'Line predicts LIT at (1, 1), yet bulb is DARK!'
            : 'Either switch alone lights the bulb',
        bx,
        225,
        28,
        md > 0.2 ? ROLE.grad : vd > 0.2 ? ROLE.grad : COSMOS.ink,
        'serif',
      ),
    );

    // Right: 2D corner square (0,0), (1,0), (0,1), (1,1) + candidate line + crossing segments
    const gx0 = 120;
    const gx1 = 620;
    const gy0 = 210;
    const gy1 = -180;
    const xOf = (a) => mix(gx0, gx1, a);
    const yOf = (b) => mix(gy0, gy1, b);

    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 2.8),
      rule(gx0, gy0, gx0, gy1, '#3b4e78', 2.8),
      txt('Switch A', (gx0 + gx1) / 2, gy0 + 48, 26, COSMOS.muted, 'mono'),
      txt('B = 1', gx0 - 34, gy1, 26, COSMOS.muted, 'mono', 'right'),
      txt('B = 0', gx0 - 34, gy0, 26, COSMOS.muted, 'mono', 'right'),
    );

    // Candidate straight cut separating (0,0) from {(1,0), (0,1)} (but trapping (1,1) on lit side!)
    if (ct > 0.05 && jl < 0.3) {
      nodes.push(
        line([xOf(0.55), yOf(-0.08)], [xOf(-0.08), yOf(0.55)], {
          stroke: ROLE.lit,
          width: 4,
          dash: [10, 7],
        })
          .glow(10, ROLE.lit)
          .opacity(ct),
        txt('candidate cut', xOf(0.55), yOf(0.55) - 18, 26, ROLE.lit, 'mono', 'left').opacity(ct),
      );
    }

    // Crossing diagonals proof
    if (jl > 0.05) {
      nodes.push(
        line([xOf(1), yOf(0)], [xOf(0), yOf(1)], { stroke: ROLE.lit, width: 4.5 })
          .glow(10, ROLE.lit)
          .opacity(jl),
      );
    }
    if (jd > 0.05) {
      nodes.push(
        line([xOf(0), yOf(0)], [xOf(1), yOf(1)], { stroke: ROLE.dark, width: 4.5 })
          .glow(10, ROLE.dark)
          .opacity(jd),
      );
    }
    if (md > 0.05) {
      nodes.push(
        glowDot(xOf(0.5), yOf(0.5), { radius: 15, color: ROLE.grad, glow: 14, opacity: md }),
        txt('SHARED MIDPOINT (0.5, 0.5)', (gx0 + gx1) / 2, gy1 - 52, 26, ROLE.grad, 'mono').opacity(
          md,
        ),
      );
    }

    // 4 XOR corner dots
    const corners = [
      { a: 1, b: 0, lit: true, show: 1, tag: '(1,0)' },
      { a: 0, b: 0, lit: false, show: Math.max(0.35, p1), tag: '(0,0)' },
      { a: 0, b: 1, lit: true, show: Math.max(0.35, p2), tag: '(0,1)' },
      { a: 1, b: 1, lit: false, show: Math.max(0.35, bt), tag: '(1,1)' },
    ];
    corners.forEach((pt) => {
      const px = xOf(pt.a);
      const py = yOf(pt.b);
      const col = pt.lit ? ROLE.lit : ROLE.dark;
      nodes.push(
        glowDot(px, py, { radius: 16, color: col, glow: 12, opacity: pt.show }),
        txt(pt.tag, px + (pt.a ? 54 : -54), py + (pt.b ? -38 : 38), 26, col, 'mono').opacity(
          pt.show,
        ),
      );
    });

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'first-switch', s1P, 1, { dur: 0.65 });
  cueTo(s, c, 'other-switch', s2P, 1, { dur: 0.65 });
  cueTo(s, c, 'both-switches', bothP, 1, { dur: 0.65 });
  cueTo(s, c, 'boundary-attempt', cutP, 1, { dur: 0.8 });
  cueTo(s, c, 'cut-verdict', verdP, 1, { dur: 0.6, after: true });
  cueTo(s, c, 'join-lit', litP, 1, { dur: 0.75 });
  cueTo(s, c, 'join-dark', drkP, 1, { dur: 0.75 });
  cueTo(s, c, 'midpoint', midP, 1, { dur: 0.65, after: true });
}

// ---------------------------------------------------------------------------
// 2. collapse: More affine layers still make one affine map
// Cues: affine-first, affine-second, affine-example, affine-value-input, merge-layers
// ---------------------------------------------------------------------------
export function collapse(s, c) {
  const f1P = s.value(0);
  const f2P = s.value(0);
  const exP = s.value(0);
  const inP = s.value(0);
  const mrgP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 2 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Stacking Affine Layers', 'Collapses to One'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'WHY NONLINEAR ACTIVATIONS ARE MANDATORY',
  });

  const live = dynamic(() => {
    const f1 = f1P.value;
    const f2 = f2P.value;
    const ex = Math.max(exP.value, inP.value);
    const mg = mrgP.value;
    const xVal = 2;
    const hVal = 2 * xVal + 1; // 5
    const yVal = 3 * hVal - 2; // 13
    const nodes = [];

    // Two affine boxes sliding together into one merged 6x + 1 block (strict non-overlapping fade)
    const x1 = mix(-320, -240, Math.min(1, mg * 2));
    const x2 = mix(320, 240, Math.min(1, mg * 2));

    nodes.push(
      numCell(`x = ${xVal}`, -720, -40, {
        w: 170,
        h: 72,
        stroke: ROLE.dark,
        textColor: ROLE.dark,
        glow: ex > 0.2 ? 10 : 4,
      }),
      numCell(`y = ${yVal}`, 720, -40, {
        w: 170,
        h: 72,
        stroke: ROLE.lit,
        textColor: ROLE.lit,
        glow: 10,
      }),
    );

    const outOp = fadeOut(mg);
    if (outOp > 0.02) {
      nodes.push(
        group(
          rule(-630, -40, x1 - 155, -40, ROLE.dark, 3),
          rect(300, 108, { fill: '#101c33', stroke: ROLE.dark, width: 3, radius: 14 })
            .at(x1, -40)
            .glow(10 * Math.max(0.3, f1), ROLE.dark),
          txt('Layer 1:  2x + 1', x1, -56, 30, ROLE.dark, 'mono'),
          txt(ex > 0.2 ? `→ ${hVal}` : 'double + 1', x1, -12, 28, COSMOS.ink, 'mono'),

          rule(x1 + 155, -40, x2 - 155, -40, ROLE.gate, 3),
          rect(300, 108, { fill: '#1a1533', stroke: ROLE.gate, width: 3, radius: 14 })
            .at(x2, -40)
            .glow(10 * Math.max(0.3, f2), ROLE.gate),
          txt('Layer 2:  3h − 2', x2, -56, 30, ROLE.gate, 'mono'),
          txt(ex > 0.2 ? `→ ${yVal}` : 'triple − 2', x2, -12, 28, COSMOS.ink, 'mono'),
          rule(x2 + 155, -40, 630, -40, ROLE.lit, 3),
        ).opacity(outOp),
      );
    }

    const inOp = fadeIn(mg);
    if (inOp > 0.02) {
      nodes.push(
        group(
          rule(-630, -40, -225, -40, ROLE.lit, 3.5),
          rect(440, 120, { fill: '#221c0e', stroke: ROLE.lit, width: 3.6, radius: 16 })
            .at(0, -40)
            .glow(14, ROLE.lit),
          txt('SINGLE MAP:  6x + 1', 0, -56, 34, ROLE.lit, 'mono'),
          txt('3(2x + 1) − 2 = 6x + 1', 0, -8, 28, COSMOS.ink, 'mono'),
          rule(225, -40, 630, -40, ROLE.lit, 3.5),
        ).opacity(inOp),
      );
    }

    nodes.push(
      glowTex('W_2(W_1 x + b_1) + b_2 = (W_2 W_1) x + (W_2 b_1 + b_2)', {
        x: 0,
        y: 160,
        size: 42,
        color: mg > 0.35 ? ROLE.lit : COSMOS.muted,
      }),
      txt(
        mg > 0.35
          ? 'No matter how deep, pure affine layers stay one straight cut; add a bend!'
          : 'Follow x through two consecutive affine layers...',
        0,
        290,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'affine-first', f1P, 1, { dur: 0.7 });
  cueTo(s, c, 'affine-second', f2P, 1, { dur: 0.7 });
  cueTo(s, c, 'affine-example', exP, 1, { dur: 0.65 });
  cueTo(s, c, 'affine-value-input', inP, 1, { dur: 0.65 });
  cueTo(s, c, 'merge-layers', mrgP, 1, { dur: 0.95 });
}

// ---------------------------------------------------------------------------
// 3. hinges: Where should the lamp response bend? (SIGNATURE 3D XOR TENT)
// Cues: lamp-sweep, second-hinge, lamp-subtract, halfway-answer*
// ---------------------------------------------------------------------------
export function hinges(s, c) {
  const swP = s.value(0);
  const h2P = s.value(0);
  const subP = s.value(0);
  const halfP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 3 }));
  s.add(decorAura(390, 20, 480, '#ffd16622', '#5ce1e614'));

  const headline = heroTitle(['Two ReLU Hinges', 'Fold XOR into a Tent'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'y = ReLU(A + B) − 2 · ReLU(A + B − 1)',
  });

  // Right: Orbiting 3D XOR Tent Surface over (A, B) in [0, 1]^2
  const view3d = cinematic3d({
    theta: -0.72,
    phi: 1.06,
    distance: 11.5,
    unit: 135,
    focus: [0, 0, 0.5],
  }).at(430, 35);

  view3d.add(
    surface(
      (u, v) => {
        const a = (u + 1.5) / 3;
        const b = (v + 1.5) / 3;
        return forward([a, b]).y * 1.45;
      },
      {
        x: [-1.5, 1.5],
        y: [-1.5, 1.5],
        resolution: [26, 26],
        colors: ['#0a1630', '#1c4478', '#2f8ec4', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.18,
        meshWidth: 0.6,
        opacity: 0.9,
      },
    ),
    // Four binary corners on the 3D surface
    point3d([-1.5, -1.5, 0], { color: ROLE.dark, radius: 11, glow: 12 }),
    point3d([1.5, 1.5, 0], { color: ROLE.dark, radius: 11, glow: 12 }),
    point3d([-1.5, 1.5, 1.45], { color: ROLE.lit, radius: 12, glow: 14 }),
    point3d([1.5, -1.5, 1.45], { color: ROLE.lit, radius: 12, glow: 14 }),
    // Halfway dimmer peak (0.5, 0.5) -> height 1.0!
    point3d([0, 0, 1.45], { color: ROLE.good, radius: 12, glow: 14 }),
  );

  const live = dynamic(() => {
    const sw = swP.value;
    const h2 = h2P.value;
    const sb = subP.value;
    const hf = halfP.value;
    const coeff = -2 * sb;
    const nodes = [];

    // Left: 2D hinge plot vs total switch sum s = A + B in [0, 2]
    const gx0 = -800;
    const gx1 = -90;
    const gy0 = 165;
    const gy1 = -165;
    const xOf = (val) => mix(gx0, gx1, val / 2);
    const yOf = (val) => mix(gy0, gy1, val / 2.1);

    nodes.push(
      rule(gx0, gy0, gx1, gy0, '#3b4e78', 3),
      rule(gx0, gy0, gx0, gy1, '#3b4e78', 3),
      txt('0', xOf(0), gy0 + 40, 26, COSMOS.muted, 'mono'),
      txt('1', xOf(1), gy0 + 40, 26, ROLE.lit, 'mono'),
      txt('2', xOf(2), gy0 + 40, 26, COSMOS.muted, 'mono'),
      txt('sum s = A + B', (gx0 + gx1) / 2, gy0 + 82, 26, COSMOS.muted, 'mono'),
      txt('2', gx0 - 22, yOf(2), 26, COSMOS.muted, 'mono', 'right'),
      txt('1', gx0 - 22, yOf(1), 26, ROLE.lit, 'mono', 'right'),
    );

    // Hinge 1: ReLU(s)
    const h1Pts = [
      [xOf(0), yOf(0)],
      [xOf(1), yOf(1)],
      [xOf(2), yOf(2)],
    ];
    nodes.push(glowingTrail(h1Pts, { color: ROLE.dark, width: 3.2, glow: 6, opacity: 0.6 }));

    // Hinge 2: ReLU(s - 1)
    if (h2 > 0.05) {
      const h2Pts = [
        [xOf(0), yOf(0)],
        [xOf(1), yOf(0)],
        [xOf(2), yOf(1)],
      ];
      nodes.push(
        glowingTrail(h2Pts, { color: ROLE.gate, width: 3.2, glow: 6, opacity: 0.75 * h2 }),
      );
    }

    // Combined tent: ReLU(s) + coeff * ReLU(s - 1)
    const combPts = [
      [xOf(0), yOf(0)],
      [xOf(1), yOf(1)],
      [xOf(2), yOf(2 + coeff)],
    ];
    nodes.push(glowingTrail(combPts, { color: ROLE.lit, width: 5, glow: 12 }));

    // Moving probe along s
    const sPos = hf > 0.1 ? 1.0 : mix(0, 2, sw);
    const yPos = sPos + coeff * Math.max(0, sPos - 1);
    nodes.push(
      glowDot(xOf(sPos), yOf(yPos), {
        radius: 13,
        color: hf > 0.1 ? ROLE.good : ROLE.lit,
        glow: 13,
      }),
    );

    nodes.push(
      txt(
        hf > 0.2
          ? 'Dimmers (0.5, 0.5): sum = 1 → ReLU(1) − 2·0 = 1.0 (FULL BRIGHTNESS!)'
          : sb > 0.2
            ? 'Subtract 2 × Hinge 2: left arm holds at 1, right arm folds to 0!'
            : 'Sweep s = A + B from 0 → 1 → 2',
        0,
        320,
        30,
        hf > 0.2 ? ROLE.good : ROLE.lit,
        'serif',
      ),
      txt('3D XOR TENT SURFACE', 430, 250, 26, ROLE.dark, 'mono'),
    );

    return group(...nodes);
  });

  s.add(headline, view3d, live);
  orbitScene(s, c, view3d, { theta: -0.72, phi: 1.06, deltaTheta: 0.48, deltaPhi: 0.08 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lamp-sweep', swP, 1, { dur: 0.9 });
  cueTo(s, c, 'second-hinge', h2P, 1, { dur: 0.8 });
  cueTo(s, c, 'lamp-subtract', subP, 1, { dur: 0.95 });
  cueTo(s, c, 'halfway-answer', halfP, 1, { dur: 0.7, after: true });
}

// ---------------------------------------------------------------------------
// 4. scorer: The same building block scores a request
// Cues: weighted-features, shift-baseline, sigmoid-score, timeout-score*
// ---------------------------------------------------------------------------
export function scorer(s, c) {
  const wfP = s.value(0);
  const bsP = s.value(0);
  const sigP = s.value(0);
  const scP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 4 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#6ee7b714'));

  const headline = heroTitle(['Weighted Sum, Bias', '& Sigmoid Probability'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'PROMPT = 6 (×0.7)  ·  QUEUE = 8 (×0.3)  ·  BIAS = −4',
  });

  const live = dynamic(() => {
    const wf = wfP.value;
    const bs = bsP.value;
    const sg = sigP.value;
    const sc = scP.value;
    const sumNow = mix(0, 4.2 + 2.4, wf) - 4 * bs; // 0 -> 6.6 -> 2.6
    const pNow = sigmoid(2.6); // 0.9309
    const nodes = [];

    // Left: Accumulation ruler from -4 to +7
    const x0 = -800;
    const x1 = 40;
    const yAxis = -55;
    const xOf = (v) => mix(x0, x1, (v + 4.5) / 12);

    nodes.push(
      txt('LOGIT ACCUMULATION  z = wᵀx + b', x0, -185, 28, ROLE.dark, 'mono', 'left'),
      rule(x0, yAxis, x1, yAxis, '#3b4e78', 3.2),
      line([xOf(0), yAxis - 22], [xOf(0), yAxis + 22], { stroke: COSMOS.muted, width: 2.4 }),
      txt('0', xOf(0), yAxis + 52, 26, COSMOS.muted, 'mono'),
      txt('−4', xOf(-4), yAxis + 52, 26, ROLE.grad, 'mono'),
      txt('6.6', xOf(6.6), yAxis + 52, 26, ROLE.dark, 'mono'),
      // Prompt + Queue bar
      glowBar(xOf(0), yAxis - 20, (xOf(4.2) - xOf(0)) * Math.max(0.15, wf), 22, ROLE.dark, {
        glow: 7,
      }),
      glowBar(xOf(4.2), yAxis - 20, (xOf(6.6) - xOf(4.2)) * Math.max(0.15, wf), 22, ROLE.gate, {
        glow: 7,
      }),
      // Current logit needle
      glowDot(xOf(sumNow), yAxis, { radius: 13, color: ROLE.lit, glow: 13 }),
      txt(`z = ${sumNow.toFixed(1)}`, xOf(sumNow), yAxis - 62, 32, ROLE.lit, 'mono').glow(
        9,
        ROLE.lit,
      ),
      // Exact term breakdown below axis
      txt('Prompt:  6 × 0.7 = +4.2', x0, 80, 30, ROLE.dark, 'mono', 'left'),
      txt('Queue:   8 × 0.3 = +2.4', x0, 138, 30, ROLE.gate, 'mono', 'left'),
      txt('Bias:    baseline = −4.0', x0, 196, 30, ROLE.grad, 'mono', 'left').opacity(
        mix(0.45, 1, bs),
      ),
    );

    // Right: Sigmoid curve mapping z = 2.6 -> 0.931
    const gx0 = 190;
    const gx1 = 800;
    const gy0 = 185;
    const gy1 = -165;
    const sx = (z) => mix(gx0, gx1, (z + 5) / 10);
    const sy = (p) => mix(gy0, gy1, p);
    const pts = [];
    for (let i = 0; i <= 48; i += 1) {
      const z = mix(-5, 5, i / 48);
      pts.push([sx(z), sy(sigmoid(z))]);
    }
    nodes.push(
      group(
        txt('SIGMOID  σ(z) = 1 / (1 + e⁻ᶻ)', gx0, -235, 26, ROLE.good, 'mono', 'left'),
        rule(gx0, gy0, gx1, gy0, '#3b4e78', 2.6),
        rule(sx(0), gy0, sx(0), gy1, '#2a3759', 2),
        glowingTrail(pts, { color: ROLE.good, width: 4, glow: 10 }),
        glowDot(sx(2.6), sy(pNow), { radius: 13, color: ROLE.good, glow: 13 }),
        txt(
          sc > 0.2 ? `σ(2.6) ≈ ${pNow.toFixed(2)}` : 'σ(2.6) = ?',
          sx(2.6),
          gy0 + 52,
          30,
          ROLE.good,
          'mono',
          'center',
        ).glow(sc > 0.2 ? 9 : 0, ROLE.good),
      ).opacity(mix(0.45, 1, sg)),
    );

    nodes.push(
      txt(
        sc > 0.2
          ? 'Score ≈ 0.93: verify as a true probability against actual timeout frequency'
          : 'Weights set feature slopes; bias shifts baseline; sigmoid bounds output to (0, 1)',
        0,
        310,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'weighted-features', wfP, 1, { dur: 0.9 });
  cueTo(s, c, 'shift-baseline', bsP, 1, { dur: 0.9 });
  cueTo(s, c, 'sigmoid-score', sigP, 1, { dur: 0.8 });
  cueTo(s, c, 'timeout-score', scP, 1, { dur: 0.65, after: true });
}

// ---------------------------------------------------------------------------
// 5. forward: Follow one request through two layers
// Cues: first-dot, first-dot-result, second-dot, second-dot-result, output-dot
// ---------------------------------------------------------------------------
export function forwardScene(s, c) {
  const d1P = s.value(0);
  const r1P = s.value(0);
  const d2P = s.value(0);
  const r2P = s.value(0);
  const outP = s.value(0);
  const drift = s.value(0);

  const trace = requestForward([2, 5]); // z1=[0.1, 3.2], z2=-0.14, score=0.465

  s.add(cinemaGrid({ accent: ROLE.dark, seed: 5 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Two-Layer Forward Trace', 'One Neuron per Row'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dark,
    eyebrow: 'INPUT x = [2, 5]  ·  PYTORCH ROW-MAJOR WEIGHTS W₁',
  });

  const live = dynamic(() => {
    const d1 = d1P.value;
    const r1 = r1P.value;
    const d2 = d2P.value;
    const r2 = r2P.value;
    const ot = outP.value;
    const nodes = [];

    // Column 1: Input x = [2, 5]
    nodes.push(
      txt('INPUT x', -720, -195, 26, ROLE.dark, 'mono'),
      numCell('2', -720, -75, { w: 120, h: 66, stroke: ROLE.dark, textColor: ROLE.dark, glow: 8 }),
      numCell('5', -720, 95, { w: 120, h: 66, stroke: ROLE.dark, textColor: ROLE.dark, glow: 8 }),
      txt('prompt', -720, -12, 26, COSMOS.muted, 'mono'),
      txt('queue', -720, 158, 26, COSMOS.muted, 'mono'),
    );

    // Column 2: Weight matrix W1 rows
    nodes.push(
      txt('WEIGHT ROWS  W₁', -280, -195, 26, ROLE.gate, 'mono'),
      numCell('[0.3, −0.1]', -280, -75, {
        w: 260,
        h: 66,
        stroke: d1 > 0.2 ? ROLE.dark : '#2b3b60',
        textColor: d1 > 0.2 ? ROLE.dark : COSMOS.ink,
        glow: d1 > 0.2 ? 10 : 0,
      }),
      numCell('[0.1,  0.6]', -280, 95, {
        w: 260,
        h: 66,
        stroke: d2 > 0.2 ? ROLE.gate : '#2b3b60',
        textColor: d2 > 0.2 ? ROLE.gate : COSMOS.ink,
        glow: d2 > 0.2 ? 10 : 0,
      }),
    );

    // Column 3: Hidden ReLU activations h = [0.1, 3.2]
    nodes.push(
      txt('HIDDEN h = ReLU(z₁)', 190, -195, 26, ROLE.good, 'mono'),
      numCell(r1 > 0.2 ? trace.h[0].toFixed(1) : '?', 190, -75, {
        w: 150,
        h: 66,
        stroke: r1 > 0.2 ? ROLE.good : '#2b3b60',
        textColor: r1 > 0.2 ? ROLE.good : COSMOS.dim,
        glow: r1 > 0.2 ? 10 : 0,
      }),
      numCell(r2 > 0.2 ? trace.h[1].toFixed(1) : '?', 190, 95, {
        w: 150,
        h: 66,
        stroke: r2 > 0.2 ? ROLE.good : '#2b3b60',
        textColor: r2 > 0.2 ? ROLE.good : COSMOS.dim,
        glow: r2 > 0.2 ? 10 : 0,
      }),
    );

    // Column 4: Output logit z2 = -0.14 -> score = 0.465
    nodes.push(
      txt('OUTPUT σ(z₂)', 640, -195, 26, ROLE.lit, 'mono'),
      numCell(ot > 0.2 ? trace.score.toFixed(3) : '?', 640, 10, {
        w: 210,
        h: 82,
        size: 36,
        stroke: ot > 0.2 ? ROLE.lit : '#2b3b60',
        textColor: ot > 0.2 ? ROLE.lit : COSMOS.dim,
        glow: ot > 0.2 ? 12 : 0,
      }),
      txt(
        ot > 0.2 ? `z₂ = ${trace.z2.toFixed(2)}` : 'w₂=[0.4, 0.1], b₂=−0.5',
        640,
        102,
        26,
        ot > 0.2 ? ROLE.lit : COSMOS.muted,
        'mono',
      ),
    );

    // Connecting glowing wires
    nodes.push(
      line([-655, -75], [-415, -75], { stroke: ROLE.dark, width: 3 }),
      line([-655, 95], [-415, 95], { stroke: ROLE.gate, width: 3 }),
      line([-145, -75], [110, -75], { stroke: ROLE.good, width: 3 }),
      line([-145, 95], [110, 95], { stroke: ROLE.good, width: 3 }),
      line([270, -75], [530, 10], { stroke: ROLE.lit, width: 3 }),
      line([270, 95], [530, 10], { stroke: ROLE.lit, width: 3 }),
    );

    nodes.push(
      txt(
        ot > 0.2
          ? '0.4(0.1) + 0.1(3.2) − 0.5 = −0.14  →  σ(−0.14) = 0.465'
          : r2 > 0.2
            ? 'Row 2: 0.1(2) + 0.6(5) = 3.2  (positive → ReLU keeps both!)'
            : r1 > 0.2
              ? 'Row 1: 0.3(2) − 0.1(5) = 0.1  (slightly positive)'
              : 'Row 1: 0.3(2) − 0.1(5) = ?',
        0,
        295,
        30,
        COSMOS.ink,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'first-dot', d1P, 1, { dur: 0.65 });
  cueTo(s, c, 'first-dot-result', r1P, 1, { dur: 0.65 });
  cueTo(s, c, 'second-dot', d2P, 1, { dur: 0.65 });
  cueTo(s, c, 'second-dot-result', r2P, 1, { dur: 0.65 });
  cueTo(s, c, 'output-dot', outP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 6. affine-identity: Could one affine layer replace this network?
// Cues: affine-identity-beat-0, affine-identity-beat-1, affine-witness-values,
//       nn-affine-negative, nn-affine-zero, affine-identity-beat-2*
// ---------------------------------------------------------------------------
export function affineIdentity(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const posP = s.value(0);
  const negP = s.value(0);
  const zerP = s.value(0);
  const ansP = s.value(0);
  const drift = s.value(0);

  const w = affineWitness(); // pos=-0.21, neg=-0.50, zero=-0.50 -> pair=-0.71 vs 2*zero=-1.00

  s.add(cinemaGrid({ accent: ROLE.lit, seed: 6 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#ff6b8b14'));

  const headline = heroTitle(['Affine Symmetry Witness:', 'Three Points Settle It'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.lit,
    eyebrow: 'IF AFFINE:  f(x) + f(−x) = 2 · f(0)',
  });

  const live = dynamic(() => {
    const ps = posP.value;
    const ng = negP.value;
    const zr = zerP.value;
    const an = ansP.value;
    const nodes = [];

    // 3 probes in a clean horizontal row
    const probes = [
      { tag: 'f(+1, +4)', val: w.positive.toFixed(2), show: ps, x: -540, col: ROLE.dark },
      { tag: 'f(−1, −4)', val: w.negative.toFixed(2), show: ng, x: 0, col: ROLE.gate },
      { tag: 'f(0, 0)', val: w.zero.toFixed(2), show: zr, x: 540, col: ROLE.good },
    ];
    probes.forEach((p) => {
      nodes.push(
        txt(p.tag, p.x, -165, 32, p.col, 'mono'),
        numCell(p.show > 0.2 ? p.val : '?', p.x, -75, {
          w: 220,
          h: 78,
          size: 38,
          stroke: p.show > 0.2 ? p.col : '#2b3b60',
          textColor: p.show > 0.2 ? p.col : COSMOS.dim,
          glow: p.show > 0.2 ? 10 : 0,
        }),
      );
    });

    // Bottom comparison: f(x)+f(-x) vs 2*f(0) (strictly withheld until affine-identity-beat-2!)
    nodes.push(
      rule(-740, 45, 740, 45, '#2a3759', 2.2),
      txt('SUM  f(x) + f(−x)', -420, 115, 28, ROLE.lit, 'mono'),
      txt(
        an > 0.2 ? `${w.pair.toFixed(2)}` : '?',
        -420,
        190,
        52,
        an > 0.2 ? ROLE.lit : COSMOS.dim,
        'mono',
      ).glow(an > 0.2 ? 12 : 0, ROLE.lit),

      txt(an > 0.2 ? '≠' : 'vs', 0, 190, 56, an > 0.2 ? ROLE.grad : COSMOS.muted, 'mono').glow(
        an > 0.2 ? 10 : 0,
        ROLE.grad,
      ),

      txt('TWICE ZERO  2 · f(0)', 420, 115, 28, ROLE.good, 'mono'),
      txt(
        an > 0.2 ? `${w.doubleZero.toFixed(2)}` : '?',
        420,
        190,
        52,
        an > 0.2 ? ROLE.good : COSMOS.dim,
        'mono',
      ).glow(an > 0.2 ? 12 : 0, ROLE.good),

      txt(
        an > 0.2
          ? '−0.71 ≠ −1.00: rules out EVERY single-affine replacement for this network!'
          : 'Does f(1, 4) + f(−1, −4) equal 2 · f(0, 0)?',
        0,
        305,
        30,
        an > 0.2 ? ROLE.grad : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'affine-identity-beat-0', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'affine-identity-beat-1', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'affine-witness-values', posP, 1, { dur: 0.7 });
  cueTo(s, c, 'nn-affine-negative', negP, 1, { dur: 0.7 });
  cueTo(s, c, 'nn-affine-zero', zerP, 1, { dur: 0.7 });
  cueTo(s, c, 'affine-identity-beat-2', ansP, 1, { dur: 0.75, after: true });
}
