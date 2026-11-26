// Act 2 (Scenes 7 to 12): Executable router contract, top-1 gate gradient, batched grouped GEMM
// dispatch, packed ticket permutation, scatter-add combine, and expert-choice coverage.
import { arrow, line } from 'vizmatic/stage';
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
  BATCH_ROUTES,
  BLENDED_OUTPUT,
  CHOICE_SCORES,
  EXP_COLORS,
  MOE_ASSIGNMENTS,
  MOE_INPUTS,
  ROLE,
  ROUTING,
  TOK_COLORS,
  WALKTHROUGH_HIDDEN,
  arcPts,
  cinemaAtmosphere,
  clamp,
  fmt,
  glowMatrix,
  glowRing,
  lerp,
  lumBar,
  moeChoice,
  moePacked,
  moeScalarGate,
  playCue,
  swapVis,
  vecStr,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

// ---------------------------------------------------------------------------
// Scene 7: router-contract: "Make the routing rule executable"
// ---------------------------------------------------------------------------
export function routerContract(s, c) {
  const title = heroTitle(['Make the routing rule', 'executable'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const vExact = s.value(1);
  const vChecks = s.value(0);
  const vTie = s.value(0);

  const pExactGates = s.value(0);
  const pExactOut = s.value(0);
  const pRoundedOut = s.value(0);
  const pShift = s.value(0);
  const pTie = s.value(0);
  const pNorm = s.value(0);

  // View 1 (Beat 0): Exact logits calculation vs rounded table contrast
  const exactLayer = guardedDynamic(vExact, (alpha) => {
    const eg = pExactGates.value;
    const eo = pExactOut.value;
    const ro = pRoundedOut.value;
    const nodes = [
      txt('4-coordinate hidden state x', -450, -205, 28, ROLE.token, 'mono', 'center').opacity(
        alpha,
      ),
      vectorRow({
        cx: -450,
        cy: -115,
        values: WALKTHROUGH_HIDDEN,
        cellW: 112,
        cellH: 68,
        gap: 12,
        color: ROLE.token,
        digits: 1,
        opacity: alpha,
      }),
      // Left: Exact calculation
      lumBar(-435, 115, 690, 265, {
        color: ROLE.active,
        fillOpacity: 0.16 + 0.12 * eo,
        strokeWidth: 2.6,
        glow: 6 + 6 * eo,
        opacity: alpha,
      }),
      txt(
        'Exact logits  [-0.65, -1.77, -1.35, -3]',
        -435,
        22,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        eg > 0.25
          ? `selected weights:  ${fmt(ROUTING.weights[0], 3)}  and  ${fmt(ROUTING.weights[1], 3)}`
          : 'selected weights:  computing...',
        -435,
        92,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        eo > 0.25
          ? `output:  [${fmt(BLENDED_OUTPUT[0], 3)},  ${fmt(BLENDED_OUTPUT[1], 3)},  0,  0]`
          : 'output:  [?, ?, 0, 0]',
        -435,
        166,
        30,
        eo > 0.25 ? ROLE.token : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(eo > 0.25 ? 7 : 0, ROLE.token)
        .opacity(alpha),

      // Right: Rounded probability table
      lumBar(435, 115, 690, 265, {
        color: ro > 0.25 ? ROLE.router : '#4f6291',
        fillOpacity: ro > 0.25 ? 0.2 : 0.12,
        strokeWidth: 2.4,
        glow: ro > 0.25 ? 8 : 3,
        opacity: alpha,
      }),
      txt(
        'Rounded probability table  (0.52, 0.26)',
        435,
        22,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      txt('weights:  2/3  and  1/3', 435, 92, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        ro > 0.25 ? 'output:  [4/3,  1.000,  0,  0]' : 'output:  separate rounding',
        435,
        166,
        30,
        ro > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(ro > 0.25 ? 7 : 0, ROLE.router)
        .opacity(alpha),
      txt(
        'Keep exact logit math and rounded summary tables strictly separate',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  // View 2 (Beat 1): Input validator + max-logit stabilization
  const checksLayer = guardedDynamic(vChecks, (alpha) => {
    const sh = pShift.value;
    const stages = [
      { x: -620, label: '1. Validate', sub: 'dims · finite · int k', col: ROLE.overflow },
      { x: -195, label: '2. Project', sub: 'z = W_g x (finite)', col: ROLE.expert },
      { x: 230, label: '3. Shift z', sub: 'z - max(z) <= 0', col: ROLE.router },
      { x: 645, label: '4. Softmax', sub: 'stable exp / sum', col: ROLE.active },
    ];
    const nodes = [];
    stages.forEach((st, i) => {
      const lit = i === 2 ? sh > 0.25 : true;
      nodes.push(
        lumBar(st.x, -85, 340, 140, {
          color: st.col,
          fillOpacity: lit ? 0.24 : 0.14,
          strokeWidth: 2.5,
          glow: lit ? 8 : 3,
          opacity: alpha,
        }),
        txt(st.label, st.x, -110, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(st.sub, st.x, -60, 26, st.col, 'mono', 'center').opacity(alpha),
      );
      if (i < 3) {
        nodes.push(
          arrow([st.x + 178, -85], [stages[i + 1].x - 178, -85], {
            stroke: '#7086ba',
            width: 3,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });

    // Reject examples on left, shift invariance on right
    nodes.push(
      lumBar(-435, 155, 740, 180, {
        color: ROLE.overflow,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 5,
        opacity: alpha,
      }),
      txt('Rejected before dispatch:', -435, 112, 28, ROLE.overflow, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        'k=true · k=1.5 · NaN/Inf · bad dim',
        -435,
        178,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(435, 155, 740, 180, {
        color: sh > 0.25 ? ROLE.router : '#4f6291',
        fillOpacity: sh > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.4,
        glow: sh > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        'Stable max-shift preserves exact ratios',
        435,
        112,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        sh > 0.25 ? 'z - max = [0, -1.12, -0.70, -2.35]' : 'z = [-0.65, -1.77, -1.35, -3.00]',
        435,
        178,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Subtracting max(z) prevents exp overflow without moving any probability',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // View 3 (Beat 2): Deterministic tie-break + normalization
  const tieLayer = guardedDynamic(vTie, (alpha) => {
    const ti = pTie.value;
    const nm = pNorm.value;
    const scores = [0.35, 0.35, 0.2, 0.1];
    const xs = [-540, -180, 180, 540];
    const nodes = [
      txt(
        'Deterministic tie-break by lower expert ID (top-1 tie example)',
        0,
        -225,
        30,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
    ];
    scores.forEach((sc, i) => {
      const winner = i === 0 && ti > 0.25;
      const tied = i === 1 && ti > 0.25;
      const col = winner ? ROLE.active : tied ? ROLE.router : '#53658f';
      nodes.push(
        lumBar(xs[i], -60, 300, 155, {
          color: col,
          fillOpacity: winner ? 0.34 : 0.16,
          strokeWidth: winner ? 3 : 2,
          glow: winner ? 11 : 3,
          opacity: alpha,
        }),
        txt(`E${i}`, xs[i], -95, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(`p = ${fmt(sc, 2)}`, xs[i], -45, 28, col, 'mono', 'center').opacity(alpha),
        txt(
          winner ? 'wins (ID 0)' : tied ? 'tied (ID 1)' : 'below',
          xs[i],
          -4,
          26,
          winner ? ROLE.active : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      lumBar(0, 185, 1180, 132, {
        color: nm > 0.25 ? ROLE.token : '#4c5e8a',
        fillOpacity: nm > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: nm > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        nm > 0.25
          ? 'Renormalize chosen probabilities -> selected weights sum to 1.000'
          : 'Divide chosen probabilities by their combined mass',
        0,
        160,
        30,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Changing k changes the trained function  ·  verify checkpoint contract',
        0,
        214,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.router), title, exactLayer, checksLayer, tieLayer);

  playCue(s, c, 'mo-router-contract-op-0', (d) => s.play(vExact.to(1, { duration: d })), {
    dur: 0.3,
  });
  playCue(s, c, 'mo-exact-gates', (d) => s.play(pExactGates.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-exact-output', (d) => s.play(pExactOut.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-rounded-output', (d) => s.play(pRoundedOut.to(1, { duration: d })), {
    dur: 0.65,
  });

  playCue(
    s,
    c,
    'mo-router-contract-op-1',
    (d) => s.play(swapVis(vExact, vChecks, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-stable-shift', (d) => s.play(pShift.to(1, { duration: d })), { dur: 0.7 });

  playCue(
    s,
    c,
    'mo-router-contract-op-2',
    (d) => s.play(swapVis(vChecks, vTie, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-tie-order', (d) => s.play(pTie.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-normalized', (d) => s.play(pNorm.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 8: gate-gradient: "One selected expert can still train a gate"
// STRICT PREDICTION WITHHOLDING: Beat 0 asks both outputs/losses; Beat 1 reveals retained; Beat 2 reveals norm-1.
// ---------------------------------------------------------------------------
export function gateGradient(s, c) {
  const title = heroTitle(['One selected expert', 'can still train a gate'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const eq = glowTex('L = \\tfrac{1}{2}(y - 1)^2, \\quad \\frac{dL}{dz} = (y-1)\\,E\\,p(1-p)', {
    x: 410,
    y: -380,
    size: 34,
    color: ROLE.router,
  });

  const plane = vectorPlane({
    originX: -520,
    originY: 265,
    scaleX: 165,
    scaleY: 220,
    xMin: -1.8,
    xMax: 2.6,
    yMin: -0.1,
    yMax: 2.25,
    xTicks: [-1, 0, 1, 2],
    yTicks: [0, 1, 2],
    xLabel: 'logit z',
    yLabel: 'output y',
  });

  const retained = moeScalarGate(0.75, false); // y=1.5, L=0.125, g=0.1875
  const normOne = moeScalarGate(0.75, true); // y=2.0, L=0.5, g=0

  const pSetup = s.value(0.6);
  const pRetBranch = s.value(0);
  const pRetOut = s.value(0);
  const pRetLoss = s.value(0);
  const pRetGrad = s.value(0);
  const pNormBranch = s.value(0);
  const pNormOut = s.value(0);
  const pNormFlat = s.value(0);
  const vis = s.value(1);

  const z0 = Math.log(3); // sigmoid(ln 3) = 0.75

  // Precompute sigmoid curve points y = 2 * sigmoid(z)
  const sigPts = [];
  for (let i = 0; i <= 48; i++) {
    const z = -1.75 + (i / 48) * 4.25;
    const p = 1 / (1 + Math.exp(-z));
    sigPts.push(plane.toScreen(z, 2 * p));
  }

  const layer = guardedDynamic(vis, (alpha) => {
    const su = pSetup.value;
    const rb = pRetBranch.value;
    const ro = pRetOut.value;
    const rl = pRetLoss.value;
    const rg = pRetGrad.value;
    const nb = pNormBranch.value;
    const no = pNormOut.value;
    const nf = pNormFlat.value;
    const nodes = [];

    // Target line y = 1
    const tL = plane.toScreen(-1.75, 1);
    const tR = plane.toScreen(2.5, 1);
    nodes.push(
      line(tL, tR, { stroke: ROLE.active, width: 2.2 }).opacity(0.65 * alpha),
      txt('target = 1', tR[0] - 12, tR[1] - 26, 26, ROLE.active, 'mono', 'right').opacity(alpha),
    );

    // Retained sigmoid output curve (visible dimly in setup, bright on Beat 1)
    nodes.push(
      glowingTrail(sigPts, {
        color: ROLE.token,
        width: rb > 0.2 ? 4.4 : 2.6,
        glow: rb > 0.2 ? 10 : 4,
        opacity: (rb > 0.2 ? 0.95 : 0.5) * alpha,
      }),
    );

    // Retained operating point & local tangent (ONLY after Beat 1 cues!)
    if (ro > 0.1) {
      const pt = plane.toScreen(z0, retained.output);
      nodes.push(
        glowRing(pt[0], pt[1], 12, ROLE.token, { width: 3.2, glow: 12, opacity: ro * alpha }),
        txt('y = 1.5', pt[0] + 24, pt[1] + 24, 28, ROLE.token, 'mono', 'left')
          .glow(7, ROLE.token)
          .opacity(ro * alpha),
      );
      if (rg > 0.1) {
        // Tangent segment: dy/dz = 2 * 0.75 * 0.25 = 0.375
        const aPt = plane.toScreen(z0 - 0.85, retained.output - 0.85 * 0.375);
        const bPt = plane.toScreen(z0 + 0.85, retained.output + 0.85 * 0.375);
        nodes.push(
          glowingTrail([aPt, bPt], {
            color: ROLE.router,
            width: 4,
            glow: 10,
            opacity: rg * alpha,
          }),
        );
      }
    }

    // Normalized-to-1 flat branch y = 2 (ONLY after Beat 2!)
    if (nb > 0.1) {
      const fL = plane.toScreen(-1.75, normOne.output);
      const fR = plane.toScreen(2.5, normOne.output);
      nodes.push(
        glowingTrail([fL, fR], {
          color: ROLE.overflow,
          width: 4.2,
          glow: 9,
          opacity: nb * alpha,
        }),
      );
      if (no > 0.1) {
        const pt2 = plane.toScreen(z0, normOne.output);
        nodes.push(
          glowRing(pt2[0], pt2[1], 12, ROLE.overflow, {
            width: 3.2,
            glow: 11,
            opacity: no * alpha,
          }),
          txt(
            nf > 0.2 ? 'y = 2 (flat)' : 'y = 2.0',
            pt2[0] + 22,
            pt2[1] - 32,
            26,
            ROLE.overflow,
            'mono',
            'left',
          ).opacity(no * alpha),
        );
      }
    }

    // Right column: Setup + Retained vs Normalized readouts (strictly withheld until spoken!)
    const rx = 475;
    nodes.push(
      txt(
        'E(x) = 2   ·   p = 3/4   ·   target = 1',
        rx,
        -235,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity((0.55 + 0.45 * su) * alpha),
      // Retained branch readout
      lumBar(rx, -90, 740, 175, {
        color: rb > 0.2 ? ROLE.token : '#4e608e',
        fillOpacity: rb > 0.2 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: rb > 0.2 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Keep router weight  (p = 3/4)', rx, -142, 28, ROLE.token, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        ro > 0.25 ? `y = ${fmt(retained.output, 1)}` : 'y = ?',
        rx - 185,
        -88,
        30,
        ro > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        rl > 0.25 ? 'L = 1/8 (0.125)' : 'L = ?',
        rx + 150,
        -88,
        30,
        rl > 0.25 ? ROLE.active : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        rg > 0.25 ? 'dL/dz = 3/16 (0.1875) -> learns' : 'dL/dz = ?',
        rx,
        -32,
        28,
        rg > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(rg > 0.25 ? 7 : 0, ROLE.router)
        .opacity(alpha),

      // Normalized branch readout
      lumBar(rx, 130, 740, 175, {
        color: nb > 0.2 ? ROLE.overflow : '#4e608e',
        fillOpacity: nb > 0.2 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: nb > 0.2 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Normalize lone gate to 1  (w = 1)', rx, 78, 28, ROLE.overflow, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        no > 0.25 ? `y = ${fmt(normOne.output, 1)}` : 'y = ?',
        rx - 185,
        132,
        30,
        no > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        no > 0.25 ? 'L = 1/2 (0.500)' : 'L = ?',
        rx + 150,
        132,
        30,
        no > 0.25 ? ROLE.overflow : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        nf > 0.25 ? 'dL/dz = 0 (flat away from boundary)' : 'dL/dz = ?',
        rx,
        188,
        28,
        nf > 0.25 ? ROLE.overflow : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(nf > 0.25 ? 7 : 0, ROLE.overflow)
        .opacity(alpha),

      txt(
        nf > 0.25
          ? 'Expert weights can still learn; balance loss gives router another signal'
          : 'Predict both outputs and losses before revealing the curves',
        rx,
        300,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.token), title, eq, plane.node, layer);

  playCue(s, c, 'mo-gate-gradient-op-0', (d) => s.play(pSetup.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'mo-gate-gradient-op-1', (d) => s.play(pRetBranch.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'mo-retained-output', (d) => s.play(pRetOut.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'mo-retained-loss', (d) => s.play(pRetLoss.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'mo-retained-gradient', (d) => s.play(pRetGrad.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'mo-gate-gradient-op-2', (d) => s.play(pNormBranch.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'mo-normalized-output', (d) => s.play(pNormOut.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'mo-normalized-flat', (d) => s.play(pNormFlat.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}

// ---------------------------------------------------------------------------
// Scene 9: batch-dispatch: "Group the work, preserve the token"
// ---------------------------------------------------------------------------
export function batchDispatch(s, c) {
  const title = heroTitle(['Group the work,', 'preserve the token'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const pTok = s.value(0.5);
  const pGroup = s.value(0);
  const pGemm = s.value(0);
  const pGate = s.value(0);
  const pRestore = s.value(0);
  const pAccum = s.value(0);
  const vis = s.value(1);

  // Build grouped token indices per expert E0..E3 from BATCH_ROUTES
  const groups = [0, 1, 2, 3].map((e) =>
    BATCH_ROUTES.flatMap((pair, t) => (pair.includes(e) ? [t] : [])),
  );

  const layer = guardedDynamic(vis, (alpha) => {
    const tk = pTok.value;
    const gr = pGroup.value;
    const gm = pGemm.value;
    const gt = pGate.value;
    const rs = pRestore.value;
    const ac = pAccum.value;
    const nodes = [];

    const leftX = -710;
    const midX = 0;
    const rightX = 710;

    nodes.push(
      txt('6 input tokens', leftX, -245, 28, ROLE.token, 'mono', 'center').opacity(alpha),
      txt(
        '4 grouped expert queues (GEMM rows)',
        midX,
        -245,
        28,
        ROLE.expert,
        'mono',
        'center',
      ).opacity(alpha),
      txt('6 restored outputs', rightX, -245, 28, ROLE.active, 'mono', 'center').opacity(alpha),
    );

    // 6 source tokens on left, 6 restored tokens on right
    const tokYs = Array.from({ length: 6 }, (_, i) => -160 + i * 102);
    tokYs.forEach((ty, t) => {
      const col = TOK_COLORS[t];
      nodes.push(
        lumBar(leftX, ty, 240, 68, {
          color: col,
          fillOpacity: 0.24 + 0.18 * tk,
          strokeWidth: 2.5,
          glow: 6 + 4 * tk,
          opacity: alpha,
        }),
        txt(
          `t${t} -> E${BATCH_ROUTES[t][0] + 1},E${BATCH_ROUTES[t][1] + 1}`,
          leftX,
          ty,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(rightX, ty, 240, 68, {
          color: rs > 0.25 ? col : '#4a5c87',
          fillOpacity: rs > 0.25 ? 0.34 : 0.14,
          strokeWidth: rs > 0.25 ? 2.6 : 1.7,
          glow: ac > 0.3 ? 11 : 4,
          opacity: alpha,
        }),
        txt(
          ac > 0.35 ? `y${t} (2 sums)` : rs > 0.25 ? `y${t} <- 2` : `slot ${t}`,
          rightX,
          ty,
          26,
          rs > 0.25 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // 4 expert queues in the center
    const expYs = [-125, 25, 175, 325];
    groups.forEach((members, e) => {
      const ey = expYs[e];
      const eCol = EXP_COLORS[e];
      nodes.push(
        lumBar(midX, ey, 530, 108, {
          color: gm > 0.25 ? eCol : '#4a5d8b',
          fillOpacity: gm > 0.25 ? 0.22 : 0.12,
          strokeWidth: gm > 0.25 ? 2.8 : 1.8,
          glow: gm > 0.25 ? 10 : 3,
          opacity: alpha,
        }),
        txt(`E${e + 1}`, midX - 220, ey, 30, eCol, 'mono', 'center').opacity(alpha),
      );

      members.forEach((t, k) => {
        const cx = midX - 120 + k * 130;
        const tCol = TOK_COLORS[t];
        const showChip = gr > 0.15;
        nodes.push(
          lumBar(cx, ey, 110, 64, {
            color: tCol,
            fillOpacity: showChip ? 0.38 : 0.14,
            strokeWidth: showChip ? 2.4 : 1.4,
            glow: gt > 0.25 ? 9 : 4,
            radius: 7,
            opacity: (showChip ? 1 : 0.45) * alpha,
          }),
          txt(
            gt > 0.35 ? `t${t}·g` : `t${t}`,
            cx,
            ey,
            26,
            showChip ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ).opacity((showChip ? 1 : 0.45) * alpha),
        );

        // Dispatch arc left -> center
        if (gr > 0.08) {
          const dPts = arcPts([leftX + 102, tokYs[t]], [midX - 270, ey], (e - 1.5) * 18, 18);
          const cut = Math.max(2, Math.round(dPts.length * clamp(gr)));
          nodes.push(
            glowingTrail(dPts.slice(0, cut), {
              color: tCol,
              width: 2.2,
              glow: 4,
              core: false,
              opacity: 0.55 * alpha,
            }),
          );
        }
        // Return arc center -> right
        if (rs > 0.08) {
          const rPts = arcPts([midX + 270, ey], [rightX - 102, tokYs[t]], (e - 1.5) * -18, 18);
          const cut = Math.max(2, Math.round(rPts.length * clamp(rs)));
          nodes.push(
            glowingTrail(rPts.slice(0, cut), {
              color: tCol,
              width: 2.4,
              glow: 5,
              core: false,
              opacity: 0.62 * alpha,
            }),
          );
        }
      });
    });

    nodes.push(
      txt(
        ac > 0.35
          ? 'Grouped GEMM + weighted scatter-add reproduces the exact per-token mixture'
          : gt > 0.3
            ? 'Each row carries its original token ID and gate weight through the GEMM'
            : 'Sort 12 assignments into 4 dense expert batches',
        0,
        420,
        28,
        ac > 0.35 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.expert), title, layer);

  playCue(s, c, 'persistent-token', (d) => s.play(pTok.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'group-assignments', (d) => s.play(pGroup.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'expert-matrix', (d) => s.play(pGemm.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'carried-gates', (d) => s.play(pGate.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'restore-order', (d) => s.play(pRestore.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'weighted-accumulation', (d) => s.play(pAccum.to(1, { duration: d })), {
    dur: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Scene 10: pack-permutation: "Follow two assignments for token zero"
// STRICT PREDICTION WITHHOLDING: Beat 2 asks which two rows return to t0; Beat 3 reveals them!
// ---------------------------------------------------------------------------
export function packPermutation(s, c) {
  const title = heroTitle(['Follow two assignments', 'for token zero'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const packedModel = moePacked();
  const packedOrder = packedModel.packed; // sorted by expert ID: [E0 t1, E0 t2, E1 t0, E2 t0, E2 t2]

  const pRead = s.value(0);
  const pPack = s.value(0);
  const pAsk = s.value(0);
  const pReveal = s.value(0); // WITHHELD until Beat 3 both-addresses!
  const vis = s.value(1);

  const incomingX = 430;
  const packedX = -430;
  const rowY = (idx) => -165 + idx * 112;

  const layer = guardedDynamic(vis, (alpha) => {
    const rd = pRead.value;
    const pk = pPack.value;
    const ask = pAsk.value;
    const rv = pReveal.value;
    const nodes = [];

    nodes.push(
      txt(
        'Packed by expert ID (GEMM groups)',
        packedX,
        -255,
        28,
        ROLE.expert,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Incoming routing tickets', incomingX, -255, 28, ROLE.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );

    // Target slots on left (quiet skeleton from t = 0 so left canvas is populated)
    for (let i = 0; i < 5; i++) {
      const targetRow = packedOrder[i];
      nodes.push(
        lumBar(packedX, rowY(i), 560, 82, {
          color: '#3c4d78',
          fillOpacity: 0.14,
          strokeWidth: 1.6,
          glow: 0,
          opacity: alpha,
        }),
        txt(
          `group E${targetRow.expert}`,
          packedX - 315,
          rowY(i),
          26,
          EXP_COLORS[targetRow.expert],
          'mono',
          'right',
        ).opacity(alpha),
      );
    }

    // Move each of the 5 incoming tickets one at a time to its packed destination
    MOE_ASSIGNMENTS.forEach((row, origIdx) => {
      const destIdx = packedOrder.findIndex((p) => p.index === origIdx);
      const tMove = clamp((pk * 5 - origIdx) / 0.92);
      const ease = tMove * tMove * (3 - 2 * tMove);
      const cx = lerp(incomingX, packedX, ease);
      const cy = lerp(rowY(origIdx), rowY(destIdx), ease);

      const isFirstHighlight = origIdx === 0 && rd > 0.2 && pk < 0.05;
      const isT0Reveal = row.token === 0 && rv > 0.25;
      const col = isT0Reveal ? ROLE.token : isFirstHighlight ? ROLE.router : '#6074a6';
      const txtOp = pk <= 0.05 ? 1 - pk / 0.05 : pk >= 0.95 ? (pk - 0.95) / 0.05 : 0;

      nodes.push(
        lumBar(cx, cy, 550, 80, {
          color: col,
          fillOpacity: isT0Reveal || isFirstHighlight ? 0.34 : 0.18,
          strokeWidth: isT0Reveal || isFirstHighlight ? 3 : 2,
          glow: isT0Reveal || isFirstHighlight ? 11 : 4,
          opacity: alpha,
        }),
      );
      if (txtOp > 0.02) {
        nodes.push(
          txt(
            `E${row.expert}  ·  t${row.token}  ·  gate x${row.gate}`,
            cx,
            cy,
            28,
            isT0Reveal || isFirstHighlight ? COSMOS.ink : COSMOS.muted,
            'mono',
            'center',
          ).opacity(txtOp * alpha),
        );
      }
    });

    // Input vectors strip + bottom prompt (mutually exclusive)
    nodes.push(
      txt(
        `Inputs:   t0 = ${vecStr(MOE_INPUTS[0], 0)}   ·   t1 = ${vecStr(MOE_INPUTS[1], 0)}   ·   t2 = ${vecStr(MOE_INPUTS[2], 0)}`,
        0,
        360,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (rv > 0.25) {
      nodes.push(
        txt(
          't0 lives in E1 (gate 0.75) and E2 (gate 0.25)  ·  both retain address t0',
          0,
          422,
          30,
          ROLE.token,
          'mono',
          'center',
        )
          .glow(7, ROLE.token)
          .opacity(clamp((rv - 0.25) / 0.75) * alpha),
      );
    } else if (ask > 0.25) {
      nodes.push(
        txt(
          'Look down the packed rows: which two send results back to token 0?',
          0,
          422,
          32,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(clamp((ask - 0.25) / 0.75) * alpha),
      );
    } else {
      nodes.push(
        txt(
          pk > 0.5
            ? 'Sorted by expert ID so each expert runs one contiguous matrix op'
            : 'Ticket 0: Expert 2 takes t0 = [1, 2] with return weight 0.25',
          0,
          422,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.expert), title, layer);

  playCue(s, c, 'read-ticket', (d) => s.play(pRead.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'group-tickets', (d) => s.play(pPack.to(1, { duration: d })), { dur: 1.25 });
  playCue(s, c, 'find-address', (d) => s.play(pAsk.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'both-addresses', (d) => s.play(pReveal.to(1, { duration: d })), { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// Scene 11: scatter-combine: "What comes back to each token?"
// STRICT PREDICTION WITHHOLDING: Beat 2 pauses with [+0.125, +0.25] beside [-0.75, -1.5]; Beat 3 reveals sum!
// ---------------------------------------------------------------------------
export function scatterCombine(s, c) {
  const title = heroTitle(['What comes back', 'to each token?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.active,
  });

  const { packed, outputs, factors } = moePacked();
  // packed rows:
  // 0: E0 (x2), t1 [3,4] -> [6,8] * 1.0 = [6, 8]
  // 1: E0 (x2), t2 [5,6] -> [10,12] * 0.4 = [4, 4.8]
  // 2: E1 (x-1), t0 [1,2] -> [-1,-2] * 0.75 = [-0.75, -1.5]
  // 3: E2 (x0.5), t0 [1,2] -> [0.5,1] * 0.25 = [0.125, 0.25]
  // 4: E2 (x0.5), t2 [5,6] -> [2.5,3] * 0.6 = [1.5, 1.8]

  const pE0 = s.value(0);
  const pE1 = s.value(0);
  const pE2Wait = s.value(0); // Beat 2: t0 second return waits beside subtotal
  const pAddZero = s.value(0); // WITHHELD until Beat 3 add-zero!
  const pLast = s.value(0); // WITHHELD until Beat 3 last-return!
  const pWrong = s.value(0); // Beat 4 wrong-writes
  const vis = s.value(1);

  const leftX = -465;
  const rightX = 435;
  const rowY = (i) => -165 + i * 106;
  const tokY = (t) => [-175, 45, 225][t];

  const layer = guardedDynamic(vis, (alpha) => {
    const e0 = pE0.value;
    const e1 = pE1.value;
    const e2w = pE2Wait.value;
    const az = pAddZero.value;
    const ls = pLast.value;
    const wr = pWrong.value;
    const nodes = [];

    nodes.push(
      txt(
        'Packed rows execute in expert order',
        leftX,
        -255,
        28,
        ROLE.expert,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Scatter-add token accumulators',
        rightX,
        -255,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    packed.forEach((row, i) => {
      const active =
        (i <= 1 && e0 > 0.2) ||
        (i === 2 && e1 > 0.2) ||
        (i === 3 && e2w > 0.2) ||
        (i === 4 && ls > 0.2);
      const col = active ? EXP_COLORS[row.expert] : '#4d608c';
      const y = rowY(i);
      nodes.push(
        lumBar(leftX, y, 660, 78, {
          color: col,
          fillOpacity: active ? 0.28 : 0.14,
          strokeWidth: active ? 2.6 : 1.7,
          glow: active ? 8 : 2,
          opacity: alpha,
        }),
        txt(
          `E${row.expert} (x${factors[row.expert]})  t${row.token}  x${row.gate}  ->  ${vecStr(row.contribution, 3)}`,
          leftX,
          y,
          26,
          active ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Right: 3 token accumulators
    const t0Str =
      az > 0.35
        ? vecStr(outputs[0], 3) // [-0.625, -1.250]
        : e1 > 0.3
          ? '[-0.750, -1.500]'
          : '[0.000, 0.000]';
    const t1Str = e0 > 0.35 ? vecStr(outputs[1], 1) : '[0.0, 0.0]';
    const t2Str =
      ls > 0.35
        ? vecStr(outputs[2], 1) // [5.5, 6.6]
        : e0 > 0.35
          ? '[4.0, 4.8]  (waiting)'
          : '[0.0, 0.0]';

    const accItems = [
      { id: 0, str: t0Str, done: az > 0.35, hot: e1 > 0.2 || e2w > 0.2 },
      { id: 1, str: t1Str, done: e0 > 0.35, hot: e0 > 0.2 },
      { id: 2, str: t2Str, done: ls > 0.35, hot: e0 > 0.2 || ls > 0.2 },
    ];

    accItems.forEach((item) => {
      const y = tokY(item.id);
      const col = item.done ? ROLE.active : item.hot ? ROLE.token : '#4b5e8a';
      nodes.push(
        lumBar(rightX, y, 640, 118, {
          color: col,
          fillOpacity: item.done ? 0.28 : 0.16,
          strokeWidth: item.done ? 2.8 : 2,
          glow: item.done ? 10 : 4,
          opacity: alpha,
        }),
        txt(
          `token ${item.id}`,
          rightX - 245,
          y - 22,
          28,
          TOK_COLORS[item.id],
          'mono',
          'left',
        ).opacity(alpha),
        txt(item.str, rightX + 35, y + 16, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Waiting second return beside token 0 during Beat 2 prediction pause!
    if (e2w > 0.2 && az < 0.35) {
      const waitOp = e2w * (1 - az * 2.8) * alpha;
      nodes.push(
        lumBar(rightX, -68, 560, 56, {
          color: ROLE.router,
          fillOpacity: 0.32,
          strokeWidth: 2.5,
          glow: 9,
          opacity: waitOp,
        }),
        txt(
          '+ [0.125, 0.250] waiting -> ?',
          rightX,
          -68,
          26,
          ROLE.router,
          'mono',
          'center',
        ).opacity(waitOp),
      );
    }

    // Delivery arcs for active transfers
    if (e0 > 0.2) {
      nodes.push(
        glowingTrail(arcPts([leftX + 340, rowY(0)], [rightX - 330, tokY(1)], -24, 18), {
          color: EXP_COLORS[0],
          width: 2.6,
          glow: 6,
          core: false,
          opacity: 0.65 * alpha,
        }),
      );
    }
    if (e1 > 0.2) {
      nodes.push(
        glowingTrail(arcPts([leftX + 340, rowY(2)], [rightX - 330, tokY(0)], -30, 18), {
          color: EXP_COLORS[1],
          width: 2.8,
          glow: 7,
          core: false,
          opacity: 0.72 * alpha,
        }),
      );
    }
    if (e2w > 0.2) {
      nodes.push(
        glowingTrail(arcPts([leftX + 340, rowY(3)], [rightX - 330, tokY(0)], 30, 18), {
          color: ROLE.router,
          width: 3,
          glow: 8,
          core: false,
          opacity: 0.8 * alpha,
        }),
      );
    }
    if (ls > 0.2) {
      nodes.push(
        glowingTrail(arcPts([leftX + 340, rowY(4)], [rightX - 330, tokY(2)], 20, 18), {
          color: EXP_COLORS[2],
          width: 3,
          glow: 8,
          core: false,
          opacity: 0.8 * alpha,
        }),
      );
    }

    // Footer: prediction vs result vs wrong-write warning (mutually exclusive)
    if (wr > 0.25) {
      nodes.push(
        txt(
          'Overwrite bug -> [0.125, 0.25]   ·   No gates -> [-0.5, -1.0]   ·   Apply each gate once',
          0,
          395,
          28,
          ROLE.overflow,
          'mono',
          'center',
        )
          .glow(7, ROLE.overflow)
          .opacity(clamp((wr - 0.25) / 0.75) * alpha),
      );
    } else if (az > 0.25) {
      nodes.push(
        txt(
          'Scatter-add completes:  t0 = [-0.625, -1.25]  ·  t1 = [6, 8]  ·  t2 = [5.5, 6.6]',
          0,
          395,
          28,
          ROLE.active,
          'mono',
          'center',
        )
          .glow(7, ROLE.active)
          .opacity(clamp((az - 0.25) / 0.75) * alpha),
      );
    } else if (e2w > 0.25) {
      nodes.push(
        txt(
          'Positive return [0.125, 0.25] meets [-0.75, -1.5]. What belongs in t0 now?',
          0,
          395,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(clamp((e2w - 0.25) / 0.75) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Start every token at [0, 0] and accumulate each weighted expert return',
          0,
          395,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.token), title, layer);

  playCue(s, c, 'double-rows', (d) => s.play(pE0.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'negate-zero', (d) => s.play(pE1.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'quarter-return', (d) => s.play(pE2Wait.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'add-zero', (d) => s.play(pAddZero.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'last-return', (d) => s.play(pLast.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'wrong-writes', (d) => s.play(pWrong.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 12: expert-choice: "Who gets a place?"
// STRICT PREDICTION WITHHOLDING: Beat 2 scans columns with '?' counts; Beat 3 reveals t4 = 0!
// ---------------------------------------------------------------------------
export function expertChoice(s, c) {
  const title = heroTitle(['Expert choice:', 'who gets a place?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const choice = moeChoice(); // buckets: [[0,1],[0,2],[2,3]], coverage: [2,1,2,1,0]

  const pRow0 = s.value(0);
  const pRow1 = s.value(0);
  const pRow2 = s.value(0);
  const pScan = s.value(0);
  const pReveal = s.value(0); // WITHHELD until Beat 3 uncovered-four!
  const vis = s.value(1);

  const cellW = 195;
  const cellH = 88;
  const gap = 18;
  const cx = 40;
  const cy = -25;
  const totalW = 5 * cellW + 4 * gap;
  const left = cx - totalW / 2;

  const layer = guardedDynamic(vis, (alpha) => {
    const r0 = pRow0.value;
    const r1 = pRow1.value;
    const r2 = pRow2.value;
    const sc = pScan.value;
    const rv = pReveal.value;

    const rowDone = [r0 > 0.3, r1 > 0.3, r2 > 0.3];
    const isChosen = (r, k) => rowDone[r] && choice.buckets[r].includes(k);

    const values = CHOICE_SCORES.map((row) => row.map((v) => fmt(v, 2)));
    const colors = CHOICE_SCORES.map((row, r) =>
      row.map((_, k) => {
        if (k === 4 && rv > 0.3) return ROLE.overflow;
        if (isChosen(r, k)) return EXP_COLORS[r];
        return '#566894';
      }),
    );

    const nodes = [
      txt(
        'Each expert picks its top-2 highest-scoring tokens (bucket size = 2)',
        cx,
        -245,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx,
        cy,
        rows: 3,
        cols: 5,
        cellW,
        cellH,
        gap,
        values,
        colors,
        rowLabels: ['E0 (2 slots)', 'E1 (2 slots)', 'E2 (2 slots)'],
        colLabels: ['t0', 't1', 't2', 't3', 't4'],
        highlight: (r, k) => isChosen(r, k),
        dim: (r, k) => rowDone[r] && !isChosen(r, k) && !(k === 4 && rv > 0.3),
        fontSize: 30,
        opacity: alpha,
      }),
    ];

    // Coverage row below matrix (strictly '?' until uncovered-four!)
    const covY = 225;
    nodes.push(txt('returns:', left - 36, covY, 28, COSMOS.muted, 'mono', 'right').opacity(alpha));
    for (let k = 0; k < 5; k++) {
      const colX = left + k * (cellW + gap) + cellW / 2;
      const isZero = k === 4 && rv > 0.3;
      const showVal = rv > 0.3;
      const cCol = isZero
        ? ROLE.overflow
        : showVal
          ? ROLE.active
          : sc > 0.25
            ? ROLE.router
            : '#4d608e';
      nodes.push(
        lumBar(colX, covY, cellW, 74, {
          color: cCol,
          fillOpacity: isZero ? 0.38 : showVal ? 0.24 : 0.14,
          strokeWidth: isZero ? 3 : 2,
          glow: isZero ? 12 : showVal ? 6 : 3,
          opacity: alpha,
        }),
        txt(
          showVal ? `${choice.coverage[k]} call${choice.coverage[k] === 1 ? '' : 's'}` : '?',
          colX,
          covY,
          28,
          isZero ? COSMOS.ink : cCol,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Footer prompt vs reveal
    if (rv > 0.25) {
      nodes.push(
        txt(
          't4 gets 0 expert returns (residual only)  ·  equal expert loads != full token coverage',
          0,
          365,
          28,
          ROLE.overflow,
          'mono',
          'center',
        )
          .glow(7, ROLE.overflow)
          .opacity(clamp((rv - 0.25) / 0.75) * alpha),
      );
    } else if (sc > 0.25) {
      nodes.push(
        txt(
          'Look down each token column: which token receives zero expert returns?',
          0,
          365,
          32,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(clamp((sc - 0.25) / 0.75) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Every expert fills exactly 2 rows -> balanced expert compute by construction',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.overflow), title, layer);

  playCue(s, c, 'fill-first', (d) => s.play(pRow0.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'fill-second', (d) => s.play(pRow1.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'fill-third', (d) => s.play(pRow2.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'scan-columns', (d) => s.play(pScan.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'uncovered-four', (d) => s.play(pReveal.to(1, { duration: d })), { dur: 0.75 });
}
