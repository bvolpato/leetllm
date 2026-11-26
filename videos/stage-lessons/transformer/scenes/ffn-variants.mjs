// Scene 14: ffn-variants: "What changes inside one token's row?"
// View 1 (Beat 0): Two affine maps collapse to straight line 6x + 1 (-1 -> -5) until ReLU clips -1 -> 0
//         and bends the output line at x = -0.5 (-1 -> -2).
// View 2 (Beat 1): SwiGLU signed gate ruler: upward +2 times SiLU(-1) = -0.269 lands at -0.538.
// View 3 (Beats 2-3): Fixed weight budget gauge (d=12, budget 1152): adding gate overshoots to 1728;
//         prediction WITHHELD during Beat 2 -> compresses all 3 matrices to width 32 (8d/3) on budget cue!
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
  cinemaAtmosphere,
  fmt,
  glowRing,
  glowVector,
  lumBar,
  playCue,
  swapVis,
  vectorPlane,
} from '../parts.mjs';

export default function ffnVariants(s, c) {
  const title = heroTitle(['Inside one token:', 'ReLU, SwiGLU & budget'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.amber,
  });

  const vAffine = s.value(1);
  const vSwiglu = s.value(0);
  const vBudget = s.value(0);

  // View 1 channels
  const affineProg = s.value(0);
  const reluClip = s.value(0);
  const bendShow = s.value(0);

  // View 2 channels
  const gateProg = s.value(0);
  const multProg = s.value(0);

  // View 3 channels (STRICT withholding during Beat 2!)
  const addGateProg = s.value(0);
  const narrowProg = s.value(0); // 0 = width 48 (over budget), 1 = width 32 (exact match!)

  // VIEW 1: Affine collapse vs ReLU bend
  const plane1 = vectorPlane({
    originX: -480,
    originY: 165,
    scaleX: 215,
    scaleY: 25,
    xMin: -1.3,
    xMax: 2.2,
    yMin: -6.5,
    yMax: 15,
    xTicks: [-1, 0, 1, 2],
    yTicks: [-5, 1, 7, 13],
    xLabel: 'x',
    yLabel: 'out',
  });

  const affineFn = (x) => 3 * (2 * x + 1) - 2;
  const reluFn = (x) => 3 * Math.max(0, 2 * x + 1) - 2;

  const affineLayer = guardedDynamic(vAffine, (alpha) => {
    const ap = affineProg.value;
    const rc = reluClip.value > 0.45;
    const bd = bendShow.value > 0.45;
    const nodes = [plane1.node.opacity(alpha)];

    // Straight affine line 6x + 1
    if (ap > 0.05) {
      const endX = -1 + 3 * ap;
      nodes.push(
        glowingTrail([plane1.toScreen(-1, affineFn(-1)), plane1.toScreen(endX, affineFn(endX))], {
          color: bd ? COSMOS.dim : ROLE.stream,
          width: bd ? 3 : 5.5,
          glow: bd ? 2 : 11,
          opacity: (bd ? 0.45 : 1) * alpha,
        }),
      );
    }

    // Bent ReLU polyline
    if (bd) {
      const xs = [-1.2, -1, -0.5, 0, 1, 2];
      nodes.push(
        glowingTrail(
          xs.map((x) => plane1.toScreen(x, reluFn(x))),
          { color: ROLE.valid, width: 5.5, glow: 12, opacity: alpha },
        ),
      );
    }

    [-1, 0, 1, 2].forEach((x) => {
      if (ap > 0.1 && x <= -1 + 3 * ap + 0.05) {
        const pt = plane1.toScreen(x, bd ? reluFn(x) : affineFn(x));
        nodes.push(
          glowDot(pt[0], pt[1], {
            radius: 8,
            color: bd ? ROLE.valid : ROLE.stream,
            glow: 10,
            opacity: alpha,
          }),
        );
      }
    });

    // Right step-by-step arithmetic for x = -1
    const rx = 435;
    nodes.push(
      txt('Test input  x = -1', rx, -235, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('1st affine:   2(-1) + 1 = -1', rx, -130, 32, ROLE.stream, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        rc ? 'ReLU clips:   max(0, -1) = 0' : 'No activation: pass -1 straight through',
        rx,
        -35,
        30,
        rc ? ROLE.valid : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(rc ? 7 : 0, ROLE.valid)
        .opacity(alpha),
      txt(
        bd
          ? '2nd affine:   3(0) - 2 = -2'
          : rc
            ? '2nd affine:   3(0) - 2 = ?'
            : '2nd affine:   3(-1) - 2 = -5',
        rx,
        75,
        34,
        bd ? ROLE.valid : ROLE.query,
        'mono',
        'center',
      )
        .glow(bd ? 8 : 0, ROLE.valid)
        .opacity(alpha),
      txt(
        bd ? 'ReLU creates a bend at x = -1/2' : 'Two affine maps collapse into 6x + 1',
        rx,
        215,
        30,
        bd ? ROLE.valid : ROLE.amber,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: SwiGLU signed gate multiplication
  const gateVal = -1 / (1 + Math.exp(1)); // SiLU(-1) ≈ -0.2689
  const swigluEq = glowTex('\\operatorname{SiLU}(z) = z \\cdot \\sigma(z)', {
    x: 470,
    y: -385,
    size: 38,
    color: ROLE.mask,
  });

  const swigluLayer = guardedDynamic(vSwiglu, (alpha) => {
    const gp = gateProg.value;
    const mp = multProg.value;
    const mapX = (v) => -580 + ((v + 1) / 3) * 1160;
    const axisY = 105;
    const curVal = 2 + (2 * gateVal - 2) * mp;
    const nodes = [
      swigluEq.opacity(alpha),
      txt(
        'Two upward projections meet at one feature coordinate',
        0,
        -245,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      txt('Upward value:  +2.00', -380, -120, 36, ROLE.stream, 'mono', 'center')
        .glow(6, ROLE.stream)
        .opacity(alpha),
      txt(
        gp > 0.45 ? `Gate:  SiLU(-1) = ${fmt(gateVal, 3)}` : 'Gate input:  -1.00',
        380,
        -120,
        36,
        ROLE.mask,
        'mono',
        'center',
      )
        .glow(gp > 0.45 ? 8 : 4, ROLE.mask)
        .opacity(alpha),
      // Signed number line [-1, 2]
      line([mapX(-1), axisY], [mapX(2), axisY], { stroke: '#556894', width: 3 }).opacity(alpha),
    ];

    [-1, 0, 1, 2].forEach((tick) => {
      const tx = mapX(tick);
      nodes.push(
        line([tx, axisY - 12], [tx, axisY + 14], { stroke: '#6c80b2', width: 2.2 }).opacity(alpha),
        txt(String(tick), tx, axisY + 46, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    // Starting +2 beacon
    nodes.push(glowRing(mapX(2), axisY, 13, ROLE.stream, { width: 3, glow: 10, opacity: alpha }));

    if (mp > 0.03) {
      nodes.push(
        glowVector([mapX(2), axisY - 52], [mapX(curVal), axisY - 52], {
          color: ROLE.valid,
          width: 5.5,
          glow: 12,
          opacity: alpha,
        }),
        glowRing(mapX(curVal), axisY, 14, ROLE.valid, { width: 3.5, glow: 12, opacity: alpha }),
      );
      if (mp > 0.85) {
        nodes.push(
          txt(
            `+2 x (${fmt(gateVal, 3)}) = ${fmt(2 * gateVal, 3)}   (flips sign below zero!)`,
            0,
            265,
            34,
            ROLE.valid,
            'mono',
            'center',
          )
            .glow(8, ROLE.valid)
            .opacity(alpha),
        );
      }
    }

    nodes.push(
      txt(
        'LLaMA uses SwiGLU (SiLU gate)  ·  Gemma uses GeGLU (GELU gate)',
        0,
        385,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Fixed weight budget gauge (d = 12, budget = 1152)
  const dModel = 12;
  const plainH = 48;
  const budget = 2 * dModel * plainH; // 1152
  const matchedH = 32; // 8/3 * 12

  const budgetEq = glowTex('3 d h = 8 d^2 \\;\\Rightarrow\\; h = \\frac{8}{3} d', {
    x: 470,
    y: -385,
    size: 38,
    color: ROLE.query,
  });

  const budgetLayer = guardedDynamic(vBudget, (alpha) => {
    const ag = addGateProg.value;
    const np = narrowProg.value;
    const curH = Math.round(plainH - (plainH - matchedH) * np);
    const curWeights = 3 * dModel * curH;
    const left = -760;
    const scale = 1480 / (3 * dModel * plainH);
    const limitX = left + budget * scale;

    const nodes = [
      budgetEq.opacity((np > 0.85 ? 1 : 0) * alpha),
      txt(
        `Model width d = ${dModel}  ·  no biases`,
        left,
        -245,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      // Gold budget limit markers split cleanly around the horizontal bars (never crossing bar text!)
      glowingTrail(
        [
          [limitX, -205],
          [limitX, -118],
        ],
        { color: ROLE.query, width: 4, glow: 10, opacity: alpha },
      ),
      glowingTrail(
        [
          [limitX, -12],
          [limitX, 94],
        ],
        { color: ROLE.query, width: 4, glow: 10, opacity: alpha },
      ),
      glowingTrail(
        [
          [limitX, 200],
          [limitX, 245],
        ],
        { color: ROLE.query, width: 4, glow: 10, opacity: alpha },
      ),
      txt(`budget = ${budget}`, limitX, -238, 28, ROLE.query, 'mono', 'center')
        .glow(6, ROLE.query)
        .opacity(alpha),
    ];

    const drawStrip = (y, h, names, gateFraction) => {
      let x = left;
      const cols = [ROLE.stream, ROLE.pos, ROLE.valid];
      names.forEach((name, i) => {
        const w = dModel * h * scale;
        const vis = name === 'gate' ? gateFraction : 1;
        if (vis > 0.03) {
          const bw = Math.max(8, (w - 8) * vis);
          nodes.push(
            lumBar(x + bw / 2, y, bw, 84, {
              color: cols[i],
              fillOpacity: 0.36,
              strokeWidth: 2.4,
              glow: 8,
              opacity: alpha,
            }),
          );
          if (bw > 170) {
            nodes.push(
              txt(`${name} ${dModel * h}`, x + bw / 2, y, 28, COSMOS.ink, 'mono', 'center').opacity(
                alpha,
              ),
            );
          }
        }
        x += w;
      });
    };

    // Plain 2-matrix strip (top)
    nodes.push(
      txt(
        `Plain FFN (2 matrices · inner width ${plainH})`,
        left,
        -142,
        28,
        ROLE.stream,
        'mono',
        'left',
      ).opacity(alpha),
    );
    drawStrip(-65, plainH, ['up', 'down'], 1);

    // Gated 3-matrix strip (bottom)
    nodes.push(
      txt(
        ag > 0.4 ? `SwiGLU (3 matrices · inner width ${curH})` : 'Adding 3rd gate matrix...',
        left,
        70,
        28,
        curWeights > budget ? ROLE.mask : ROLE.valid,
        'mono',
        'left',
      ).opacity(alpha),
    );
    drawStrip(148, curH, ['up', 'down', 'gate'], ag);

    if (ag > 0.5) {
      const over = curWeights > budget;
      nodes.push(
        txt(
          over
            ? `3 x 12 x ${curH} = ${curWeights} weights  (over budget! How wide should h be?)`
            : `3 x 12 x ${curH} = ${curWeights} weights  (exact budget match at h = 8d/3!)`,
          0,
          315,
          32,
          over ? ROLE.mask : ROLE.valid,
          'mono',
          'center',
        )
          .glow(8, over ? ROLE.mask : ROLE.valid)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.amber, ROLE.valid), title, affineLayer, swigluLayer, budgetLayer);

  // Beat 0: affine collapse vs ReLU bend
  playCue(s, c, 'tr-ffn-variants-affine', (d) => s.play(affineProg.to(1, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'tr-ffn-variants-relu', (d) => s.play(reluClip.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-ffn-variants-bent-output', (d) => s.play(bendShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: SwiGLU signed gate (swap cleanly right after beat-0-end!)
  const b1Swap = c.cue('tr-ffn-variants-bent-output').end + 13.2;
  c.at(Math.max(0.2, b1Swap - c.start), () => {
    s.play(swapVis(vAffine, vSwiglu, 0.65));
  });
  playCue(s, c, 'tr-ffn-variants-gate', (d) => s.play(gateProg.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'tr-ffn-variants-multiply', (d) => s.play(multProg.to(1, { duration: d })), {
    dur: 1.0,
  });

  // Beat 2: parameter budget overshoot (swap cleanly right after beat-1-end; withholds width 32!)
  const b2Swap = c.cue('tr-ffn-variants-multiply').end + 15.8;
  c.at(Math.max(0.2, b2Swap - c.start), () => {
    s.play(swapVis(vSwiglu, vBudget, 0.65));
  });
  playCue(s, c, 'tr-ffn-variants-add-gate', (d) => s.play(addGateProg.to(1, { duration: d })), {
    dur: 0.85,
  });

  // Beat 3: compress all 3 matrices to width 32 on budget cue!
  playCue(s, c, 'tr-ffn-variants-budget', (d) => s.play(narrowProg.to(1, { duration: d })), {
    dur: 1.0,
  });
}
